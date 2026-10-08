<?php

namespace App\Contracts\Repositories;

use App\Models\StockMovement;
use Illuminate\Pagination\LengthAwarePaginator;

interface StockMovementRepositoryInterface
{
    public function log(array $data): StockMovement;
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator;
}
