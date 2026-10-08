<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Repositories\ProductVariantRepositoryInterface;
use App\Contracts\Services\InventoryServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use App\Models\PurchaseItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function __construct(
        protected ProductRepositoryInterface $productRepo,
        protected ProductVariantRepositoryInterface $variantRepo,
        protected InventoryServiceInterface $inventoryService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $products = $this->productRepo->paginate(
            $request->integer('per_page', 10),
            $request->get('search'),
            $request->get('category_id') ? (int) $request->get('category_id') : null
        );

        $categories = ProductCategory::where('is_active', true)->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::with(['category', 'variants'])->findOrFail($id);

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
            'variants.*.stock_quantity' => 'required|integer|min:0',
            'variants.*.alert_quantity' => 'nullable|integer|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $productData = [
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']) . '-' . rand(100, 999),
                'category_id' => $validated['category_id'] ?? null,
                'brand' => $validated['brand'] ?? null,
                'description' => $validated['description'] ?? null,
                'has_variants' => count($validated['variants']) > 1 || ($validated['has_variants'] ?? false),
                'base_cost_price' => $validated['variants'][0]['cost_price'] ?? 0,
                'base_selling_price' => $validated['variants'][0]['selling_price'] ?? 0,
                'is_active' => true,
            ];

            $product = Product::create($productData);

            foreach ($validated['variants'] as $variantData) {
                $variantData['product_id'] = $product->id;
                $variantData['alert_quantity'] = $variantData['alert_quantity'] ?? 5;
                $variantData['is_active'] = true;
                ProductVariant::create($variantData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Product and variants created successfully.',
                'product' => $product->load(['category', 'variants']),
            ], 201);
        });
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::with('variants')->findOrFail($id);

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
            'variants.*.stock_quantity' => 'required|integer|min:0',
            'variants.*.alert_quantity' => 'nullable|integer|min:0',
        ]);

        return DB::transaction(function () use ($validated, $product) {
            $product->update([
                'name' => $validated['name'],
                'category_id' => $validated['category_id'] ?? null,
                'brand' => $validated['brand'] ?? null,
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'has_variants' => count($validated['variants']) > 1,
            ]);

            $keptVariantIds = [];
            foreach ($validated['variants'] as $varData) {
                if (!empty($varData['id'])) {
                    // Update existing variant
                    $variant = ProductVariant::where('product_id', $product->id)->findOrFail($varData['id']);
                    $variant->update([
                        'variant_name' => $varData['variant_name'],
                        'sku' => $varData['sku'],
                        'barcode' => $varData['barcode'] ?? null,
                        'cost_price' => $varData['cost_price'],
                        'selling_price' => $varData['selling_price'],
                        'stock_quantity' => $varData['stock_quantity'],
                        'alert_quantity' => $varData['alert_quantity'] ?? 5,
                    ]);
                    $keptVariantIds[] = $variant->id;
                } else {
                    // Create newly added variant row
                    $newVariant = ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_name' => $varData['variant_name'],
                        'sku' => $varData['sku'],
                        'barcode' => $varData['barcode'] ?? null,
                        'cost_price' => $varData['cost_price'],
                        'selling_price' => $varData['selling_price'],
                        'stock_quantity' => $varData['stock_quantity'],
                        'alert_quantity' => $varData['alert_quantity'] ?? 5,
                        'is_active' => true,
                    ]);
                    $keptVariantIds[] = $newVariant->id;
                }
            }

            // Delete removed variants that have no sales/purchase history
            $removedVariants = $product->variants()->whereNotIn('id', $keptVariantIds)->get();
            foreach ($removedVariants as $removed) {
                $hasSales = OrderItem::where('product_variant_id', $removed->id)->exists();
                $hasPurchases = PurchaseItem::where('product_variant_id', $removed->id)->exists();

                if ($hasSales || $hasPurchases) {
                    $removed->update(['is_active' => false]);
                } else {
                    $removed->delete();
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Product '{$product->name}' updated successfully.",
                'product' => $product->fresh(['category', 'variants']),
            ]);
        });
    }

    public function destroy(int $id): JsonResponse
    {
        $product = Product::with('variants')->findOrFail($id);
        $variantIds = $product->variants->pluck('id')->toArray();

        // 1. Check if product or its variants have existing sales order items
        $hasSalesOrders = OrderItem::where('product_id', $product->id)
            ->orWhereIn('product_variant_id', $variantIds)
            ->exists();

        // 2. Check if product or its variants have existing supplier purchase items
        $hasPurchases = PurchaseItem::where('product_id', $product->id)
            ->orWhereIn('product_variant_id', $variantIds)
            ->exists();

        if ($hasSalesOrders || $hasPurchases) {
            $reasons = [];
            if ($hasSalesOrders) $reasons[] = 'sales order records';
            if ($hasPurchases) $reasons[] = 'purchase order history';
            $reasonText = implode(' and ', $reasons);

            return response()->json([
                'success' => false,
                'message' => "Cannot delete product \"{$product->name}\" because it has associated {$reasonText}. To preserve accounting integrity, you can deactivate it instead.",
            ], 422);
        }

        return DB::transaction(function () use ($product) {
            $productName = $product->name;
            $product->variants()->delete();
            $product->delete();

            return response()->json([
                'success' => true,
                'message' => "Product \"{$productName}\" and its variants were deleted successfully.",
            ]);
        });
    }

    public function addStock(Request $request, int $variantId): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'purchase_cost' => 'required|numeric|min:0',
            'note' => 'nullable|string|max:500',
        ]);

        $variant = $this->variantRepo->findById($variantId);
        if (!$variant) {
            return response()->json(['success' => false, 'message' => 'Product variant not found.'], 404);
        }

        $userId = auth()->id() ?? 1;
        $this->inventoryService->addStock(
            $variant,
            $validated['quantity'],
            $validated['purchase_cost'],
            $userId,
            $validated['note'] ?? ''
        );

        return response()->json([
            'success' => true,
            'message' => "Successfully added {$validated['quantity']} units to {$variant->fullName}.",
            'variant' => $variant->fresh(),
        ]);
    }
}
