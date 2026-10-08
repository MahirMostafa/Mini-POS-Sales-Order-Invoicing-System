<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Repositories\ProductVariantRepositoryInterface;
use App\Contracts\Services\InventoryServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            $request->integer('per_page', 15),
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
