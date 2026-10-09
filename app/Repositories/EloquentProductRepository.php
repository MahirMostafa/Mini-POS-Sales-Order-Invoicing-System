<?php

namespace App\Repositories;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Services\InventoryServiceInterface;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EloquentProductRepository implements ProductRepositoryInterface
{
    public function __construct(
        protected ?InventoryServiceInterface $inventoryService = null
    ) {
    }

    public function all(): Collection
    {
        return Product::with(['category', 'variants'])->orderBy('name')->get();
    }

    public function getActiveWithVariants(): Collection
    {
        return Product::with(['category', 'variants' => function ($q) {
            $q->where('is_active', true);
        }])
        ->where('is_active', true)
        ->orderBy('name')
        ->get();
    }

    public function paginate(int $perPage = 15, ?string $search = null, ?int $categoryId = null): LengthAwarePaginator
    {
        $query = Product::with(['category', 'variants']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhereHas('variants', function ($vq) use ($search) {
                      $vq->where('sku', 'like', "%{$search}%")
                         ->orWhere('barcode', 'like', "%{$search}%")
                         ->orWhere('variant_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById(int $id): ?Product
    {
        return Product::with(['category', 'variants'])->find($id);
    }

    public function findBySlug(string $slug): ?Product
    {
        return Product::with(['category', 'variants'])->where('slug', $slug)->first();
    }

    public function create(array $data): Product
    {
        return Product::create($data);
    }

    public function update(Product $product, array $data): bool
    {
        return $product->update($data);
    }

    public function delete(Product $product): bool
    {
        return $product->delete();
    }

    public function searchForPos(string $query): Collection
    {
        return Product::with(['category', 'variants' => function ($vq) {
            $vq->where('is_active', true);
        }])
        ->where('is_active', true)
        ->where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
              ->orWhere('brand', 'like', "%{$query}%")
              ->orWhereHas('variants', function ($vq) use ($query) {
                  $vq->where('sku', 'like', "%{$query}%")
                     ->orWhere('barcode', 'like', "%{$query}%")
                     ->orWhere('variant_name', 'like', "%{$query}%");
              });
        })
        ->limit(20)
        ->get();
    }

    public function createWithVariants(array $productData, array $variantsData): Product
    {
        return DB::transaction(function () use ($productData, $variantsData) {
            $slug = Str::slug($productData['name']) . '-' . rand(100, 999);
            $hasVariants = count($variantsData) > 1 || (!empty($productData['has_variants']));

            $product = Product::create([
                'name' => $productData['name'],
                'slug' => $slug,
                'category_id' => $productData['category_id'] ?? null,
                'brand' => $productData['brand'] ?? null,
                'description' => $productData['description'] ?? null,
                'has_variants' => $hasVariants,
                'base_cost_price' => $variantsData[0]['cost_price'] ?? 0,
                'base_selling_price' => $variantsData[0]['selling_price'] ?? 0,
                'is_active' => $productData['is_active'] ?? true,
            ]);

            foreach ($variantsData as $variantData) {
                $variantData['product_id'] = $product->id;
                $variantData['stock_quantity'] = 0;
                $variantData['alert_quantity'] = $variantData['alert_quantity'] ?? 5;
                $variantData['is_active'] = $variantData['is_active'] ?? true;
                ProductVariant::create($variantData);
            }

            return $product->load(['category', 'variants']);
        });
    }

    public function updateWithVariants(Product $product, array $productData, array $variantsData): Product
    {
        return DB::transaction(function () use ($product, $productData, $variantsData) {
            $hasVariants = count($variantsData) > 1;

            $product->update([
                'name' => $productData['name'],
                'category_id' => $productData['category_id'] ?? null,
                'brand' => $productData['brand'] ?? null,
                'description' => $productData['description'] ?? null,
                'has_variants' => $hasVariants,
                'base_cost_price' => $variantsData[0]['cost_price'] ?? 0,
                'base_selling_price' => $variantsData[0]['selling_price'] ?? 0,
                'is_active' => $productData['is_active'] ?? $product->is_active,
            ]);

            $existingIds = $product->variants->pluck('id')->toArray();
            $updatedIds = [];

            foreach ($variantsData as $variantData) {
                if (!empty($variantData['id']) && in_array($variantData['id'], $existingIds)) {
                    $variant = ProductVariant::find($variantData['id']);
                    $variant->update([
                        'variant_name' => $variantData['variant_name'],
                        'sku' => $variantData['sku'],
                        'barcode' => $variantData['barcode'] ?? null,
                        'cost_price' => $variantData['cost_price'],
                        'selling_price' => $variantData['selling_price'],
                        'alert_quantity' => $variantData['alert_quantity'] ?? 5,
                    ]);
                    $updatedIds[] = $variant->id;
                } else {
                    $newVariant = ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_name' => $variantData['variant_name'],
                        'sku' => $variantData['sku'],
                        'barcode' => $variantData['barcode'] ?? null,
                        'cost_price' => $variantData['cost_price'],
                        'selling_price' => $variantData['selling_price'],
                        'stock_quantity' => 0,
                        'alert_quantity' => $variantData['alert_quantity'] ?? 5,
                        'is_active' => true,
                    ]);
                    $updatedIds[] = $newVariant->id;
                }
            }

            // Remove unreferenced variants if no sales/purchases
            $toRemove = array_diff($existingIds, $updatedIds);
            foreach ($toRemove as $removeId) {
                $removed = ProductVariant::find($removeId);
                if ($removed) {
                    $hasSales = OrderItem::where('product_variant_id', $removed->id)->exists();
                    $hasPurchases = PurchaseItem::where('product_variant_id', $removed->id)->exists();
                    if (!$hasSales && !$hasPurchases) {
                        $removed->delete();
                    } else {
                        $removed->update(['is_active' => false]);
                    }
                }
            }

            return $product->fresh(['category', 'variants']);
        });
    }

    public function canDelete(Product $product): array
    {
        $hasSalesOrders = OrderItem::where('product_id', $product->id)->exists();
        $hasPurchases = PurchaseItem::where('product_id', $product->id)->exists();

        $reasons = [];
        if ($hasSalesOrders) $reasons[] = 'sales order history';
        if ($hasPurchases) $reasons[] = 'purchase order history';

        return [
            'can_delete' => empty($reasons),
            'reasons' => $reasons,
        ];
    }

    public function adjustStock(int $variantId, int $newStock, string $reason, int $userId): array
    {
        $variant = ProductVariant::findOrFail($variantId);
        $diff = $newStock - $variant->stock_quantity;

        if ($diff === 0) {
            return ['success' => true, 'message' => 'No change in stock quantity.', 'variant' => $variant];
        }

        if ($this->inventoryService) {
            $this->inventoryService->adjustStock($variant, $newStock, $userId, $reason);
        } else {
            $variant->update(['stock_quantity' => $newStock]);
        }

        return ['success' => true, 'message' => 'Stock quantity adjusted successfully.', 'variant' => $variant->fresh()];
    }
}
