<?php

namespace App\Contracts\Services;

use App\Models\Order;
use App\Models\ProductVariant;

interface InventoryServiceInterface
{
    /**
     * Deduct stock for all items in an order upon completion
     */
    public function deductOrderStock(Order $order, int $userId): void;

    /**
     * Check if product variant has enough stock
     */
    public function hasSufficientStock(ProductVariant $variant, int $requestedQty): bool;

    /**
     * Add stock via purchase or adjustment
     */
    public function addStock(ProductVariant $variant, int $quantity, float $purchaseCost, int $userId, string $note = ''): void;
}
