<?php

namespace App\Services;

use App\Contracts\Repositories\OrderRepositoryInterface;
use App\Contracts\Repositories\ProductVariantRepositoryInterface;
use App\Contracts\Repositories\TaxRateRepositoryInterface;
use App\Contracts\Services\AccountingServiceInterface;
use App\Contracts\Services\AuditServiceInterface;
use App\Contracts\Services\InventoryServiceInterface;
use App\Contracts\Services\InvoiceServiceInterface;
use App\Contracts\Services\OrderServiceInterface;
use App\Models\Order;
use App\Models\ProductVariant;
use Exception;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class OrderService implements OrderServiceInterface
{
    public function __construct(
        protected OrderRepositoryInterface $orderRepo,
        protected ProductVariantRepositoryInterface $variantRepo,
        protected TaxRateRepositoryInterface $taxRateRepo,
        protected InventoryServiceInterface $inventoryService,
        protected InvoiceServiceInterface $invoiceService,
        protected AccountingServiceInterface $accountingService,
        protected AuditServiceInterface $auditService
    ) {
    }

    public function createOrder(array $data, int $userId): Order
    {
        return DB::transaction(function () use ($data, $userId) {
            $items = $data['items'] ?? [];
            if (empty($items)) {
                throw new InvalidArgumentException("At least one product item is required to place an order.");
            }

            // 1. Resolve Tax Rate
            $taxRateId = $data['tax_rate_id'] ?? null;
            $taxRateObj = $taxRateId ? $this->taxRateRepo->findById($taxRateId) : $this->taxRateRepo->getDefault();
            $taxPercent = $taxRateObj ? (float) $taxRateObj->rate : 5.00;

            // 2. Compute Line Totals & Subtotal
            $subtotal = 0.0;
            $orderItems = [];

            foreach ($items as $item) {
                $variant = $this->variantRepo->findById((int) $item['product_variant_id']);
                if (!$variant) {
                    throw new InvalidArgumentException("Product variant ID {$item['product_variant_id']} not found.");
                }

                $quantity = max(1, (int) ($item['quantity'] ?? 1));
                $unitPrice = isset($item['unit_price']) ? (float) $item['unit_price'] : (float) $variant->selling_price;
                $itemDiscount = (float) ($item['discount'] ?? 0.00);
                $lineTotal = max(0, ($unitPrice * $quantity) - $itemDiscount);

                $subtotal += $lineTotal;

                $orderItems[] = [
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'product_name' => $variant->product->name,
                    'variant_name' => $variant->variant_name,
                    'product_sku' => $variant->sku,
                    'quantity' => $quantity,
                    'unit_cost' => $variant->cost_price,
                    'unit_price' => $unitPrice,
                    'discount' => $itemDiscount,
                    'tax_amount' => round($lineTotal * ($taxPercent / 100), 2),
                    'line_total' => $lineTotal,
                ];
            }

            // 3. Compute Overall Discounts, Tax, and Grand Total
            $discountRate = (float) ($data['discount_rate'] ?? 0.00);
            $orderDiscount = (float) ($data['discount_amount'] ?? 0.00);
            if ($discountRate > 0 && $orderDiscount == 0) {
                $orderDiscount = round($subtotal * ($discountRate / 100), 2);
            }

            $taxableAmount = max(0, $subtotal - $orderDiscount);
            $taxAmount = round($taxableAmount * ($taxPercent / 100), 2);
            $grandTotal = round($taxableAmount + $taxAmount, 2);

            $paidAmount = min($grandTotal, max(0, (float) ($data['paid_amount'] ?? 0.00)));
            $changeAmount = max(0, (float) ($data['paid_amount'] ?? 0.00) - $grandTotal);

            $paymentStatus = 'unpaid';
            if ($paidAmount >= $grandTotal && $grandTotal > 0) {
                $paymentStatus = 'paid';
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'partially_paid';
            }

            $orderData = [
                'customer_id' => $data['customer_id'],
                'user_id' => $userId,
                'tax_rate_id' => $taxRateObj?->id,
                'order_date' => $data['order_date'] ?? now()->toDateString(),
                'due_date' => $data['due_date'] ?? null,
                'status' => 'pending', // Stock is NOT deducted in pending state
                'payment_status' => $paymentStatus,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'subtotal' => $subtotal,
                'discount_rate' => $discountRate,
                'discount_amount' => $orderDiscount,
                'tax_rate' => $taxPercent,
                'tax_amount' => $taxAmount,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'notes' => $data['notes'] ?? null,
            ];

            // 4. Create Order & Items in DB
            $order = $this->orderRepo->create($orderData, $orderItems);

            // 5. Asynchronous Queued Audit Log
            $this->auditService->log(
                event: 'created',
                auditableType: Order::class,
                auditableId: $order->id,
                oldValues: null,
                newValues: $order->toArray(),
                userId: $userId
            );

            // 6. If user requested instant checkout (action = complete)
            if (!empty($data['auto_complete'])) {
                $completeResult = $this->completeOrder($order, $paidAmount, $orderData['payment_method']);
                if (!$completeResult['success']) {
                    throw new RuntimeException($completeResult['message']);
                }
            }

            return $order->fresh(['customer', 'user', 'items.variant.product', 'invoice', 'taxRate']);
        });
    }

    public function validateStockAvailability(Order $order): array
    {
        $insufficientItems = [];

        foreach ($order->items as $item) {
            $variant = $item->variant ?: $this->variantRepo->findById($item->product_variant_id);
            if (!$variant) {
                $insufficientItems[] = [
                    'item' => $item->product_name,
                    'requested' => $item->quantity,
                    'available' => 0,
                    'message' => "Product variant for '{$item->product_name}' no longer exists."
                ];
                continue;
            }

            if ($variant->stock_quantity < $item->quantity) {
                $insufficientItems[] = [
                    'item' => $variant->fullName,
                    'requested' => $item->quantity,
                    'available' => $variant->stock_quantity,
                    'message' => "Insufficient stock for '{$variant->fullName}'. Available: {$variant->stock_quantity}, Requested: {$item->quantity}."
                ];
            }
        }

        return [
            'is_available' => empty($insufficientItems),
            'items' => $insufficientItems,
        ];
    }

    public function completeOrder(Order $order, ?float $paidAmount = null, ?string $paymentMethod = null): array
    {
        if ($order->status === 'completed') {
            return [
                'success' => true,
                'message' => "Order #{$order->order_number} is already completed.",
                'order' => $order,
            ];
        }

        if ($order->status === 'cancelled') {
            return [
                'success' => false,
                'message' => "Cannot complete a cancelled order.",
            ];
        }

        // 1. Strict Stock Availability Check
        $stockCheck = $this->validateStockAvailability($order);
        if (!$stockCheck['is_available']) {
            $errorDetails = collect($stockCheck['items'])->pluck('message')->implode(' ');
            return [
                'success' => false,
                'message' => "Order completion failed due to insufficient stock: {$errorDetails}",
                'errors' => $stockCheck['items'],
            ];
        }

        try {
            DB::beginTransaction();

            $userId = auth()->id() ?? $order->user_id;

            // 2. Deduct Live Stock & Record Movement Logs
            $this->inventoryService->deductOrderStock($order, $userId);

            // 3. Update Order Status
            $paymentStatus = $order->payment_status;
            if ($paidAmount !== null) {
                $order->paid_amount = $paidAmount;
                if ($paidAmount >= (float) $order->grand_total && (float) $order->grand_total > 0) {
                    $paymentStatus = 'paid';
                } elseif ($paidAmount > 0) {
                    $paymentStatus = 'partially_paid';
                }
            }
            if ($paymentMethod) {
                $order->payment_method = $paymentMethod;
            }

            $this->orderRepo->updateStatus($order, 'completed', $paymentStatus);
            $order->save();

            // 4. Generate Formal Invoice
            $invoice = $this->invoiceService->generateFromOrder($order);

            // 5. Post Balanced Double-Entry Journal Entry
            $journalEntry = $this->accountingService->recordOrderCompletionJournalEntry($order);

            // 6. Asynchronous Queued Audit Logging
            $this->auditService->log(
                event: 'order_completed',
                auditableType: Order::class,
                auditableId: $order->id,
                oldValues: ['status' => 'pending'],
                newValues: [
                    'status' => 'completed',
                    'completed_at' => now()->toIso8601String(),
                    'invoice_id' => $invoice->id,
                    'journal_entry_id' => $journalEntry->id,
                ],
                userId: $userId
            );

            DB::commit();

            return [
                'success' => true,
                'message' => "Order #{$order->order_number} completed successfully. Stock deducted, Invoice #{$invoice->invoice_number} generated, and Double-Entry Ledger posted.",
                'order' => $order->fresh(['invoice', 'items.variant.product']),
                'invoice' => $invoice,
                'journal_entry' => $journalEntry,
            ];
        } catch (Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => "Failed to complete order: " . $e->getMessage(),
            ];
        }
    }

    public function cancelOrder(Order $order, string $reason = ''): bool
    {
        if ($order->status !== 'pending') {
            throw new RuntimeException("Only pending orders can be cancelled.");
        }

        $old = ['status' => $order->status];
        $this->orderRepo->updateStatus($order, 'cancelled');

        $this->auditService->log(
            event: 'status_changed',
            auditableType: Order::class,
            auditableId: $order->id,
            oldValues: $old,
            newValues: ['status' => 'cancelled', 'reason' => $reason],
            userId: auth()->id() ?? $order->user_id
        );

        return true;
    }
}
