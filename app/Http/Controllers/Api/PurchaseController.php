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
        $query = Purchase::with(['items.variant.product', 'user']);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('purchase_number', 'like', "%{$search}%")
                  ->orWhere('supplier_name', 'like', "%{$search}%")
                  ->orWhere('supplier_phone', 'like', "%{$search}%")
                  ->orWhere('supplier_invoice_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('purchase_date', '>=', $request->get('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('purchase_date', '<=', $request->get('end_date'));
        }

        if ($request->filled('payment_method') && $request->get('payment_method') !== 'all') {
            $query->where('payment_method', $request->get('payment_method'));
        }

        $perPage = $request->integer('per_page', 15);
        $purchases = $query->latest('purchase_date')->latest('id')->paginate($perPage);

        // Compute summary statistics
        $statsQuery = Purchase::query();
        if ($request->filled('start_date')) {
            $statsQuery->whereDate('purchase_date', '>=', $request->get('start_date'));
        }
        if ($request->filled('end_date')) {
            $statsQuery->whereDate('purchase_date', '<=', $request->get('end_date'));
        }
        $totalSpend = (float) $statsQuery->sum('total_amount');
        $totalPurchasesCount = $statsQuery->count();
        $totalItemsRestocked = (int) PurchaseItem::whereIn('purchase_id', $statsQuery->pluck('id'))->sum('quantity');

        // Distinct recent suppliers for quick auto-fill
        $suppliers = Purchase::query()
            ->select('supplier_name', DB::raw('MAX(supplier_phone) as supplier_phone'))
            ->whereNotNull('supplier_name')
            ->where('supplier_name', '!=', '')
            ->groupBy('supplier_name')
            ->orderByDesc(DB::raw('MAX(id)'))
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'purchases' => $purchases,
            'summary' => [
                'total_purchases' => $totalPurchasesCount,
                'total_spend' => $totalSpend,
                'total_items_restocked' => $totalItemsRestocked,
            ],
            'suppliers' => $suppliers,
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
