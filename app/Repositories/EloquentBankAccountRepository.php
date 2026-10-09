<?php

namespace App\Repositories;

use App\Contracts\Repositories\BankAccountRepositoryInterface;
use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use Illuminate\Database\Eloquent\Collection;

class EloquentBankAccountRepository implements BankAccountRepositoryInterface
{
    public function getAll(bool $onlyActive = false): Collection
    {
        $query = BankAccount::with('chartOfAccount');
        if ($onlyActive) {
            $query->where('is_active', true);
        }
        return $query->latest('id')->get();
    }

    public function findById(int $id): ?BankAccount
    {
        return BankAccount::with('chartOfAccount')->find($id);
    }

    public function create(array $data): BankAccount
    {
        // If chart_of_account_id is not specified, auto-link to general bank head or create a specific head
        if (empty($data['chart_of_account_id'])) {
            $generalBankCoa = ChartOfAccount::where('account_code', '1020')->first();
            $data['chart_of_account_id'] = $generalBankCoa?->id;
        }

        $bank = BankAccount::create($data)->fresh('chartOfAccount');

        // If initial opening balance is provided, record opening capital journal entry
        if ((float) $bank->opening_balance > 0 && $bank->chart_of_account_id) {
            $capitalCoa = ChartOfAccount::where('account_code', '3010')->first();
            if ($capitalCoa) {
                $entry = \App\Models\JournalEntry::create([
                    'entry_number' => 'JE-BANK-OPEN-' . str_pad($bank->id, 4, '0', STR_PAD_LEFT),
                    'entry_date' => now()->startOfMonth(),
                    'reference_type' => 'BankOpeningBalance',
                    'reference_id' => $bank->id,
                    'description' => "Opening Capital / Bank Deposit for {$bank->bank_name} ({$bank->account_number})",
                    'total_debit' => (float) $bank->opening_balance,
                    'total_credit' => (float) $bank->opening_balance,
                    'created_by' => auth()->id(),
                ]);

                \App\Models\JournalItem::create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $bank->chart_of_account_id,
                    'bank_account_id' => $bank->id,
                    'debit' => (float) $bank->opening_balance,
                    'credit' => 0.00,
                    'narration' => "Opening liquid deposit for {$bank->account_name}",
                ]);

                \App\Models\JournalItem::create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $capitalCoa->id,
                    'bank_account_id' => null,
                    'debit' => 0.00,
                    'credit' => (float) $bank->opening_balance,
                    'narration' => "Initial owner capital deployed to {$bank->bank_name}",
                ]);
            }
        }

        return $bank;
    }

    public function update(BankAccount $bank, array $data): BankAccount
    {
        $bank->update($data);
        return $bank->fresh('chartOfAccount');
    }

    public function delete(BankAccount $bank): bool
    {
        // Check if bank has associated orders, purchases or journal entries
        if ($bank->orders()->exists() || $bank->purchases()->exists() || $bank->journalItems()->exists()) {
            // Deactivate instead of hard deleting to preserve audit integrity
            $bank->update(['is_active' => false]);
            return true;
        }

        return (bool) $bank->delete();
    }

    public function toggleStatus(BankAccount $bank): BankAccount
    {
        $bank->update(['is_active' => !$bank->is_active]);
        return $bank->fresh('chartOfAccount');
    }

    public function getBankSummary(): array
    {
        $banks = $this->getAll();
        $totalBalance = 0.0;
        $activeBanksCount = 0;

        $banksList = [];
        foreach ($banks as $bank) {
            $balance = (float) $bank->current_balance;
            if ($bank->is_active) {
                $totalBalance += $balance;
                $activeBanksCount++;
            }

            $banksList[] = [
                'id' => $bank->id,
                'bank_name' => $bank->bank_name,
                'account_name' => $bank->account_name,
                'account_number' => $bank->account_number,
                'branch_name' => $bank->branch_name,
                'opening_balance' => (float) $bank->opening_balance,
                'current_balance' => $balance,
                'is_active' => (bool) $bank->is_active,
                'chart_of_account' => $bank->chartOfAccount,
                'display_label' => $bank->display_label,
            ];
        }

        return [
            'total_bank_balance' => round($totalBalance, 2),
            'total_banks_count' => $banks->count(),
            'active_banks_count' => $activeBanksCount,
            'banks' => $banksList,
        ];
    }
}
