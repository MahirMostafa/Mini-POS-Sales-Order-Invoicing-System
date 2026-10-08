<?php

namespace App\Repositories;

use App\Contracts\Repositories\AccountingRepositoryInterface;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Order;
use App\Models\Invoice;
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

        $entryData['total_debit'] = $totalDebit;
        $entryData['total_credit'] = $totalCredit;

        $entry = JournalEntry::create($entryData);

        foreach ($itemsData as $item) {
            $item['journal_entry_id'] = $entry->id;
            JournalItem::create($item);
        }

        return $entry->load(['items.account', 'creator']);
    }

    public function paginateJournalEntries(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = JournalEntry::with(['items.account', 'creator']);

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
        }

        return $query->latest('id')->paginate($perPage);
    }

    public function findJournalEntryById(int $id): ?JournalEntry
    {
        return JournalEntry::with(['items.account', 'creator'])->find($id);
    }

    public function getAccountLedger(int $accountId, ?string $startDate = null, ?string $endDate = null): Collection
    {
        $query = JournalItem::with(['entry'])
            ->where('account_id', $accountId);

        if ($startDate && $endDate) {
            $query->whereHas('entry', function ($eq) use ($startDate, $endDate) {
                $eq->whereBetween('entry_date', [$startDate, $endDate]);
            });
        }

        return $query->latest('id')->get();
    }

    public function getTrialBalance(): array
    {
        $accounts = ChartOfAccount::with(['journalItems'])->orderBy('account_code')->get();
        $trialBalance = [];
        $totalDebit = 0.0;
        $totalCredit = 0.0;

        foreach ($accounts as $account) {
            $debitSum = (float) $account->journalItems->sum('debit');
            $creditSum = (float) $account->journalItems->sum('credit');

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
                'account_id' => $account->id,
                'account_code' => $account->account_code,
                'account_name' => $account->account_name,
                'account_type' => $account->account_type,
                'normal_balance' => $account->normal_balance,
                'total_debit' => $debitSum,
                'total_credit' => $creditSum,
                'net_debit' => $netDebit,
                'net_credit' => $netCredit,
            ];
        }

        return [
            'accounts' => $trialBalance,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'is_balanced' => abs($totalDebit - $totalCredit) < 0.01,
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

        // 1010: Cash in Hand
        $cashAccount = $this->findAccountByCode('1010');
        $cashBalance = $cashAccount ? $cashAccount->balance : 0.0;

        // 5010: COGS
        $cogsAccount = $this->findAccountByCode('5010');
        $cogsBalance = $cogsAccount ? $cogsAccount->balance : 0.0;

        // Gross Profit = Sales Revenue - COGS
        $grossProfit = $totalRevenue - $cogsBalance;

        // Completed vs Pending Orders
        $completedOrdersCount = Order::where('status', 'completed')->count();
        $pendingOrdersCount = Order::where('status', 'pending')->count();
        $totalOrdersCount = Order::count();

        return [
            'accounts_receivable' => $arBalance,
            'sales_revenue' => $totalRevenue,
            'tax_payable' => $totalTaxPayable,
            'cash_balance' => $cashBalance,
            'cogs' => $cogsBalance,
            'gross_profit' => $grossProfit,
            'completed_orders' => $completedOrdersCount,
            'pending_orders' => $pendingOrdersCount,
            'total_orders' => $totalOrdersCount,
        ];
    }
}
