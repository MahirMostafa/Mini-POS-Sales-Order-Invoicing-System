<?php

namespace App\Repositories;

use App\Contracts\Repositories\ProductVariantRepositoryInterface;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Collection;

class EloquentProductVariantRepository implements ProductVariantRepositoryInterface
{
    public function findById(int $id): ?ProductVariant
    {
        return ProductVariant::with('product')->find($id);
    }

    public function findBySku(string $sku): ?ProductVariant
    {
        return ProductVariant::with('product')->where('sku', $sku)->first();
    }

    public function findByBarcode(string $barcode): ?ProductVariant
    {
        return ProductVariant::with('product')->where('barcode', $barcode)->first();
    }

    public function updateStock(ProductVariant $variant, int $newQuantity): bool
    {
        return $variant->update(['stock_quantity' => $newQuantity]);
    }

    public function decrementStock(ProductVariant $variant, int $quantity): bool
    {
        return $variant->decrement('stock_quantity', $quantity);
    }

    public function incrementStock(ProductVariant $variant, int $quantity): bool
    {
        return $variant->increment('stock_quantity', $quantity);
    }

    public function getLowStockVariants(): Collection
    {
        return ProductVariant::with('product')
            ->whereColumn('stock_quantity', '<=', 'alert_quantity')
            ->where('is_active', true)
            ->get();
    }
}
