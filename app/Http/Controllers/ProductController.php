<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        protected ProductRepositoryInterface $productRepo,
        protected CategoryRepositoryInterface $categoryRepo
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
            'variants.*.stock_quantity' => 'required|integer|min:0',
            'variants.*.alert_quantity' => 'nullable|integer|min:0',
        ]);

        $product = $this->productRepo->createWithVariants($validated, $validated['variants']);

        return response()->json([
            'success' => true,
            'message' => 'Product and variants created successfully.',
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
            'variants.*.stock_quantity' => 'required|integer|min:0',
            'variants.*.alert_quantity' => 'nullable|integer|min:0',
        ]);

        $updatedProduct = $this->productRepo->updateWithVariants($product, $validated, $validated['variants']);

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
        $this->productRepo->delete($product);

        return response()->json([
            'success' => true,
            'message' => "Product '{$productName}' deleted successfully.",
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
