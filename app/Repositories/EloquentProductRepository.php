<?php

namespace App\Repositories;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentProductRepository implements ProductRepositoryInterface
{
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
}
