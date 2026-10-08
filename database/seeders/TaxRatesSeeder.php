<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use App\Models\TaxRate;
use Illuminate\Database\Seeder;

class TaxRatesSeeder extends Seeder
{
    public function run(): void
    {
        $taxAccount = ChartOfAccount::where('account_code', '2010')->first();

        $rates = [
            [
                'name' => 'Standard VAT (5.00%)',
                'rate' => 5.00,
                'account_id' => $taxAccount?->id,
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Zero Rated (0.00%)',
                'rate' => 0.00,
                'account_id' => $taxAccount?->id,
                'is_default' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Luxury / Premium Tax (10.00%)',
                'rate' => 10.00,
                'account_id' => $taxAccount?->id,
                'is_default' => false,
                'is_active' => true,
            ],
        ];

        foreach ($rates as $rate) {
            TaxRate::firstOrCreate(
                ['name' => $rate['name']],
                $rate
            );
        }
    }
}
