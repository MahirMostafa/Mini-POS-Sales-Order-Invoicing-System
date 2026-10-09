<?php

namespace Database\Seeders;

use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class BankAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $dbblCoa = ChartOfAccount::where('account_code', '1021')->first();
        $cityCoa = ChartOfAccount::where('account_code', '1022')->first();
        $bkashCoa = ChartOfAccount::where('account_code', '1023')->first();
        $generalBankCoa = ChartOfAccount::where('account_code', '1020')->first();

        $banks = [
            [
                'bank_name' => 'Dutch Bangla Bank Ltd (DBBL)',
                'account_name' => 'Alo IT Main Operating Account',
                'account_number' => '110.120.456789',
                'branch_name' => 'Gulshan Corporate Branch',
                'routing_number' => '090271638',
                'opening_balance' => 50000.00,
                'chart_of_account_id' => $dbblCoa?->id ?? $generalBankCoa?->id,
                'is_active' => true,
                'notes' => 'Primary corporate checking account used for bank card swipes and online POS settlements.',
            ],
            [
                'bank_name' => 'The City Bank Ltd',
                'account_name' => 'Alo IT Reserve Account',
                'account_number' => '210.330.789012',
                'branch_name' => 'Dhanmondi Branch',
                'routing_number' => '225271890',
                'opening_balance' => 25000.00,
                'chart_of_account_id' => $cityCoa?->id ?? $generalBankCoa?->id,
                'is_active' => true,
                'notes' => 'Secondary account for vendor purchase transfers and supplier settlements.',
            ],
            [
                'bank_name' => 'bKash Merchant Digital Wallet',
                'account_name' => 'Alo IT POS bKash QR',
                'account_number' => '01711002233',
                'branch_name' => 'Digital Merchant Platform',
                'routing_number' => 'BKASH01',
                'opening_balance' => 10000.00,
                'chart_of_account_id' => $bkashCoa?->id ?? $generalBankCoa?->id,
                'is_active' => true,
                'notes' => 'Direct QR Code and MFS mobile wallet payments from retail counter customers.',
            ],
        ];

        $capitalCoa = ChartOfAccount::where('account_code', '3010')->first();

        foreach ($banks as $bankData) {
            $bank = BankAccount::updateOrCreate(
                ['account_number' => $bankData['account_number']],
                $bankData
            );

            if ($bank->opening_balance > 0 && $bank->chart_of_account_id && $capitalCoa) {
                $alreadyPosted = \App\Models\JournalEntry::where('reference_type', 'BankOpeningBalance')
                    ->where('reference_id', $bank->id)
                    ->exists();

                if (!$alreadyPosted) {
                    $entry = \App\Models\JournalEntry::create([
                        'entry_number' => 'JE-BANK-OPEN-' . str_pad($bank->id, 4, '0', STR_PAD_LEFT),
                        'entry_date' => now()->startOfMonth(),
                        'reference_type' => 'BankOpeningBalance',
                        'reference_id' => $bank->id,
                        'description' => "Opening Capital / Bank Deposit for {$bank->bank_name} ({$bank->account_number})",
                        'total_debit' => (float) $bank->opening_balance,
                        'total_credit' => (float) $bank->opening_balance,
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
        }
    }
}
