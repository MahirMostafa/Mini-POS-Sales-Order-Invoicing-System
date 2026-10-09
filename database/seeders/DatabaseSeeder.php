<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            ChartOfAccountsSeeder::class,
            BankAccountsSeeder::class,
            TaxRatesSeeder::class,
            SettingsSeeder::class,
            CustomersSeeder::class,
            UsersSeeder::class,
            ProductCategoriesAndProductsSeeder::class,
        ]);
    }
}
