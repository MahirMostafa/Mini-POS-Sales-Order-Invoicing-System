<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $defaultPassword = Hash::make('password123');

        // 1. Admins (3 Admins: 1 Demo + 2 Standard)
        $admin1 = User::updateOrCreate(
            ['email' => 'admin@pos.com'],
            [
                'name' => 'Super Admin (Demo)',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $admin1->syncRoles(['Admin']);

        $admin2 = User::updateOrCreate(
            ['email' => 'admin.ops@pos.com'],
            [
                'name' => 'Operations Admin',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $admin2->syncRoles(['Admin']);

        $admin3 = User::updateOrCreate(
            ['email' => 'admin.store@pos.com'],
            [
                'name' => 'Store Admin',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $admin3->syncRoles(['Admin']);

        // 2. Accountants (2 Accountants: 1 Demo + 1 Standard)
        $accountant1 = User::updateOrCreate(
            ['email' => 'accountant1@pos.com'],
            [
                'name' => 'Senior Accountant (Demo)',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $accountant1->syncRoles(['Accountant']);

        $accountant2 = User::updateOrCreate(
            ['email' => 'accountant2@pos.com'],
            [
                'name' => 'Junior Accountant',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $accountant2->syncRoles(['Accountant']);

        // 3. Counter Cashiers (5 Counters: Counter 1 Demo + Counters 2 to 5)
        $counter1 = User::updateOrCreate(
            ['email' => 'counter1@pos.com'],
            [
                'name' => 'Counter 1 (Demo Cashier)',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $counter1->syncRoles(['Cashier']);

        $counter2 = User::updateOrCreate(
            ['email' => 'counter2@pos.com'],
            [
                'name' => 'Counter 2 Cashier',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $counter2->syncRoles(['Cashier']);

        $counter3 = User::updateOrCreate(
            ['email' => 'counter3@pos.com'],
            [
                'name' => 'Counter 3 Cashier',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $counter3->syncRoles(['Cashier']);

        $counter4 = User::updateOrCreate(
            ['email' => 'counter4@pos.com'],
            [
                'name' => 'Counter 4 Cashier',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $counter4->syncRoles(['Cashier']);

        $counter5 = User::updateOrCreate(
            ['email' => 'counter5@pos.com'],
            [
                'name' => 'Counter 5 Cashier',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $counter5->syncRoles(['Cashier']);

        // 4. Store Keeper (Specifically restricted to receiving purchased goods)
        $storeKeeper = User::updateOrCreate(
            ['email' => 'storekeeper@pos.com'],
            [
                'name' => 'Warehouse Store Keeper',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );
        $storeKeeper->syncRoles(['Store Keeper']);
    }
}

