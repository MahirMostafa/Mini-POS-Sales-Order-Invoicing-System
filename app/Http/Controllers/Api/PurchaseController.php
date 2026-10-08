<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Services\InventoryServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function __construct(
        protected InventoryServiceInterface $inventoryService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $purchases = Purchase::with(['items.variant.product', 'user'])
            ->latest('id')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'purchases' => $purchases,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_name' => 'required|string|max:255',
            'supplier_phone' => 'nullable|string|max:50',
            'supplier_invoice_no' => 'nullable|string|max:50',
            'purchase_date' => 'required|date',
            'payment_method' => 'required|string|in:cash,bank_transfer,card,credit',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $userId = auth()->id() ?? 1;

            $datePrefix = date('Ymd');
            $countToday = Purchase::whereDate('created_at', today())->count() + 1;
            $purchaseNo = 'PO-' . $datePrefix . '-' . str_pad($countToday, 4, '0', STR_PAD_LEFT);

            $totalAmount = 0.0;
            foreach ($validated['items'] as $it) {
                $totalAmount += ($it['quantity'] * $it['unit_cost']);
            }

            $purchase = Purchase::create([
                'purchase_number' => $purchaseNo,
                'supplier_name' => $validated['supplier_name'],
                'supplier_phone' => $validated['supplier_phone'] ?? null,
                'supplier_invoice_no' => $validated['supplier_invoice_no'] ?? null,
                'purchase_date' => $validated['purchase_date'],
                'status' => 'received',
                'total_amount' => $totalAmount,
                'paid_amount' => $validated['paid_amount'] ?? $totalAmount,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
                'user_id' => $userId,
            ]);

            foreach ($validated['items'] as $itemData) {
                $variant = ProductVariant::findOrFail($itemData['product_variant_id']);

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $itemData['quantity'],
                    'unit_cost' => $itemData['unit_cost'],
                    'line_total' => $itemData['quantity'] * $itemData['unit_cost'],
                ]);

                // Stock Replenishment & Weighted Average Costing (WAC)
                $this->inventoryService->addStock(
                    $variant,
                    $itemData['quantity'],
                    $itemData['unit_cost'],
                    $userId,
                    "Stock replenishment via Purchase Order #{$purchaseNo}"
                );
            }

            return response()->json([
                'success' => true,
                'message' => "Purchase Order #{$purchaseNo} recorded and stock replenished successfully.",
                'purchase' => $purchase->load(['items.variant.product', 'user']),
            ], 201);
        });
    }
}
