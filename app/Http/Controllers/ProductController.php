<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Services\AccountingServiceInterface;
use App\Contracts\Services\AuditServiceInterface;
use App\Contracts\Services\InventoryServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        protected ProductRepositoryInterface $productRepo,
        protected CategoryRepositoryInterface $categoryRepo,
        protected InventoryServiceInterface $inventoryService,
        protected AccountingServiceInterface $accountingService,
        protected AuditServiceInterface $auditService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $products = $this->productRepo->paginate(
            $request->integer('per_page', 10),
            $request->get('search'),
            $request->get('category_id') ? (int) $request->get('category_id') : null
        );

        $categories = $this->categoryRepo->getActive();

        return response()->json([
            'success' => true,
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $product = $this->productRepo->findById($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'product' => $product,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:product_categories,id',
            'brand' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'has_variants' => 'boolean',
            'variants' => 'required|array|min:1',
            'variants.*.variant_name' => 'required|string',
            'variants.*.sku' => 'required|string|unique:product_variants,sku',
            'variants.*.barcode' => 'nullable|string|unique:product_variants,barcode',
            'variants.*.cost_price' => 'required|numeric|min:0',
            'variants.*.selling_price' => 'required|numeric|min:0',
            'variants.*.stock_quantity' => 'nullable|integer|min:0',
            'variants.*.alert_quantity' => 'nullable|integer|min:0',
        ]);

        // Force initial stock to 0 for all variants to enforce accounting compliance
        foreach ($validated['variants'] as &$variant) {
            $variant['stock_quantity'] = 0;
        }
        unset($variant);

        $product = $this->productRepo->createWithVariants($validated, $validated['variants']);

        // Audit Log: Product Created
        $this->auditService->log(
            event: 'product_created',
            auditableType: 'App\Models\Product',
            auditableId: $product->id,
            oldValues: null,
            newValues: [
                'name' => $product->name,
                'brand' => $product->brand,
                'category' => $product->category?->name,
                'variants_count' => count($validated['variants']),
                'variants' => collect($validated['variants'])->map(fn($v) => [
                    'variant_name' => $v['variant_name'],
                    'sku' => $v['sku'],
                    'cost_price' => (float) $v['cost_price'],
                    'selling_price' => (float) $v['selling_price'],
                ])->toArray(),
            ],
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => 'Product and variants created successfully with 0 initial stock. Inventory can be added via Purchase Order or Opening Stock voucher.',
            'product' => $product,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $product = $this->productRepo->findById($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:product_categories,id',
            'brand' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'variants' => 'required|array|min:1',
            'variants.*.id' => 'nullable|integer|exists:product_variants,id',
            'variants.*.variant_name' => 'required|string',
            'variants.*.sku' => 'required|string',
            'variants.*.barcode' => 'nullable|string',
            'variants.*.cost_price' => 'required|numeric|min:0',
            'variants.*.selling_price' => 'required|numeric|min:0',
            'variants.*.stock_quantity' => 'nullable|integer|min:0',
            'variants.*.alert_quantity' => 'nullable|integer|min:0',
        ]);

        // Capture previous prices for diff comparison
        $oldVariantsData = $product->variants->map(fn($v) => [
            'id' => $v->id,
            'variant_name' => $v->variant_name,
            'cost_price' => (float) $v->cost_price,
            'selling_price' => (float) $v->selling_price,
        ])->toArray();

        $updatedProduct = $this->productRepo->updateWithVariants($product, $validated, $validated['variants']);

        $newVariantsData = $updatedProduct->variants->map(fn($v) => [
            'id' => $v->id,
            'variant_name' => $v->variant_name,
            'cost_price' => (float) $v->cost_price,
            'selling_price' => (float) $v->selling_price,
        ])->toArray();

        // Check if price/cost changed
        $hasPriceChanged = json_encode($oldVariantsData) !== json_encode($newVariantsData);

        $this->auditService->log(
            event: $hasPriceChanged ? 'price_changed' : 'product_updated',
            auditableType: 'App\Models\Product',
            auditableId: $updatedProduct->id,
            oldValues: [
                'name' => $product->name,
                'variants' => $oldVariantsData,
            ],
            newValues: [
                'name' => $updatedProduct->name,
                'variants' => $newVariantsData,
            ],
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'product' => $updatedProduct,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $product = $this->productRepo->findById($id);
        if (!$product) {
            return response()->json(['success' => false, 'message' => 'Product not found.'], 404);
        }

        $check = $this->productRepo->canDelete($product);
        if (!$check['can_delete']) {
            $reasonStr = implode(' and ', $check['reasons']);
            return response()->json([
                'success' => false,
                'message' => "Cannot delete product '{$product->name}' because it has existing {$reasonStr}. Consider deactivating it instead to preserve transaction and financial ledger integrity.",
            ], 422);
        }

        $productName = $product->name;
        $oldData = [
            'name' => $product->name,
            'brand' => $product->brand,
            'category' => $product->category?->name,
        ];

        $this->productRepo->delete($product);

        // Audit Log: Product Deleted
        $this->auditService->log(
            event: 'product_deleted',
            auditableType: 'App\Models\Product',
            auditableId: $id,
            oldValues: $oldData,
            newValues: null,
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "Product '{$productName}' deleted successfully.",
        ]);
    }

    public function addStock(Request $request, int $variantId): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'purchase_cost' => 'required|numeric|min:0',
            'note' => 'nullable|string|max:255',
        ]);

        $variant = ProductVariant::with('product')->find($variantId);
        if (!$variant) {
            return response()->json(['success' => false, 'message' => 'Product variant not found.'], 404);
        }

        $userId = auth()->id() ?? 1;
        $qty = (int) $validated['quantity'];
        $cost = (float) $validated['purchase_cost'];
        $note = $validated['note'] ?? 'Opening Stock initialization';

        // 1. Update inventory stock and log movement
        $this->inventoryService->addStock($variant, $qty, $cost, $userId, "Opening Stock: {$note}");

        // 2. Post double-entry accounting journal voucher (Debit: 1060 Merchandise Inventory, Credit: 3010 Owner's Capital)
        $journalEntry = $this->accountingService->recordOpeningStockJournalEntry(
            $variant->fresh(),
            $qty,
            $cost,
            $userId,
            $note
        );

        return response()->json([
            'success' => true,
            'message' => "Successfully recorded Opening Stock of {$qty} units (৳" . number_format($qty * $cost, 2) . ") with Journal Entry #{$journalEntry->entry_number}.",
            'variant' => $variant->fresh(['product']),
            'journal_entry' => $journalEntry,
        ]);
    }

    public function adjustStock(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'variant_id' => 'required|exists:product_variants,id',
            'new_stock' => 'required|integer|min:0',
            'reason' => 'required|string|max:255',
        ]);

        $userId = auth()->id() ?? 1;
        $result = $this->productRepo->adjustStock(
            (int) $validated['variant_id'],
            (int) $validated['new_stock'],
            $validated['reason'],
            $userId
        );

        return response()->json($result);
    }
}
