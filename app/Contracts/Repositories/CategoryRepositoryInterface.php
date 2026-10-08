<?php

namespace App\Contracts\Repositories;

use App\Models\ProductCategory;
use Illuminate\Database\Eloquent\Collection;

interface CategoryRepositoryInterface
{
    public function all(): Collection;
    public function getActive(): Collection;
    public function getWithProductsCount(?string $search = null, ?bool $isActive = null): Collection;
    public function findById(int $id): ?ProductCategory;
    public function findBySlug(string $slug): ?ProductCategory;
    public function create(array $data): ProductCategory;
    public function update(ProductCategory $category, array $data): bool;
    public function delete(ProductCategory $category): bool;
    public function getMetrics(): array;
}
