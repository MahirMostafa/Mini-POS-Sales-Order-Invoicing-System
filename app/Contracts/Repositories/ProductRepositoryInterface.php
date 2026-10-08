<?php

namespace App\Contracts\Repositories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    public function all(): Collection;
    public function getActiveWithVariants(): Collection;
    public function paginate(int $perPage = 15, ?string $search = null, ?int $categoryId = null): LengthAwarePaginator;
    public function findById(int $id): ?Product;
    public function findBySlug(string $slug): ?Product;
    public function create(array $data): Product;
    public function update(Product $product, array $data): bool;
    public function delete(Product $product): bool;
    public function searchForPos(string $query): Collection;
    public function createWithVariants(array $productData, array $variantsData): Product;
    public function updateWithVariants(Product $product, array $productData, array $variantsData): Product;
    public function canDelete(Product $product): array;
    public function adjustStock(int $variantId, int $newStock, string $reason, int $userId): array;
}
