<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Contracts\Services\AccountingServiceInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerRepositoryInterface $customerRepo,
        protected AccountingServiceInterface $accountingService
    ) {
    }

    protected function checkPermission(string ...$perms): bool
    {
        $user = auth()->user();
        if (!$user) {
            return true;
        }

        if ($user->hasRole('Admin')) {
            return true;
        }

        foreach ($perms as $perm) {
            if ($user->can($perm)) {
                return true;
            }
        }

        return false;
    }

    public function index(Request $request): JsonResponse
    {
        if (!$this->checkPermission('view-customers', 'manage-customers')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view customer records.',
            ], 403);
        }

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
        if (!$this->checkPermission('view-customers', 'manage-customers')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view customer profiles.',
            ], 403);
        }

        $customer = $this->customerRepo->findByIdWithDetails($id);
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'customer' => $customer,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$this->checkPermission('create-customers', 'manage-customers')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to create new customers.',
            ], 403);
        }

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
        if (!$this->checkPermission('edit-customers', 'manage-customers')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to edit customer details.',
            ], 403);
        }

        $customer = $this->customerRepo->findById($id);
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

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

    public function settleDue(Request $request, int $id): JsonResponse
    {
        if (!$this->checkPermission('edit-customers', 'manage-customers')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to settle customer dues.',
            ], 403);
        }

        $customer = $this->customerRepo->findById($id);
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'nullable|string|in:cash,card,bank_transfer,digital',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'note' => 'nullable|string|max:255',
        ]);

        $settleAmount = (float) $validated['amount'];
        $method = $validated['payment_method'] ?? 'cash';
        $bankAccountId = !empty($validated['bank_account_id']) ? (int) $validated['bank_account_id'] : null;

        $newBalance = $this->customerRepo->settleDue($customer, $settleAmount);

        // Record balanced double-entry journal entry in general ledger
        $this->accountingService->recordCustomerDueSettlementJournalEntry(
            $customer,
            $settleAmount,
            $method,
            $bankAccountId,
            $validated['note'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => "Payment of ৳" . number_format($settleAmount, 2) . " received for customer '{$customer->name}'. Remaining due: ৳" . number_format($newBalance, 2) . ".",
            'customer' => $this->customerRepo->findByIdWithDetails($id),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        if (!$this->checkPermission('delete-customers', 'manage-customers')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to delete customer records.',
            ], 403);
        }

        $customer = $this->customerRepo->findById($id);
        if (!$customer) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        $check = $this->customerRepo->canDelete($customer);
        if (!$check['can_delete']) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete customer '{$customer->name}' because they have {$check['orders_count']} sales order(s) and {$check['invoices_count']} invoice(s) on record. You can deactivate them instead.",
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
