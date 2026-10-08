<?php

namespace App\Services;

use App\Contracts\Repositories\ProductVariantRepositoryInterface;
use App\Contracts\Repositories\StockMovementRepositoryInterface;
use App\Contracts\Services\InventoryServiceInterface;
use App\Models\Order;
use App\Models\ProductVariant;
use InvalidArgumentException;

class InventoryService implements InventoryServiceInterface
{
    public function __construct(
        protected ProductVariantRepositoryInterface $variantRepo,
        protected StockMovementRepositoryInterface $movementRepo
    ) {
    }

    public function deductOrderStock(Order $order, int $userId): void
    {
        foreach ($order->items as $item) {
            $variant = $item->variant;
            if (!$variant && $item->product_variant_id) {
                $variant = $this->variantRepo->findById($item->product_variant_id);
            }

            if ($variant) {
                $stockBefore = $variant->stock_quantity;
                $stockAfter = max(0, $stockBefore - $item->quantity);

                $this->variantRepo->updateStock($variant, $stockAfter);

                $this->movementRepo->log([
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'order_id' => $order->id,
                    'user_id' => $userId,
                    'type' => 'OUT',
                    'quantity' => $item->quantity,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'unit_cost' => $variant->cost_price,
                    'reference_number' => $order->order_number,
                    'notes' => "Stock deducted for Order #{$order->order_number} ({$variant->fullName})",
                ]);
            }
        }
    }

    public function hasSufficientStock(ProductVariant $variant, int $requestedQty): bool
    {
        return $variant->stock_quantity >= $requestedQty;
    }

    public function addStock(ProductVariant $variant, int $quantity, float $purchaseCost, int $userId, string $note = ''): void
    {
        if ($quantity <= 0) {
            throw new InvalidArgumentException("Quantity must be greater than zero.");
        }

        $stockBefore = $variant->stock_quantity;
        $stockAfter = $stockBefore + $quantity;

        // Calculate Weighted Average Cost (WAC)
        $currentTotalCost = $stockBefore * (float) $variant->cost_price;
        $newTotalCost = $quantity * $purchaseCost;
        $newAvgCost = $stockAfter > 0 ? ($currentTotalCost + $newTotalCost) / $stockAfter : $purchaseCost;

        $variant->update([
            'stock_quantity' => $stockAfter,
            'cost_price' => round($newAvgCost, 2),
        ]);

        $this->movementRepo->log([
            'product_id' => $variant->product_id,
            'product_variant_id' => $variant->id,
            'order_id' => null,
            'user_id' => $userId,
            'type' => 'IN',
            'quantity' => $quantity,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'unit_cost' => $purchaseCost,
            'reference_number' => 'PUR-' . date('Ymd') . '-' . rand(1000, 9999),
            'notes' => $note ?: "Stock replenishment for {$variant->fullName}",
        ]);
    }
}
