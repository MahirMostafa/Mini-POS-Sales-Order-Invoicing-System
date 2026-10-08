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
            TaxRatesSeeder::class,
            SettingsSeeder::class,
            CustomersSeeder::class,
            ProductCategoriesAndProductsSeeder::class,
            UsersSeeder::class,
        ]);
    }
}
