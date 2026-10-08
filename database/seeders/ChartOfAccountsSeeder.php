<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'account_code' => '1010',
                'account_name' => 'Cash in Hand',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'Petty cash and cash collected at POS counters.',
            ],
            [
                'account_code' => '1020',
                'account_name' => 'Bank Account (Main)',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'Operating bank accounts and card settlements.',
            ],
            [
                'account_code' => '1050',
                'account_name' => 'Accounts Receivable',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'Amounts owed by customers on sales orders and invoices.',
            ],
            [
                'account_code' => '1060',
                'account_name' => 'Merchandise Inventory',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'Total cost value of physical inventory held in stock.',
            ],
            [
                'account_code' => '2010',
                'account_name' => 'Tax Payable (Output VAT 5%)',
                'account_type' => 'Liability',
                'normal_balance' => 'Credit',
                'description' => 'Sales tax/VAT collected from customers payable to the tax authority.',
            ],
            [
                'account_code' => '4010',
                'account_name' => 'Sales Revenue',
                'account_type' => 'Revenue',
                'normal_balance' => 'Credit',
                'description' => 'Gross earnings generated from product and service sales.',
            ],
            [
                'account_code' => '5010',
                'account_name' => 'Cost of Goods Sold (COGS)',
                'account_type' => 'Expense',
                'normal_balance' => 'Debit',
                'description' => 'Direct cost of merchandise sold to customers.',
            ],
        ];

        foreach ($accounts as $account) {
            ChartOfAccount::firstOrCreate(
                ['account_code' => $account['account_code']],
                $account
            );
        }
    }
}
