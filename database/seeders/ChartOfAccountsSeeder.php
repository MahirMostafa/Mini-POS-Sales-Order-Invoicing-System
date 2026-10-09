<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // --- ASSETS (1000s) ---
            [
                'account_code' => '1010',
                'account_name' => 'Cash in Hand',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'Petty cash and cash collected at POS counters.',
            ],
            [
                'account_code' => '1020',
                'account_name' => 'Bank Accounts (General)',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'General master operating bank accounts and digital settlements.',
            ],
            [
                'account_code' => '1021',
                'account_name' => 'Dutch Bangla Bank (DBBL)',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'DBBL Corporate Current Account #110.120.4567.',
            ],
            [
                'account_code' => '1022',
                'account_name' => 'City Bank Ltd',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'City Bank Corporate Account #210.330.7890.',
            ],
            [
                'account_code' => '1023',
                'account_name' => 'bKash Merchant Wallet',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'bKash Merchant Digital Account #01700000000.',
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

            // --- LIABILITIES (2000s) ---
            [
                'account_code' => '2010',
                'account_name' => 'Tax Payable (Output VAT)',
                'account_type' => 'Liability',
                'normal_balance' => 'Credit',
                'description' => 'Sales tax/VAT collected from customers payable to the tax authority.',
            ],
            [
                'account_code' => '2020',
                'account_name' => 'Accounts Payable (Suppliers)',
                'account_type' => 'Liability',
                'normal_balance' => 'Credit',
                'description' => 'Outstanding dues payable to vendors and suppliers for purchases.',
            ],

            // --- EQUITY (3000s) ---
            [
                'account_code' => '3010',
                'account_name' => "Owner's Equity / Capital",
                'account_type' => 'Equity',
                'normal_balance' => 'Credit',
                'description' => 'Initial and ongoing capital invested into the business.',
            ],
            [
                'account_code' => '3020',
                'account_name' => 'Retained Earnings',
                'account_type' => 'Equity',
                'normal_balance' => 'Credit',
                'description' => 'Cumulative net earnings retained in the business.',
            ],

            // --- REVENUE (4000s) ---
            [
                'account_code' => '4010',
                'account_name' => 'Sales Revenue',
                'account_type' => 'Revenue',
                'normal_balance' => 'Credit',
                'description' => 'Gross earnings generated from product sales and orders.',
            ],
            [
                'account_code' => '4020',
                'account_name' => 'Other Operating Income',
                'account_type' => 'Revenue',
                'normal_balance' => 'Credit',
                'description' => 'Miscellaneous income, interest, and non-core receipts.',
            ],

            // --- EXPENSES (5000s) ---
            [
                'account_code' => '5010',
                'account_name' => 'Cost of Goods Sold (COGS)',
                'account_type' => 'Expense',
                'normal_balance' => 'Debit',
                'description' => 'Direct cost of merchandise sold to customers.',
            ],
            [
                'account_code' => '5020',
                'account_name' => 'Operating & Administrative Expenses',
                'account_type' => 'Expense',
                'normal_balance' => 'Debit',
                'description' => 'Shop rent, utilities, electricity, logistics, and supplies.',
            ],
            [
                'account_code' => '5030',
                'account_name' => 'Sales Discounts Allowed',
                'account_type' => 'Expense',
                'normal_balance' => 'Debit',
                'description' => 'Promotional discounts provided to customers on sales.',
            ],
        ];

        foreach ($accounts as $account) {
            ChartOfAccount::updateOrCreate(
                ['account_code' => $account['account_code']],
                $account
            );
        }
    }
}
