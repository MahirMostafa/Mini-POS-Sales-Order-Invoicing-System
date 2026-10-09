<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\AccountingRepositoryInterface;
use App\Contracts\Repositories\BankAccountRepositoryInterface;
use App\Contracts\Services\AccountingServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    public function __construct(
        protected AccountingRepositoryInterface $accountingRepo,
        protected AccountingServiceInterface $accountingService,
        protected ?BankAccountRepositoryInterface $bankRepo = null
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

    public function dashboard(): JsonResponse
    {
        $metrics = $this->accountingService->getDashboardMetrics();
        $stockMetrics = $this->accountingService->getDashboardStockMetrics();
        $currency = Setting::get('currency_symbol', '৳');

        // Recent 10 Journal Entries
        $recentEntries = $this->accountingRepo->paginateJournalEntries(10)->items();

        // Bank Accounts list with current balances
        $bankSummary = $this->accountingRepo->getBankBook(['start_date' => date('Y-m-01'), 'end_date' => date('Y-m-d')]);

        return response()->json([
            'success' => true,
            'metrics' => $metrics,
            'stock_metrics' => $stockMetrics,
            'currency' => $currency,
            'recent_journal_entries' => $recentEntries,
            'bank_summary' => $bankSummary['all_banks'] ?? [],
        ]);
    }

    public function stockMetrics(): JsonResponse
    {
        $stockMetrics = $this->accountingService->getDashboardStockMetrics();
        $currency = Setting::get('currency_symbol', '৳');

        return response()->json([
            'success' => true,
            'stock_metrics' => $stockMetrics,
            'currency' => $currency,
        ]);
    }

    public function journalEntries(Request $request): JsonResponse
    {
        if (!$this->checkPermission('view-journal-entries', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view journal entries.',
            ], 403);
        }

        $filters = [
            'reference_type' => $request->get('reference_type'),
            'search' => $request->get('search'),
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
        ];

        $entries = $this->accountingRepo->paginateJournalEntries($request->integer('per_page', 15), $filters);

        return response()->json([
            'success' => true,
            'entries' => $entries,
        ]);
    }

    public function cashBook(Request $request): JsonResponse
    {
        if (!$this->checkPermission('view-cash-book', 'manage-cash-book', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view cash book records.',
            ], 403);
        }

        $filters = [
            'start_date' => $request->get('start_date', date('Y-m-01')),
            'end_date' => $request->get('end_date', date('Y-m-d')),
            'search' => $request->get('search'),
        ];

        $cashBook = $this->accountingRepo->getCashBook($filters);
        $currency = Setting::get('currency_symbol', '৳');

        return response()->json([
            'success' => true,
            'cash_book' => $cashBook,
            'currency' => $currency,
        ]);
    }

    public function bankBook(Request $request): JsonResponse
    {
        if (!$this->checkPermission('view-bank-book', 'view-banks', 'manage-banks', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view bank statements and books.',
            ], 403);
        }

        $filters = [
            'bank_account_id' => $request->get('bank_account_id'),
            'start_date' => $request->get('start_date', date('Y-m-01')),
            'end_date' => $request->get('end_date', date('Y-m-d')),
            'search' => $request->get('search'),
        ];

        $bankBook = $this->accountingRepo->getBankBook($filters);
        $currency = Setting::get('currency_symbol', '৳');

        return response()->json([
            'success' => true,
            'bank_book' => $bankBook,
            'currency' => $currency,
        ]);
    }

    public function dayBook(Request $request): JsonResponse
    {
        if (!$this->checkPermission('view-day-book', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view day book.',
            ], 403);
        }

        $targetDate = $request->get('date', date('Y-m-d'));
        $filters = [
            'reference_type' => $request->get('reference_type'),
            'search' => $request->get('search'),
        ];

        $dayBook = $this->accountingRepo->getDayBook($targetDate, $filters);
        $currency = Setting::get('currency_symbol', '৳');

        return response()->json([
            'success' => true,
            'day_book' => $dayBook,
            'currency' => $currency,
        ]);
    }

    public function trialBalance(Request $request): JsonResponse
    {
        if (!$this->checkPermission('view-trial-balance', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view trial balance.',
            ], 403);
        }

        $asOfDate = $request->get('as_of_date');
        $trialBalance = $this->accountingRepo->getTrialBalance($asOfDate);
        $currency = Setting::get('currency_symbol', '৳');

        return response()->json([
            'success' => true,
            'trial_balance' => $trialBalance,
            'currency' => $currency,
        ]);
    }

    public function balanceSheet(Request $request): JsonResponse
    {
        if (!$this->checkPermission('view-balance-sheet', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view balance sheet.',
            ], 403);
        }

        $asOfDate = $request->get('as_of_date', date('Y-m-d'));
        $balanceSheet = $this->accountingRepo->getBalanceSheet($asOfDate);
        $currency = Setting::get('currency_symbol', '৳');

        return response()->json([
            'success' => true,
            'balance_sheet' => $balanceSheet,
            'currency' => $currency,
        ]);
    }

    public function profitLoss(Request $request): JsonResponse
    {
        if (!$this->checkPermission('view-profit-loss', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view profit and loss statement.',
            ], 403);
        }

        $startDate = $request->get('start_date', date('Y-m-01'));
        $endDate = $request->get('end_date', date('Y-m-d'));
        $pnl = $this->accountingRepo->getProfitAndLoss($startDate, $endDate);
        $currency = Setting::get('currency_symbol', '৳');

        return response()->json([
            'success' => true,
            'profit_and_loss' => $pnl,
            'currency' => $currency,
        ]);
    }

    public function ledger(int $accountId, Request $request): JsonResponse
    {
        if (!$this->checkPermission('view-ledger', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view account ledgers.',
            ], 403);
        }

        $account = $this->accountingRepo->findAccountById($accountId);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
        }

        $items = $this->accountingRepo->getAccountLedger(
            $accountId,
            $request->get('start_date'),
            $request->get('end_date')
        );

        // Compute running balance
        $runningBalance = 0.0;
        $ledgerRows = [];

        foreach ($items as $item) {
            $debit = (float) $item->debit;
            $credit = (float) $item->credit;

            if ($account->normal_balance === 'Debit') {
                $runningBalance += ($debit - $credit);
            } else {
                $runningBalance += ($credit - $debit);
            }

            $ledgerRows[] = [
                'id' => $item->id,
                'date' => $item->entry->entry_date->toDateString(),
                'entry_number' => $item->entry->entry_number,
                'description' => $item->narration ?: $item->entry->description,
                'reference_type' => $item->entry->reference_type,
                'reference_id' => $item->entry->reference_id,
                'debit' => $debit,
                'credit' => $credit,
                'running_balance' => round($runningBalance, 2),
            ];
        }

        return response()->json([
            'success' => true,
            'account' => $account,
            'closing_balance' => round($runningBalance, 2),
            'ledger_items' => $items,
            'entries' => $ledgerRows,
        ]);
    }

    public function accounts(): JsonResponse
    {
        if (!$this->checkPermission('view-chart-of-accounts', 'manage-chart-of-accounts', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to view Chart of Accounts.',
            ], 403);
        }

        $accounts = $this->accountingRepo->getAllAccounts();

        return response()->json([
            'success' => true,
            'accounts' => $accounts,
        ]);
    }

    public function storeAccount(Request $request): JsonResponse
    {
        if (!$this->checkPermission('create-chart-of-accounts', 'manage-chart-of-accounts')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to create accounting heads.',
            ], 403);
        }

        $validated = $request->validate([
            'account_code' => 'required|string|max:30|unique:chart_of_accounts,account_code',
            'account_name' => 'required|string|max:255',
            'account_type' => 'required|string|in:Asset,Liability,Equity,Revenue,Expense',
            'normal_balance' => 'required|string|in:Debit,Credit',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $account = $this->accountingRepo->createAccount($validated);

        return response()->json([
            'success' => true,
            'message' => "Accounting Head '{$account->account_name} ({$account->account_code})' created successfully.",
            'account' => $account,
        ], 201);
    }

    public function updateAccount(Request $request, int $id): JsonResponse
    {
        if (!$this->checkPermission('edit-chart-of-accounts', 'manage-chart-of-accounts')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to edit accounting heads.',
            ], 403);
        }

        $account = $this->accountingRepo->findAccountById($id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
        }

        $validated = $request->validate([
            'account_code' => 'required|string|max:30|unique:chart_of_accounts,account_code,' . $account->id,
            'account_name' => 'required|string|max:255',
            'account_type' => 'required|string|in:Asset,Liability,Equity,Revenue,Expense',
            'normal_balance' => 'required|string|in:Debit,Credit',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $updated = $this->accountingRepo->updateAccount($account, $validated);

        return response()->json([
            'success' => true,
            'message' => "Accounting Head '{$updated->account_name}' updated successfully.",
            'account' => $updated,
        ]);
    }

    public function deleteAccount(int $id): JsonResponse
    {
        if (!$this->checkPermission('delete-chart-of-accounts', 'manage-chart-of-accounts')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to delete accounting heads.',
            ], 403);
        }

        $account = $this->accountingRepo->findAccountById($id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
        }

        $this->accountingRepo->deleteAccount($account);

        return response()->json([
            'success' => true,
            'message' => "Accounting Head removed/deactivated successfully.",
        ]);
    }

    public function storeVoucher(Request $request): JsonResponse
    {
        if (!$this->checkPermission('create-journal-entry', 'manage-chart-of-accounts', 'view-accounting-dashboard')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to create manual journal vouchers.',
            ], 403);
        }

        $validated = $request->validate([
            'voucher_type' => 'required|string|in:contra_deposit,contra_withdraw,contra_transfer,expense,income,general',
            'amount' => 'required_unless:voucher_type,general|nullable|numeric|min:0.01',
            'entry_date' => 'required|date',
            'narration' => 'required|string|max:255',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'from_bank_account_id' => 'nullable|exists:bank_accounts,id',
            'to_bank_account_id' => 'nullable|exists:bank_accounts,id',
            'account_id' => 'nullable|exists:chart_of_accounts,id',
            'payment_source' => 'nullable|string|in:cash,bank',
            'items' => 'nullable|array|min:2',
            'items.*.account_id' => 'required_with:items|exists:chart_of_accounts,id',
            'items.*.debit' => 'nullable|numeric|min:0',
            'items.*.credit' => 'nullable|numeric|min:0',
        ]);

        $userId = auth()->id() ?? 1;
        $entry = $this->accountingService->recordManualVoucher($validated, $userId);

        return response()->json([
            'success' => true,
            'message' => "Journal Voucher #{$entry->entry_number} posted to ledger successfully.",
            'journal_entry' => $entry,
        ], 201);
    }

    public function addCashMoney(Request $request): JsonResponse
    {
        if (!$this->checkPermission('add-cash-money', 'manage-cash-book')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to add money to Cash in Hand.',
            ], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'source_type' => 'required|string|in:capital,bank,income,custom',
            'bank_account_id' => 'nullable|required_if:source_type,bank|exists:bank_accounts,id',
            'account_id' => 'nullable|required_if:source_type,custom|exists:chart_of_accounts,id',
            'entry_date' => 'required|date',
            'note' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:100',
        ]);

        $cashAccount = $this->accountingRepo->findAccountByCode('1010');
        $amount = (float) $validated['amount'];
        $entryDate = $validated['entry_date'];
        $note = $validated['note'] ?: 'Cash added to drawer';
        $sourceType = $validated['source_type'];
        $bankAccount = null;

        if ($sourceType === 'capital') {
            $creditAccount = $this->accountingRepo->findAccountByCode('3010') ?: $cashAccount;
            $creditNarration = "Capital injection into Cash in Hand" . ($note ? " ({$note})" : "");
        } elseif ($sourceType === 'bank') {
            $bankAccount = BankAccount::find($validated['bank_account_id']);
            $creditAccount = $bankAccount?->chartOfAccount ?: $this->accountingRepo->findAccountByCode('1020');
            $creditNarration = "Bank withdrawal from " . ($bankAccount ? $bankAccount->bank_name : 'Bank') . " into Cash in Hand";
        } elseif ($sourceType === 'income') {
            $creditAccount = $this->accountingRepo->findAccountByCode('4020') ?: $cashAccount;
            $creditNarration = "Direct cash income receipt" . ($note ? " ({$note})" : "");
        } else {
            $creditAccount = $this->accountingRepo->findAccountById($validated['account_id']);
            $creditNarration = "Cash received against " . ($creditAccount ? $creditAccount->account_name : 'Head') . ($note ? " ({$note})" : "");
        }

        $items = [
            [
                'account_id' => $cashAccount->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => "Cash Inflow: {$note}",
            ],
            [
                'account_id' => $creditAccount->id,
                'bank_account_id' => $bankAccount?->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => $creditNarration,
            ],
        ];

        $entryData = [
            'entry_date' => $entryDate,
            'reference_type' => 'CashDeposit',
            'reference_id' => null,
            'description' => "Cash Inflow: ৳" . number_format($amount, 2) . " ({$note})",
            'created_by' => auth()->id() ?? 1,
        ];

        $entry = $this->accountingRepo->createJournalEntry($entryData, $items);

        return response()->json([
            'success' => true,
            'message' => "৳" . number_format($amount, 2) . " successfully added to Cash in Hand. Voucher #{$entry->entry_number} recorded.",
            'entry' => $entry,
        ], 201);
    }

    public function withdrawCashMoney(Request $request): JsonResponse
    {
        if (!$this->checkPermission('withdraw-cash-money', 'manage-cash-book')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to withdraw money from Cash in Hand.',
            ], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'destination_type' => 'required|string|in:bank,expense,drawing,custom',
            'bank_account_id' => 'nullable|required_if:destination_type,bank|exists:bank_accounts,id',
            'account_id' => 'nullable|required_if:destination_type,expense,custom|exists:chart_of_accounts,id',
            'entry_date' => 'required|date',
            'note' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:100',
        ]);

        $cashAccount = $this->accountingRepo->findAccountByCode('1010');
        $amount = (float) $validated['amount'];
        $entryDate = $validated['entry_date'];
        $note = $validated['note'] ?: 'Cash withdrawn from drawer';
        $destType = $validated['destination_type'];
        $bankAccount = null;

        if ($destType === 'bank') {
            $bankAccount = BankAccount::find($validated['bank_account_id']);
            $debitAccount = $bankAccount?->chartOfAccount ?: $this->accountingRepo->findAccountByCode('1020');
            $debitNarration = "Cash deposit into " . ($bankAccount ? $bankAccount->bank_name : 'Bank');
        } elseif ($destType === 'drawing') {
            $debitAccount = $this->accountingRepo->findAccountByCode('3010') ?: $cashAccount;
            $debitNarration = "Owner cash drawing/withdrawal" . ($note ? " ({$note})" : "");
        } elseif ($destType === 'expense') {
            $debitAccount = !empty($validated['account_id']) ? $this->accountingRepo->findAccountById($validated['account_id']) : $this->accountingRepo->findAccountByCode('5020');
            $debitNarration = "Cash expense paid: " . ($debitAccount ? $debitAccount->account_name : 'Expense') . ($note ? " ({$note})" : "");
        } else {
            $debitAccount = $this->accountingRepo->findAccountById($validated['account_id']);
            $debitNarration = "Cash payout against " . ($debitAccount ? $debitAccount->account_name : 'Head') . ($note ? " ({$note})" : "");
        }

        $items = [
            [
                'account_id' => $debitAccount->id,
                'bank_account_id' => $bankAccount?->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => $debitNarration,
            ],
            [
                'account_id' => $cashAccount->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => "Cash Outflow: {$note}",
            ],
        ];

        $entryData = [
            'entry_date' => $entryDate,
            'reference_type' => 'CashWithdrawal',
            'reference_id' => null,
            'description' => "Cash Outflow: ৳" . number_format($amount, 2) . " ({$note})",
            'created_by' => auth()->id() ?? 1,
        ];

        $entry = $this->accountingRepo->createJournalEntry($entryData, $items);

        return response()->json([
            'success' => true,
            'message' => "৳" . number_format($amount, 2) . " payout recorded from Cash in Hand. Voucher #{$entry->entry_number} posted.",
            'entry' => $entry,
        ], 201);
    }
}
