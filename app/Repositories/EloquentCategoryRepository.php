<?php

namespace App\Repositories;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Models\ProductCategory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class EloquentCategoryRepository implements CategoryRepositoryInterface
{
    public function all(): Collection
    {
        return ProductCategory::orderBy('name')->get();
    }

    public function getActive(): Collection
    {
        return ProductCategory::where('is_active', true)->orderBy('name')->get();
    }

    public function getWithProductsCount(?string $search = null, ?bool $isActive = null): Collection
    {
        $query = ProductCategory::withCount('products');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($isActive !== null) {
            $query->where('is_active', $isActive);
        }

        return $query->orderBy('name', 'asc')->get();
    }

    public function findById(int $id): ?ProductCategory
    {
        return ProductCategory::withCount('products')
            ->with(['products' => function ($q) {
                $q->with('variants');
            }])
            ->find($id);
    }

    public function findBySlug(string $slug): ?ProductCategory
    {
        return ProductCategory::where('slug', $slug)->first();
    }

    public function create(array $data): ProductCategory
    {
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        } else {
            $data['slug'] = Str::slug($data['slug']);
        }

        // Ensure unique slug
        $originalSlug = $data['slug'];
        $counter = 1;
        while (ProductCategory::where('slug', $data['slug'])->exists()) {
            $data['slug'] = "{$originalSlug}-{$counter}";
            $counter++;
        }

        return ProductCategory::create($data);
    }

    public function update(ProductCategory $category, array $data): bool
    {
        if (!empty($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        } elseif (!empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        if (!empty($data['slug']) && $data['slug'] !== $category->slug) {
            $originalSlug = $data['slug'];
            $counter = 1;
            while (ProductCategory::where('slug', $data['slug'])->where('id', '!=', $category->id)->exists()) {
                $data['slug'] = "{$originalSlug}-{$counter}";
                $counter++;
            }
        }

        return $category->update($data);
    }

    public function delete(ProductCategory $category): bool
    {
        return $category->delete();
    }

    public function getMetrics(): array
    {
        $all = ProductCategory::withCount('products')->get();

        return [
            'total_categories' => $all->count(),
            'active_categories' => $all->where('is_active', true)->count(),
            'inactive_categories' => $all->where('is_active', false)->count(),
            'total_linked_products' => (int) $all->sum('products_count'),
        ];
    }
}
