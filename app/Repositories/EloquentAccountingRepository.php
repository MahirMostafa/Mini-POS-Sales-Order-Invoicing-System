<?php

namespace App\Repositories;

use App\Contracts\Repositories\AccountingRepositoryInterface;
use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EloquentAccountingRepository implements AccountingRepositoryInterface
{
    public function getAllAccounts(): Collection
    {
        return ChartOfAccount::orderBy('account_code')->get();
    }

    public function getActiveAccounts(): Collection
    {
        return ChartOfAccount::where('is_active', true)->orderBy('account_code')->get();
    }

    public function findAccountByCode(string $code): ?ChartOfAccount
    {
        return ChartOfAccount::where('account_code', $code)->first();
    }

    public function findAccountById(int $id): ?ChartOfAccount
    {
        return ChartOfAccount::find($id);
    }

    public function createAccount(array $data): ChartOfAccount
    {
        return ChartOfAccount::create($data);
    }

    public function updateAccount(ChartOfAccount $account, array $data): ChartOfAccount
    {
        $account->update($data);
        return $account->fresh();
    }

    public function deleteAccount(ChartOfAccount $account): bool
    {
        if ($account->journalItems()->exists() || $account->taxRates()->exists()) {
            $account->update(['is_active' => false]);
            return true;
        }

        return (bool) $account->delete();
    }

    public function createJournalEntry(array $entryData, array $itemsData): JournalEntry
    {
        if (empty($entryData['entry_number'])) {
            $datePrefix = date('Ymd');
            $countToday = JournalEntry::whereDate('created_at', today())->count() + 1;
            $entryData['entry_number'] = 'JE-' . $datePrefix . '-' . str_pad($countToday, 4, '0', STR_PAD_LEFT);
        }

        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($itemsData as $item) {
            $totalDebit += (float) ($item['debit'] ?? 0);
            $totalCredit += (float) ($item['credit'] ?? 0);
        }

        $entryData['total_debit'] = round($totalDebit, 2);
        $entryData['total_credit'] = round($totalCredit, 2);

        $entry = JournalEntry::create($entryData);

        foreach ($itemsData as $item) {
            $item['journal_entry_id'] = $entry->id;
            JournalItem::create($item);
        }

        return $entry->load(['items.account', 'items.bankAccount', 'creator']);
    }

    public function paginateJournalEntries(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = JournalEntry::with(['items.account', 'items.bankAccount', 'creator']);

        if (!empty($filters['reference_type'])) {
            $query->where('reference_type', $filters['reference_type']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('entry_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->whereBetween('entry_date', [$filters['start_date'], $filters['end_date']]);
        } elseif (!empty($filters['start_date'])) {
            $query->whereDate('entry_date', '>=', $filters['start_date']);
        } elseif (!empty($filters['end_date'])) {
            $query->whereDate('entry_date', '<=', $filters['end_date']);
        }

        return $query->latest('entry_date')->latest('id')->paginate($perPage);
    }

    public function findJournalEntryById(int $id): ?JournalEntry
    {
        return JournalEntry::with(['items.account', 'items.bankAccount', 'creator'])->find($id);
    }

    public function getAccountLedger(int $accountId, ?string $startDate = null, ?string $endDate = null): Collection
    {
        $query = JournalItem::with(['entry', 'bankAccount'])
            ->where('account_id', $accountId);

        if ($startDate && $endDate) {
            $query->whereHas('entry', function ($eq) use ($startDate, $endDate) {
                $eq->whereBetween('entry_date', [$startDate, $endDate]);
            });
        } elseif ($startDate) {
            $query->whereHas('entry', function ($eq) use ($startDate) {
                $eq->whereDate('entry_date', '>=', $startDate);
            });
        } elseif ($endDate) {
            $query->whereHas('entry', function ($eq) use ($endDate) {
                $eq->whereDate('entry_date', '<=', $endDate);
            });
        }

        return $query->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->orderBy('journal_entries.entry_date', 'asc')
            ->orderBy('journal_items.id', 'asc')
            ->select('journal_items.*')
            ->get();
    }

    public function getTrialBalance(?string $asOfDate = null): array
    {
        $accounts = ChartOfAccount::orderBy('account_code')->get();
        $trialBalance = [];
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($accounts as $account) {
            $itemsQuery = JournalItem::where('account_id', $account->id);

            if ($asOfDate) {
                $itemsQuery->whereHas('entry', function ($q) use ($asOfDate) {
                    $q->whereDate('entry_date', '<=', $asOfDate);
                });
            }

            $debitSum = (float) $itemsQuery->sum('debit');
            $creditSum = (float) $itemsQuery->sum('credit');

            $netDebit = 0.0;
            $netCredit = 0.0;

            if ($account->normal_balance === 'Debit') {
                $balance = $debitSum - $creditSum;
                if ($balance >= 0) {
                    $netDebit = $balance;
                } else {
                    $netCredit = abs($balance);
                }
            } else {
                $balance = $creditSum - $debitSum;
                if ($balance >= 0) {
                    $netCredit = $balance;
                } else {
                    $netDebit = abs($balance);
                }
            }

            $totalDebit += $netDebit;
            $totalCredit += $netCredit;

            $trialBalance[] = [
                'id' => $account->id,
                'code' => $account->account_code,
                'name' => $account->account_name,
                'type' => $account->account_type,
                'normal_balance' => $account->normal_balance,
                'total_debit' => round($debitSum, 2),
                'total_credit' => round($creditSum, 2),
                'debit' => round($netDebit, 2),
                'credit' => round($netCredit, 2),
                'debit_balance' => round($netDebit, 2),
                'credit_balance' => round($netCredit, 2),
                'balance' => $account->normal_balance === 'Debit' ? round($debitSum - $creditSum, 2) : round($creditSum - $debitSum, 2),
            ];
        }

        $difference = round(abs($totalDebit - $totalCredit), 2);

        return [
            'accounts' => $trialBalance,
            'rows' => $trialBalance,
            'total_debit' => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'difference' => $difference,
            'is_balanced' => $difference < 0.01,
        ];
    }

    public function getCashBook(array $filters = []): array
    {
        $cashAccount = $this->findAccountByCode('1010');
        if (!$cashAccount) {
            return [
                'opening_balance' => 0.0,
                'closing_balance' => 0.0,
                'total_cash_in' => 0.0,
                'total_cash_out' => 0.0,
                'transactions' => [],
            ];
        }

        $startDate = $filters['start_date'] ?? date('Y-m-01');
        $endDate = $filters['end_date'] ?? date('Y-m-d');
        $search = $filters['search'] ?? null;

        // 1. Calculate opening balance prior to startDate
        $prevDebit = (float) JournalItem::where('account_id', $cashAccount->id)
            ->whereHas('entry', fn($q) => $q->whereDate('entry_date', '<', $startDate))
            ->sum('debit');

        $prevCredit = (float) JournalItem::where('account_id', $cashAccount->id)
            ->whereHas('entry', fn($q) => $q->whereDate('entry_date', '<', $startDate))
            ->sum('credit');

        $openingBalance = round($prevDebit - $prevCredit, 2);

        // 2. Fetch cash transactions within date range
        $query = JournalItem::with(['entry.creator', 'entry.items.account', 'entry.items.bankAccount'])
            ->where('account_id', $cashAccount->id)
            ->whereHas('entry', function ($q) use ($startDate, $endDate, $search) {
                $q->whereBetween('entry_date', [$startDate, $endDate]);
                if ($search) {
                    $q->where(function ($sq) use ($search) {
                        $sq->where('entry_number', 'like', "%{$search}%")
                           ->orWhere('description', 'like', "%{$search}%");
                    });
                }
            });

        $items = $query->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->orderBy('journal_entries.entry_date', 'asc')
            ->orderBy('journal_items.id', 'asc')
            ->select('journal_items.*')
            ->get();

        $transactions = [];
        $runningBalance = $openingBalance;
        $totalIn = 0.0;
        $totalOut = 0.0;

        foreach ($items as $item) {
            $debit = (float) $item->debit;
            $credit = (float) $item->credit;
            $runningBalance += ($debit - $credit);
            $totalIn += $debit;
            $totalOut += $credit;

            // Find counterpart account in same entry
            $counterparts = $item->entry->items->where('id', '!=', $item->id);
            $particularsList = [];
            foreach ($counterparts as $cp) {
                if ($cp->account) {
                    $accName = $cp->account->account_name;
                    $accCode = $cp->account->account_code;
                    $bankLabel = $cp->bankAccount ? " ({$cp->bankAccount->bank_name})" : "";
                    $particularsList[] = "{$accName} ({$accCode}){$bankLabel}";
                }
            }
            $particulars = !empty($particularsList) ? implode(', ', array_unique($particularsList)) : ($item->narration ?: $item->entry->description);

            $row = [
                'id' => $item->id,
                'journal_entry_id' => $item->journal_entry_id,
                'entry_number' => $item->entry->entry_number,
                'voucher_no' => $item->entry->entry_number,
                'date' => $item->entry->entry_date->toDateString(),
                'particulars' => $particulars,
                'description' => $item->narration ?: $item->entry->description,
                'reference_type' => $item->entry->reference_type,
                'reference_id' => $item->entry->reference_id,
                'debit' => $debit,
                'credit' => $credit,
                'cash_in' => $debit,
                'cash_out' => $credit,
                'running_balance' => round($runningBalance, 2),
                'created_by' => $item->entry->creator?->name ?? 'System',
            ];

            $transactions[] = $row;
        }

        return [
            'account' => $cashAccount,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'opening_balance' => round($openingBalance, 2),
            'closing_balance' => round($runningBalance, 2),
            'total_inflow' => round($totalIn, 2),
            'total_outflow' => round($totalOut, 2),
            'total_cash_in' => round($totalIn, 2),
            'total_cash_out' => round($totalOut, 2),
            'net_flow' => round($totalIn - $totalOut, 2),
            'entries' => $transactions,
            'transactions' => $transactions,
        ];
    }

    public function getBankBook(array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? date('Y-m-01');
        $endDate = $filters['end_date'] ?? date('Y-m-d');
        $bankAccountId = !empty($filters['bank_account_id']) && $filters['bank_account_id'] !== 'all' 
            ? (int) $filters['bank_account_id'] 
            : null;
        $search = $filters['search'] ?? null;

        // Fetch all bank accounts and their individual balances
        $allBanks = BankAccount::with('chartOfAccount')->get();
        $bankSummary = [];
        $totalBankBalances = 0.0;

        foreach ($allBanks as $b) {
            $curBal = (float) $b->current_balance;
            $totalBankBalances += $curBal;
            $bankSummary[] = [
                'id' => $b->id,
                'bank_name' => $b->bank_name,
                'account_name' => $b->account_name,
                'account_number' => $b->account_number,
                'branch_name' => $b->branch_name,
                'opening_balance' => (float) $b->opening_balance,
                'current_balance' => $curBal,
                'display_label' => $b->display_label,
            ];
        }

        // Identify COA account IDs associated with banks
        $bankCoaIds = ChartOfAccount::where('account_code', 'like', '102%')->pluck('id')->toArray();

        // Selected Bank
        $selectedBank = $bankAccountId ? BankAccount::find($bankAccountId) : null;

        // 1. Calculate opening balance prior to startDate
        $prevQuery = JournalItem::whereHas('entry', fn($q) => $q->whereDate('entry_date', '<', $startDate));
        
        if ($selectedBank) {
            $prevQuery->where(function ($q) use ($selectedBank) {
                $q->where('bank_account_id', $selectedBank->id);
                if ($selectedBank->chart_of_account_id) {
                    $q->orWhere('account_id', $selectedBank->chart_of_account_id);
                }
            });

            $hasOpeningJournal = JournalItem::where('bank_account_id', $selectedBank->id)
                ->whereHas('entry', fn($q) => $q->where('reference_type', 'BankOpeningBalance'))
                ->exists();

            $baseOpening = $hasOpeningJournal ? 0.0 : (float) $selectedBank->opening_balance;
            $openingBalance = $baseOpening + ((float) $prevQuery->sum('debit') - (float) $prevQuery->sum('credit'));
        } else {
            $prevQuery->where(function ($q) use ($bankCoaIds) {
                $q->whereNotNull('bank_account_id')
                  ->orWhereIn('account_id', $bankCoaIds);
            });

            // If bank opening balances are already recorded via JournalEntry, base opening is 0
            $banksWithoutJournal = BankAccount::where('is_active', true)
                ->whereDoesntHave('journalItems', function ($q) {
                    $q->whereHas('entry', fn($sq) => $sq->where('reference_type', 'BankOpeningBalance'));
                })
                ->sum('opening_balance');

            $openingBalance = (float) $banksWithoutJournal + ((float) $prevQuery->sum('debit') - (float) $prevQuery->sum('credit'));
        }

        // 2. Query transactions within date range
        $query = JournalItem::with(['entry.creator', 'account', 'bankAccount'])
            ->whereHas('entry', function ($q) use ($startDate, $endDate, $search) {
                $q->whereBetween('entry_date', [$startDate, $endDate]);
                if ($search) {
                    $q->where(function ($sq) use ($search) {
                        $sq->where('entry_number', 'like', "%{$search}%")
                           ->orWhere('description', 'like', "%{$search}%");
                    });
                }
            });

        if ($selectedBank) {
            $query->where(function ($q) use ($selectedBank) {
                $q->where('bank_account_id', $selectedBank->id);
                if ($selectedBank->chart_of_account_id) {
                    $q->orWhere('account_id', $selectedBank->chart_of_account_id);
                }
            });
        } else {
            $query->where(function ($q) use ($bankCoaIds) {
                $q->whereNotNull('bank_account_id')
                  ->orWhereIn('account_id', $bankCoaIds);
            });
        }

        $items = $query->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->orderBy('journal_entries.entry_date', 'asc')
            ->orderBy('journal_items.id', 'asc')
            ->select('journal_items.*')
            ->get();

        $transactions = [];
        $runningBalance = $openingBalance;
        $totalDeposits = 0.0;
        $totalWithdrawals = 0.0;

        foreach ($items as $item) {
            $debit = (float) $item->debit;
            $credit = (float) $item->credit;
            $runningBalance += ($debit - $credit);
            $totalDeposits += $debit;
            $totalWithdrawals += $credit;

            $bankName = $item->bankAccount 
                ? "{$item->bankAccount->bank_name} ({$item->bankAccount->account_number})" 
                : ($item->account?->account_name ?? 'Bank Account');

            // Find counterpart account in same entry
            $counterparts = $item->entry->items->where('id', '!=', $item->id);
            $particularsList = [];
            foreach ($counterparts as $cp) {
                if ($cp->account) {
                    $accName = $cp->account->account_name;
                    $accCode = $cp->account->account_code;
                    $particularsList[] = "{$accName} ({$accCode})";
                }
            }
            $particulars = !empty($particularsList) ? implode(', ', array_unique($particularsList)) : ($item->narration ?: $item->entry->description);

            $transactions[] = [
                'id' => $item->id,
                'journal_entry_id' => $item->journal_entry_id,
                'entry_number' => $item->entry->entry_number,
                'voucher_no' => $item->entry->entry_number,
                'date' => $item->entry->entry_date->toDateString(),
                'bank_name' => $bankName,
                'particulars' => $particulars,
                'description' => $item->narration ?: $item->entry->description,
                'reference_type' => $item->entry->reference_type,
                'reference_id' => $item->entry->reference_id,
                'debit' => $debit,
                'credit' => $credit,
                'deposit' => $debit,
                'withdrawal' => $credit,
                'running_balance' => round($runningBalance, 2),
                'created_by' => $item->entry->creator?->name ?? 'System',
            ];
        }

        return [
            'selected_bank' => $selectedBank,
            'all_banks' => $bankSummary,
            'total_bank_balance' => round($totalBankBalances, 2),
            'total_all_banks_balance' => round($totalBankBalances, 2),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'opening_balance' => round($openingBalance, 2),
            'closing_balance' => round($runningBalance, 2),
            'total_deposits' => round($totalDeposits, 2),
            'total_withdrawals' => round($totalWithdrawals, 2),
            'net_flow' => round($totalDeposits - $totalWithdrawals, 2),
            'entries' => $transactions,
            'transactions' => $transactions,
        ];
    }

    public function getDayBook(string $date, array $filters = []): array
    {
        $targetDate = $date ?: date('Y-m-d');
        $query = JournalEntry::with(['items.account', 'items.bankAccount', 'creator'])
            ->whereDate('entry_date', $targetDate);

        if (!empty($filters['reference_type']) && $filters['reference_type'] !== 'all') {
            $query->where('reference_type', $filters['reference_type']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('entry_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $entries = $query->orderBy('id', 'asc')->get();

        $totalDebit = (float) $entries->sum('total_debit');
        $totalCredit = (float) $entries->sum('total_credit');

        // Summarize orders, invoices, and collections made on this date
        $ordersCount = Order::whereDate('order_date', $targetDate)->count();
        $completedOrdersTotal = (float) Order::whereDate('order_date', $targetDate)->where('status', 'completed')->sum('grand_total');
        $purchasesTotal = (float) Purchase::whereDate('purchase_date', $targetDate)->sum('total_amount');

        return [
            'date' => $targetDate,
            'total_entries' => $entries->count(),
            'total_debit' => round($totalDebit, 2),
            'total_credit' => round($totalCredit, 2),
            'orders_count' => $ordersCount,
            'completed_orders_total' => round($completedOrdersTotal, 2),
            'purchases_total' => round($purchasesTotal, 2),
            'entries' => $entries,
        ];
    }

    public function getProfitAndLoss(?string $startDate = null, ?string $endDate = null): array
    {
        $start = $startDate ?? date('Y-m-01');
        $end = $endDate ?? date('Y-m-d');

        // Helper closure to sum net balance in date range
        $getNetAccountBalance = function (string $code) use ($start, $end) {
            $account = $this->findAccountByCode($code);
            if (!$account) return 0.0;

            $items = JournalItem::where('account_id', $account->id)
                ->whereHas('entry', fn($q) => $q->whereBetween('entry_date', [$start, $end]));

            $debit = (float) (clone $items)->sum('debit');
            $credit = (float) (clone $items)->sum('credit');

            return $account->normal_balance === 'Debit' ? ($debit - $credit) : ($credit - $debit);
        };

        // 1. Revenues
        $salesRevenue = max(0, $getNetAccountBalance('4010'));
        $otherIncome = max(0, $getNetAccountBalance('4020'));
        $salesDiscounts = max(0, $getNetAccountBalance('5030'));
        $netSales = $salesRevenue - $salesDiscounts;
        $totalRevenue = $netSales + $otherIncome;

        // 2. Cost of Goods Sold (COGS)
        $cogs = max(0, $getNetAccountBalance('5010'));

        // 3. Gross Profit
        $grossProfit = $totalRevenue - $cogs;

        // 4. Operating & Admin Expenses
        $operatingExpenses = max(0, $getNetAccountBalance('5020'));

        // Any other expense accounts
        $otherExpenseAccounts = ChartOfAccount::where('account_type', 'Expense')
            ->whereNotIn('account_code', ['5010', '5020', '5030'])
            ->get();

        $additionalExpenses = 0.0;
        $expenseBreakdown = [
            ['name' => 'Operating & Administrative Expenses (5020)', 'amount' => round($operatingExpenses, 2)],
        ];

        foreach ($otherExpenseAccounts as $expAcc) {
            $amt = max(0, $getNetAccountBalance($expAcc->account_code));
            if ($amt > 0) {
                $additionalExpenses += $amt;
                $expenseBreakdown[] = [
                    'name' => "{$expAcc->account_name} ({$expAcc->account_code})",
                    'amount' => round($amt, 2),
                ];
            }
        }

        $totalExpenses = $operatingExpenses + $additionalExpenses;

        // 5. Net Profit
        $netProfit = $grossProfit - $totalExpenses;

        return [
            'start_date' => $start,
            'end_date' => $end,
            'sales_revenue' => round($salesRevenue, 2),
            'sales_discounts' => round($salesDiscounts, 2),
            'net_sales' => round($netSales, 2),
            'other_income' => round($otherIncome, 2),
            'total_revenue' => round($totalRevenue, 2),
            'cost_of_goods_sold' => round($cogs, 2),
            'cogs' => round($cogs, 2),
            'gross_profit' => round($grossProfit, 2),
            'gross_margin_percent' => $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0,
            'expense_breakdown' => $expenseBreakdown,
            'total_expenses' => round($totalExpenses, 2),
            'net_profit' => round($netProfit, 2),
            'net_margin_percent' => $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0,
        ];
    }

    public function getBalanceSheet(?string $asOfDate = null): array
    {
        $asOf = $asOfDate ?? date('Y-m-d');

        // Helper to get cumulative balance as of date
        $getCumulativeBalance = function (string $code) use ($asOf) {
            $account = $this->findAccountByCode($code);
            if (!$account) return 0.0;

            $items = JournalItem::where('account_id', $account->id)
                ->whereHas('entry', fn($q) => $q->whereDate('entry_date', '<=', $asOf));

            $debit = (float) (clone $items)->sum('debit');
            $credit = (float) (clone $items)->sum('credit');

            return $account->normal_balance === 'Debit' ? ($debit - $credit) : ($credit - $debit);
        };

        // --- ASSETS ---
        $cashInHand = max(0, $getCumulativeBalance('1010'));

        // Aggregate all Bank Accounts
        $bankAccountsList = BankAccount::where('is_active', true)->get();
        $totalBankBalances = 0.0;
        $banksDetail = [];
        foreach ($bankAccountsList as $b) {
            $bBal = (float) $b->current_balance;
            $totalBankBalances += $bBal;
            $banksDetail[] = [
                'name' => $b->display_label,
                'balance' => round($bBal, 2),
            ];
        }

        $accountsReceivable = max(0, $getCumulativeBalance('1050'));
        $merchandiseInventory = max(0, $getCumulativeBalance('1060'));

        // If Merchandise Inventory ledger is 0, we can fallback to live inventory valuation
        if ($merchandiseInventory == 0) {
            $stockMetrics = $this->getDashboardStockMetrics();
            $merchandiseInventory = (float) $stockMetrics['total_stock_cost_value'];
        }

        $totalAssets = $cashInHand + $totalBankBalances + $accountsReceivable + $merchandiseInventory;

        // --- LIABILITIES ---
        $taxPayable = max(0, $getCumulativeBalance('2010'));
        $accountsPayable = max(0, $getCumulativeBalance('2020'));
        $totalLiabilities = $taxPayable + $accountsPayable;

        // --- EQUITY ---
        $ownerCapital = max(0, $getCumulativeBalance('3010'));
        $retainedEarnings = max(0, $getCumulativeBalance('3020'));

        // Net Earnings from inception up to asOf
        $pnl = $this->getProfitAndLoss('2000-01-01', $asOf);
        $currentPeriodNetEarnings = (float) $pnl['net_profit'];

        // Balance Owner Capital default to balance equation if not explicitly injected
        $calculatedEquity = $ownerCapital + $retainedEarnings + $currentPeriodNetEarnings;
        $totalLiabilitiesAndEquity = $totalLiabilities + $calculatedEquity;

        return [
            'as_of_date' => $asOf,
            'assets' => [
                'cash_in_hand' => round($cashInHand, 2),
                'bank_accounts' => round($totalBankBalances, 2),
                'bank_accounts_detail' => $banksDetail,
                'accounts_receivable' => round($accountsReceivable, 2),
                'merchandise_inventory' => round($merchandiseInventory, 2),
                'total_current_assets' => round($totalAssets, 2),
                'total_assets' => round($totalAssets, 2),
            ],
            'liabilities' => [
                'tax_payable' => round($taxPayable, 2),
                'accounts_payable' => round($accountsPayable, 2),
                'total_current_liabilities' => round($totalLiabilities, 2),
                'total_liabilities' => round($totalLiabilities, 2),
            ],
            'equity' => [
                'owner_capital' => round($ownerCapital, 2),
                'retained_earnings' => round($retainedEarnings, 2),
                'current_period_earnings' => round($currentPeriodNetEarnings, 2),
                'total_equity' => round($calculatedEquity, 2),
            ],
            'total_liabilities_and_equity' => round($totalLiabilitiesAndEquity, 2),
            'is_balanced' => abs($totalAssets - $totalLiabilitiesAndEquity) < 1.00,
        ];
    }

    public function getDashboardStockMetrics(): array
    {
        $variants = ProductVariant::with('product')->get();

        $totalUnits = 0;
        $totalCostValue = 0.0;
        $totalExpectedSalesValue = 0.0;
        $lowStockCount = 0;

        foreach ($variants as $variant) {
            $qty = (int) $variant->stock_quantity;
            $cost = (float) $variant->cost_price;
            $selling = (float) $variant->selling_price;

            $totalUnits += $qty;
            $totalCostValue += ($qty * $cost);
            $totalExpectedSalesValue += ($qty * $selling);

            if ($qty <= 10) {
                $lowStockCount++;
            }
        }

        $potentialProfit = round($totalExpectedSalesValue - $totalCostValue, 2);
        $marginPercent = $totalExpectedSalesValue > 0 
            ? round(($potentialProfit / $totalExpectedSalesValue) * 100, 2) 
            : 0.0;

        return [
            'total_physical_stock_units' => $totalUnits,
            'total_stock_cost_value' => round($totalCostValue, 2),
            'total_expected_sales_value' => round($totalExpectedSalesValue, 2),
            'potential_stock_profit' => $potentialProfit,
            'potential_profit_margin_percent' => $marginPercent,
            'low_stock_items_count' => $lowStockCount,
            'total_products_count' => Product::count(),
            'total_variants_count' => $variants->count(),
        ];
    }

    public function getAccountingMetrics(): array
    {
        // 1050: Accounts Receivable
        $arAccount = $this->findAccountByCode('1050');
        $arBalance = $arAccount ? $arAccount->balance : 0.0;

        // 4010: Sales Revenue
        $salesAccount = $this->findAccountByCode('4010');
        $totalRevenue = $salesAccount ? $salesAccount->balance : 0.0;

        // 2010: Tax Payable
        $taxAccount = $this->findAccountByCode('2010');
        $totalTaxPayable = $taxAccount ? $taxAccount->balance : 0.0;

        // 2020: Accounts Payable (Suppliers)
        $apAccount = $this->findAccountByCode('2020');
        $totalAccountsPayable = $apAccount ? $apAccount->balance : 0.0;

        // 1010: Cash in Hand
        $cashAccount = $this->findAccountByCode('1010');
        $cashBalance = $cashAccount ? $cashAccount->balance : 0.0;

        // Total Bank Accounts Balances
        $totalBankBalances = (float) BankAccount::where('is_active', true)->get()->sum('current_balance');

        // 5010: COGS
        $cogsAccount = $this->findAccountByCode('5010');
        $cogsBalance = $cogsAccount ? $cogsAccount->balance : 0.0;

        // Gross Profit = Sales Revenue - COGS
        $grossProfit = $totalRevenue - $cogsBalance;

        // 5020: Operating Expenses
        $expAccount = $this->findAccountByCode('5020');
        $operatingExpenses = $expAccount ? $expAccount->balance : 0.0;

        // Net Profit = Gross Profit - Operating Expenses
        $netProfit = $grossProfit - $operatingExpenses;

        // Stock Metrics
        $stockMetrics = $this->getDashboardStockMetrics();

        // Orders metrics
        $completedOrdersCount = Order::where('status', 'completed')->count();
        $pendingOrdersCount = Order::where('status', 'pending')->count();
        $totalOrdersCount = Order::count();
        $totalSalesGrandTotal = (float) Order::where('status', 'completed')->sum('grand_total');

        // Customers metrics
        $totalCustomersCount = Customer::count();
        $totalCustomerDues = (float) Customer::sum('credit_balance');

        return [
            // Core Financials
            'sales_revenue' => round($totalRevenue, 2),
            'cogs' => round($cogsBalance, 2),
            'gross_profit' => round($grossProfit, 2),
            'operating_expenses' => round($operatingExpenses, 2),
            'net_profit' => round($netProfit, 2),
            'tax_payable' => round($totalTaxPayable, 2),
            'accounts_receivable' => round($arBalance, 2),
            'accounts_payable' => round($totalAccountsPayable, 2),
            'cash_balance' => round($cashBalance, 2),
            'cash_on_hand' => round($cashBalance, 2),
            'total_bank_balance' => round($totalBankBalances, 2),
            'total_liquid_funds' => round($cashBalance + $totalBankBalances, 2),

            // Stock & Valuation Metrics
            'stock_cost_value' => $stockMetrics['total_stock_cost_value'],
            'stock_expected_sales_value' => $stockMetrics['total_expected_sales_value'],
            'stock_potential_profit' => $stockMetrics['potential_stock_profit'],
            'stock_profit_margin_percent' => $stockMetrics['potential_profit_margin_percent'],
            'stock_total_units' => $stockMetrics['total_physical_stock_units'],
            'stock_low_count' => $stockMetrics['low_stock_items_count'],
            'inventory_valuation' => $stockMetrics['total_stock_cost_value'],

            // Orders & Sales
            'completed_orders' => $completedOrdersCount,
            'pending_orders' => $pendingOrdersCount,
            'total_orders' => $totalOrdersCount,
            'total_sales_amount' => round($totalSalesGrandTotal, 2),

            // Customers
            'total_customers' => $totalCustomersCount,
            'total_customer_dues' => round($totalCustomerDues, 2),
        ];
    }
}
