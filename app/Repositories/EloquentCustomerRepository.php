<?php

namespace App\Repositories;

use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentCustomerRepository implements CustomerRepositoryInterface
{
    public function all(): Collection
    {
        return Customer::orderBy('name')->get();
    }

    public function getActive(): Collection
    {
        return Customer::where('is_active', true)->orderBy('name')->get();
    }

    public function paginate(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $query = Customer::query()->withCount('orders');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('customer_code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById(int $id): ?Customer
    {
        return Customer::find($id);
    }

    public function findByCode(string $code): ?Customer
    {
        return Customer::where('customer_code', $code)->first();
    }

    public function create(array $data): Customer
    {
        if (empty($data['customer_code'])) {
            $lastId = Customer::max('id') ?? 0;
            $data['customer_code'] = 'CUST-' . str_pad($lastId + 1, 4, '0', STR_PAD_LEFT);
        }

        return Customer::create($data);
    }

    public function update(Customer $customer, array $data): bool
    {
        return $customer->update($data);
    }

    public function delete(Customer $customer): bool
    {
        return $customer->delete();
    }
}
