<?php

namespace App\Contracts\Repositories;

use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;

interface ProductVariantRepositoryInterface
{
    public function findById(int $id): ?ProductVariant;
    public function findBySku(string $sku): ?ProductVariant;
    public function findByBarcode(string $barcode): ?ProductVariant;
    public function updateStock(ProductVariant $variant, int $newQuantity): bool;
    public function decrementStock(ProductVariant $variant, int $quantity): bool;
    public function incrementStock(ProductVariant $variant, int $quantity): bool;
    public function getLowStockVariants(): Collection;
}
