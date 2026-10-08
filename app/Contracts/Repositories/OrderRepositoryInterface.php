<?php

namespace App\Contracts\Repositories;

use App\Models\Order;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface OrderRepositoryInterface
{
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator;
    public function findById(int $id): ?Order;
    public function findByOrderNumber(string $orderNumber): ?Order;
    public function create(array $orderData, array $itemsData): Order;
    public function updateStatus(Order $order, string $status, ?string $paymentStatus = null): bool;
    public function getRecent(int $limit = 10): Collection;
    public function getSalesSummaryByDateRange(string $startDate, string $endDate): array;
}
