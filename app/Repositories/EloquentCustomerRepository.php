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
        $query = Customer::withCount(['orders', 'invoices']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('customer_code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->latest('id')->paginate($perPage);
    }

    public function findById(int $id): ?Customer
    {
        return Customer::find($id);
    }

    public function findByIdWithDetails(int $id): ?Customer
    {
        return Customer::with(['orders' => function ($q) {
            $q->latest()->take(5);
        }, 'invoices' => function ($q) {
            $q->latest()->take(5);
        }])->withCount('orders')->find($id);
    }

    public function findByCode(string $code): ?Customer
    {
        return Customer::where('customer_code', $code)->first();
    }

    public function create(array $data): Customer
    {
        if (empty($data['customer_code'])) {
            $count = Customer::count() + 1;
            $data['customer_code'] = 'CUST-' . str_pad($count, 4, '0', STR_PAD_LEFT);
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

    public function settleDue(Customer $customer, float $amount): float
    {
        $currentBalance = (float) $customer->credit_balance;
        $newBalance = max(0, round($currentBalance - $amount, 2));
        $customer->update(['credit_balance' => $newBalance]);
        return $newBalance;
    }

    public function canDelete(Customer $customer): array
    {
        $customerWithCounts = Customer::withCount(['orders', 'invoices'])->find($customer->id);
        $ordersCount = $customerWithCounts->orders_count ?? 0;
        $invoicesCount = $customerWithCounts->invoices_count ?? 0;

        return [
            'can_delete' => ($ordersCount === 0 && $invoicesCount === 0),
            'orders_count' => $ordersCount,
            'invoices_count' => $invoicesCount,
        ];
    }
}
