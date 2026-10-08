<?php

namespace App\Repositories;

use App\Contracts\Repositories\StockMovementRepositoryInterface;
use App\Models\StockMovement;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentStockMovementRepository implements StockMovementRepositoryInterface
{
    public function log(array $data): StockMovement
    {
        return StockMovement::create($data);
    }

    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = StockMovement::with(['product', 'variant', 'order', 'user']);

        if (!empty($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        if (!empty($filters['product_variant_id'])) {
            $query->where('product_variant_id', $filters['product_variant_id']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        return $query->latest('id')->paginate($perPage);
    }
}
