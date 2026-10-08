<?php

namespace App\Contracts\Services;

use App\Models\Order;

interface OrderServiceInterface
{
    /**
     * Create a new sales order with line items and real-time calculations in a DB transaction
     */
    public function createOrder(array $data, int $userId): Order;

    /**
     * Check if all items in order have sufficient inventory
     */
    public function validateStockAvailability(Order $order): array;

    /**
     * Complete an order: verifies stock, deducts inventory, generates invoice, and posts double-entry journal entry
     */
    public function completeOrder(Order $order, ?float $paidAmount = null, ?string $paymentMethod = null): array;

    /**
     * Cancel a pending order
     */
    public function cancelOrder(Order $order, string $reason = ''): bool;
}
