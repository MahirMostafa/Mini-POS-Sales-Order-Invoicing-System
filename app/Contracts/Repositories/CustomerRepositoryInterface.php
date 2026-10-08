<?php

namespace App\Contracts\Repositories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface CustomerRepositoryInterface
{
    public function all(): Collection;
    public function getActive(): Collection;
    public function paginate(int $perPage = 15, ?string $search = null): LengthAwarePaginator;
    public function findById(int $id): ?Customer;
    public function findByIdWithDetails(int $id): ?Customer;
    public function findByCode(string $code): ?Customer;
    public function create(array $data): Customer;
    public function update(Customer $customer, array $data): bool;
    public function delete(Customer $customer): bool;
    public function settleDue(Customer $customer, float $amount): float;
    public function canDelete(Customer $customer): array;
}
