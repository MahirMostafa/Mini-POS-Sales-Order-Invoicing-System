<?php

namespace App\Contracts\Repositories;

use App\Models\Purchase;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PurchaseRepositoryInterface
{
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator;
    public function findById(int $id): ?Purchase;
    public function getSummary(array $filters = []): array;
    public function getRecentSuppliers(int $limit = 20): Collection;
    public function create(array $purchaseData, array $itemsData, int $userId): Purchase;
    public function receive(Purchase $purchase, int $userId): Purchase;
}
