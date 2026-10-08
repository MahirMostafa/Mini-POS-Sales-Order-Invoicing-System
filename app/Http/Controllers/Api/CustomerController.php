<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerRepositoryInterface $customerRepo
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $customers = $this->customerRepo->paginate(
            $request->integer('per_page', 12),
            $request->get('search')
        );

        return response()->json([
            'success' => true,
            'customers' => $customers,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $customer = Customer::with(['orders' => function ($q) {
            $q->latest()->take(5);
        }, 'invoices' => function ($q) {
            $q->latest()->take(5);
        }])->withCount('orders')->findOrFail($id);

        return response()->json([
            'success' => true,
            'customer' => $customer,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'customer_code' => 'nullable|string|max:50|unique:customers,customer_code',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string|max:50',
            'credit_balance' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $customer = $this->customerRepo->create($validated);

        return response()->json([
            'success' => true,
            'message' => "Customer '{$customer->name}' created successfully.",
            'customer' => $customer,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'customer_code' => 'nullable|string|max:50|unique:customers,customer_code,' . $customer->id,
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string|max:50',
            'credit_balance' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $this->customerRepo->update($customer, $validated);

        return response()->json([
            'success' => true,
            'message' => "Customer '{$customer->name}' updated successfully.",
            'customer' => $customer->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $customer = Customer::withCount(['orders', 'invoices'])->findOrFail($id);

        if ($customer->orders_count > 0 || $customer->invoices_count > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete customer '{$customer->name}' because they have {$customer->orders_count} sales order(s) and {$customer->invoices_count} invoice(s) on record. You can deactivate them instead.",
            ], 422);
        }

        $customerName = $customer->name;
        $this->customerRepo->delete($customer);

        return response()->json([
            'success' => true,
            'message' => "Customer '{$customerName}' deleted successfully.",
        ]);
    }
}
