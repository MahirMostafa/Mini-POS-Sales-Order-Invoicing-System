<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\BankAccountRepositoryInterface;
use App\Contracts\Repositories\AccountingRepositoryInterface;
use App\Contracts\Services\AuditServiceInterface;
use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    public function __construct(
        protected BankAccountRepositoryInterface $bankRepo,
        protected AccountingRepositoryInterface $accountingRepo,
        protected AuditServiceInterface $auditService
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
        $onlyActive = $request->boolean('only_active', false) || $request->boolean('active_only', false);

        if (!$onlyActive && !$this->checkPermission('view-banks', 'manage-banks', 'view-bank-book', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view bank accounts.',
            ], 403);
        }

        $banks = $this->bankRepo->getAll($onlyActive);
        $summary = $onlyActive ? [] : $this->bankRepo->getBankSummary();

        return response()->json([
            'success' => true,
            'banks' => $banks,
            'bank_accounts' => $banks,
            'summary' => $summary,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$this->checkPermission('create-banks', 'manage-banks')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to create bank accounts.',
            ], 403);
        }

        $validated = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:100|unique:bank_accounts,account_number',
            'branch_name' => 'nullable|string|max:255',
            'routing_number' => 'nullable|string|max:100',
            'opening_balance' => 'nullable|numeric|min:0',
            'chart_of_account_id' => 'nullable|exists:chart_of_accounts,id',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $bank = $this->bankRepo->create($validated);

        // Audit Log: Bank Account Registered
        $this->auditService->log(
            event: 'bank_created',
            auditableType: 'App\Models\BankAccount',
            auditableId: $bank->id,
            oldValues: null,
            newValues: [
                'bank_name' => $bank->bank_name,
                'account_name' => $bank->account_name,
                'account_number' => $bank->account_number,
                'opening_balance' => (float) $bank->opening_balance,
                'branch_name' => $bank->branch_name,
            ],
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "Bank Account '{$bank->bank_name} ({$bank->account_number})' registered successfully.",
            'bank' => $bank,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        if (!$this->checkPermission('view-banks', 'manage-banks', 'view-bank-book', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view bank account details.',
            ], 403);
        }

        $bank = $this->bankRepo->findById($id);
        if (!$bank) {
            return response()->json(['success' => false, 'message' => 'Bank Account not found.'], 404);
        }

        return response()->json([
            'success' => true,
            'bank' => $bank,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (!$this->checkPermission('edit-banks', 'manage-banks')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to edit bank accounts.',
            ], 403);
        }

        $bank = $this->bankRepo->findById($id);
        if (!$bank) {
            return response()->json(['success' => false, 'message' => 'Bank Account not found.'], 404);
        }

        $validated = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:100|unique:bank_accounts,account_number,' . $bank->id,
            'branch_name' => 'nullable|string|max:255',
            'routing_number' => 'nullable|string|max:100',
            'opening_balance' => 'nullable|numeric|min:0',
            'chart_of_account_id' => 'nullable|exists:chart_of_accounts,id',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $updated = $this->bankRepo->update($bank, $validated);

        return response()->json([
            'success' => true,
            'message' => "Bank Account '{$updated->bank_name}' updated successfully.",
            'bank' => $updated,
        ]);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        if (!$this->checkPermission('edit-banks', 'manage-banks')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to update bank account status.',
            ], 403);
        }

        $bank = $this->bankRepo->findById($id);
        if (!$bank) {
            return response()->json(['success' => false, 'message' => 'Bank Account not found.'], 404);
        }

        $updated = $this->bankRepo->toggleStatus($bank);
        $statusText = $updated->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'success' => true,
            'message' => "Bank Account '{$updated->bank_name}' {$statusText} successfully.",
            'bank' => $updated,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        if (!$this->checkPermission('delete-banks', 'manage-banks')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to delete bank accounts.',
            ], 403);
        }

        $bank = $this->bankRepo->findById($id);
        if (!$bank) {
            return response()->json(['success' => false, 'message' => 'Bank Account not found.'], 404);
        }

        $oldData = [
            'bank_name' => $bank->bank_name,
            'account_name' => $bank->account_name,
            'account_number' => $bank->account_number,
        ];

        $this->bankRepo->delete($bank);

        // Audit Log: Bank Account Deleted
        $this->auditService->log(
            event: 'bank_deleted',
            auditableType: 'App\Models\BankAccount',
            auditableId: $bank->id,
            oldValues: $oldData,
            newValues: null,
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "Bank Account '{$bank->bank_name}' removed/deactivated successfully.",
        ]);
    }

    public function addMoney(Request $request, int $id): JsonResponse
    {
        if (!$this->checkPermission('deposit-banks', 'manage-banks')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to deposit money into bank accounts.',
            ], 403);
        }

        $bank = $this->bankRepo->findById($id);
        if (!$bank) {
            return response()->json(['success' => false, 'message' => 'Bank Account not found.'], 404);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'source_type' => 'required|string|in:cash,capital,income,bank_transfer,custom',
            'from_bank_account_id' => 'nullable|required_if:source_type,bank_transfer|exists:bank_accounts,id',
            'account_id' => 'nullable|required_if:source_type,custom|exists:chart_of_accounts,id',
            'entry_date' => 'required|date',
            'note' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:100',
        ]);

        $amount = (float) $validated['amount'];
        $entryDate = $validated['entry_date'];
        $note = $validated['note'] ?: "Deposit to {$bank->bank_name}";
        $sourceType = $validated['source_type'];
        $fromBank = null;

        $bankHead = $bank->chartOfAccount ?: ChartOfAccount::where('account_code', '1020')->first();

        if ($sourceType === 'cash') {
            $creditAccount = ChartOfAccount::where('account_code', '1010')->first();
            $creditNarration = "Cash deposited into {$bank->display_label}" . ($note ? " ({$note})" : "");
        } elseif ($sourceType === 'capital') {
            $creditAccount = ChartOfAccount::where('account_code', '3010')->first();
            $creditNarration = "Capital injection into {$bank->display_label}" . ($note ? " ({$note})" : "");
        } elseif ($sourceType === 'income') {
            $creditAccount = ChartOfAccount::where('account_code', '4020')->first();
            $creditNarration = "Direct other income received into {$bank->display_label}" . ($note ? " ({$note})" : "");
        } elseif ($sourceType === 'bank_transfer') {
            $fromBank = BankAccount::find($validated['from_bank_account_id']);
            $creditAccount = $fromBank?->chartOfAccount ?: ChartOfAccount::where('account_code', '1020')->first();
            $creditNarration = "Inter-bank transfer from {$fromBank->display_label} into {$bank->display_label}";
        } else {
            $creditAccount = ChartOfAccount::find($validated['account_id']);
            $creditNarration = "Funds received into {$bank->display_label} against {$creditAccount->account_name}" . ($note ? " ({$note})" : "");
        }

        $items = [
            [
                'account_id' => $bankHead->id,
                'bank_account_id' => $bank->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => "Deposit to {$bank->bank_name}: {$note}",
            ],
            [
                'account_id' => $creditAccount->id,
                'bank_account_id' => $fromBank?->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => $creditNarration,
            ],
        ];

        $entryData = [
            'entry_date' => $entryDate,
            'reference_type' => 'BankDeposit',
            'reference_id' => $bank->id,
            'description' => "Deposit to {$bank->bank_name}: ৳" . number_format($amount, 2) . " ({$note})",
            'created_by' => auth()->id() ?? 1,
        ];

        $entry = $this->accountingRepo->createJournalEntry($entryData, $items);

        // Audit Log: Bank Deposit
        $this->auditService->log(
            event: 'bank_deposit',
            auditableType: 'App\Models\BankAccount',
            auditableId: $bank->id,
            oldValues: null,
            newValues: [
                'bank_name' => $bank->bank_name,
                'account_number' => $bank->account_number,
                'amount' => $amount,
                'source_type' => $sourceType,
                'note' => $note,
                'voucher_number' => $entry->entry_number,
            ],
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "৳" . number_format($amount, 2) . " deposited into {$bank->bank_name} successfully. Voucher #{$entry->entry_number} recorded.",
            'entry' => $entry,
            'bank' => $bank->fresh('chartOfAccount'),
        ], 201);
    }

    public function withdrawMoney(Request $request, int $id): JsonResponse
    {
        $bank = $this->bankRepo->findById($id);
        if (!$bank) {
            return response()->json(['success' => false, 'message' => 'Bank Account not found.'], 404);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'destination_type' => 'required|string|in:cash,expense,drawing,bank_transfer,custom',
            'to_bank_account_id' => 'nullable|required_if:destination_type,bank_transfer|exists:bank_accounts,id',
            'account_id' => 'nullable|required_if:destination_type,expense,custom|exists:chart_of_accounts,id',
            'entry_date' => 'required|date',
            'note' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:100',
        ]);

        $amount = (float) $validated['amount'];
        $entryDate = $validated['entry_date'];
        $note = $validated['note'] ?: "Withdrawal from {$bank->bank_name}";
        $destType = $validated['destination_type'];
        $toBank = null;

        $bankHead = $bank->chartOfAccount ?: ChartOfAccount::where('account_code', '1020')->first();

        if ($destType === 'cash') {
            $debitAccount = ChartOfAccount::where('account_code', '1010')->first();
            $debitNarration = "Cash withdrawn from {$bank->display_label} into Cash in Hand";
        } elseif ($destType === 'drawing') {
            $debitAccount = ChartOfAccount::where('account_code', '3010')->first();
            $debitNarration = "Owner withdrawal / drawing from {$bank->display_label}" . ($note ? " ({$note})" : "");
        } elseif ($destType === 'expense') {
            $debitAccount = !empty($validated['account_id']) ? ChartOfAccount::find($validated['account_id']) : ChartOfAccount::where('account_code', '5020')->first();
            $debitNarration = "Operating expense paid from {$bank->display_label}: {$debitAccount->account_name}" . ($note ? " ({$note})" : "");
        } elseif ($destType === 'bank_transfer') {
            $toBank = BankAccount::find($validated['to_bank_account_id']);
            $debitAccount = $toBank?->chartOfAccount ?: ChartOfAccount::where('account_code', '1020')->first();
            $debitNarration = "Inter-bank transfer from {$bank->display_label} into {$toBank->display_label}";
        } else {
            $debitAccount = ChartOfAccount::find($validated['account_id']);
            $debitNarration = "Payout from {$bank->display_label} against {$debitAccount->account_name}" . ($note ? " ({$note})" : "");
        }

        $items = [
            [
                'account_id' => $debitAccount->id,
                'bank_account_id' => $toBank?->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => $debitNarration,
            ],
            [
                'account_id' => $bankHead->id,
                'bank_account_id' => $bank->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => "Withdrawal from {$bank->bank_name}: {$note}",
            ],
        ];

        $entryData = [
            'entry_date' => $entryDate,
            'reference_type' => 'BankWithdrawal',
            'reference_id' => $bank->id,
            'description' => "Withdrawal from {$bank->bank_name}: ৳" . number_format($amount, 2) . " ({$note})",
            'created_by' => auth()->id() ?? 1,
        ];

        $entry = $this->accountingRepo->createJournalEntry($entryData, $items);

        // Audit Log: Bank Withdrawal
        $this->auditService->log(
            event: 'bank_withdraw',
            auditableType: 'App\Models\BankAccount',
            auditableId: $bank->id,
            oldValues: null,
            newValues: [
                'bank_name' => $bank->bank_name,
                'account_number' => $bank->account_number,
                'amount' => $amount,
                'destination_type' => $destType,
                'note' => $note,
                'voucher_number' => $entry->entry_number,
            ],
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "৳" . number_format($amount, 2) . " withdrawn/transferred from {$bank->bank_name} successfully. Voucher #{$entry->entry_number} recorded.",
            'entry' => $entry,
            'bank' => $bank->fresh('chartOfAccount'),
        ], 201);
    }
}
