<?php

namespace App\Repositories;

use App\Contracts\Repositories\PurchaseRepositoryInterface;
use App\Contracts\Services\InventoryServiceInterface;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EloquentPurchaseRepository implements PurchaseRepositoryInterface
{
    public function __construct(
        protected InventoryServiceInterface $inventoryService
    ) {
    }

    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Purchase::with(['items.variant.product', 'user', 'receivedBy']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('purchase_number', 'like', "%{$search}%")
                  ->orWhere('supplier_name', 'like', "%{$search}%")
                  ->orWhere('supplier_phone', 'like', "%{$search}%")
                  ->orWhere('supplier_invoice_no', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('purchase_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('purchase_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['payment_method']) && $filters['payment_method'] !== 'all') {
            $query->where('payment_method', $filters['payment_method']);
        }

        return $query->latest('purchase_date')->latest('id')->paginate($perPage);
    }

    public function findById(int $id): ?Purchase
    {
        return Purchase::with(['items.variant.product', 'user', 'receivedBy'])->find($id);
    }

    public function getSummary(array $filters = []): array
    {
        $statsQuery = Purchase::query();

        if (!empty($filters['start_date'])) {
            $statsQuery->whereDate('purchase_date', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $statsQuery->whereDate('purchase_date', '<=', $filters['end_date']);
        }

        $totalSpend = (float) (clone $statsQuery)->sum('total_amount');
        $totalPurchasesCount = (clone $statsQuery)->count();
        $receivedPurchasesCount = (clone $statsQuery)->where('status', 'received')->count();
        $pendingPurchasesCount = (clone $statsQuery)->where('status', 'pending')->count();
        
        $receivedIds = (clone $statsQuery)->where('status', 'received')->pluck('id');
        $totalItemsRestocked = (int) PurchaseItem::whereIn('purchase_id', $receivedIds)->sum('quantity');

        return [
            'total_purchases' => $totalPurchasesCount,
            'received_purchases' => $receivedPurchasesCount,
            'pending_purchases' => $pendingPurchasesCount,
            'total_spend' => $totalSpend,
            'total_items_restocked' => $totalItemsRestocked,
        ];
    }

    public function getRecentSuppliers(int $limit = 20): Collection
    {
        return Purchase::query()
            ->select('supplier_name', DB::raw('MAX(supplier_phone) as supplier_phone'))
            ->whereNotNull('supplier_name')
            ->where('supplier_name', '!=', '')
            ->groupBy('supplier_name')
            ->orderByDesc(DB::raw('MAX(id)'))
            ->limit($limit)
            ->get();
    }

    public function create(array $purchaseData, array $itemsData, int $userId): Purchase
    {
        return DB::transaction(function () use ($purchaseData, $itemsData, $userId) {
            $datePrefix = date('Ymd');
            $countToday = Purchase::whereDate('created_at', today())->count() + 1;
            $purchaseNo = 'PO-' . $datePrefix . '-' . str_pad($countToday, 4, '0', STR_PAD_LEFT);

            $status = $purchaseData['status'] ?? 'pending';
            $isReceived = $status === 'received';

            $totalAmount = 0.0;
            foreach ($itemsData as $it) {
                $totalAmount += ($it['quantity'] * $it['unit_cost']);
            }

            $purchase = Purchase::create([
                'purchase_number' => $purchaseNo,
                'supplier_name' => $purchaseData['supplier_name'],
                'supplier_phone' => $purchaseData['supplier_phone'] ?? null,
                'supplier_invoice_no' => $purchaseData['supplier_invoice_no'] ?? null,
                'purchase_date' => $purchaseData['purchase_date'],
                'status' => $status,
                'total_amount' => $totalAmount,
                'paid_amount' => $purchaseData['paid_amount'] ?? $totalAmount,
                'payment_method' => $purchaseData['payment_method'],
                'notes' => $purchaseData['notes'] ?? null,
                'user_id' => $userId,
                'received_by_user_id' => $isReceived ? $userId : null,
                'received_at' => $isReceived ? now() : null,
            ]);

            foreach ($itemsData as $itemData) {
                $variant = ProductVariant::findOrFail($itemData['product_variant_id']);

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $itemData['quantity'],
                    'unit_cost' => $itemData['unit_cost'],
                    'line_total' => $itemData['quantity'] * $itemData['unit_cost'],
                ]);

                // Stock Replenishment & Weighted Average Costing (WAC) ONLY if received immediately
                if ($isReceived) {
                    $this->inventoryService->addStock(
                        $variant,
                        $itemData['quantity'],
                        $itemData['unit_cost'],
                        $userId,
                        "Stock replenishment via Purchase Order #{$purchaseNo}"
                    );
                }
            }

            return $purchase->load(['items.variant.product', 'user', 'receivedBy']);
        });
    }

    public function receive(Purchase $purchase, int $userId): Purchase
    {
        if ($purchase->status === 'received') {
            throw new \DomainException("Purchase Order #{$purchase->purchase_number} has already been received.");
        }

        return DB::transaction(function () use ($purchase, $userId) {
            $purchase->update([
                'status' => 'received',
                'received_by_user_id' => $userId,
                'received_at' => now(),
            ]);

            $purchase->loadMissing('items.variant');

            foreach ($purchase->items as $item) {
                $variant = $item->variant ?: ProductVariant::findOrFail($item->product_variant_id);

                // Stock Replenishment & Weighted Average Costing (WAC)
                $this->inventoryService->addStock(
                    $variant,
                    $item->quantity,
                    (float) $item->unit_cost,
                    $userId,
                    "Goods received & verified via Purchase Order #{$purchase->purchase_number}"
                );
            }

            return $purchase->fresh(['items.variant.product', 'user', 'receivedBy']);
        });
    }
}
