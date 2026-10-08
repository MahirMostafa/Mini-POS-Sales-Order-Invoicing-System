<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@minipos.com'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles(['Admin']);

        // 2. Cashier User
        $cashier = User::firstOrCreate(
            ['email' => 'cashier@minipos.com'],
            [
                'name' => 'Main POS Cashier',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );
        $cashier->syncRoles(['Cashier']);

        // 3. Accountant User
        $accountant = User::firstOrCreate(
            ['email' => 'accountant@minipos.com'],
            [
                'name' => 'Lead Accountant',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );
        $accountant->syncRoles(['Accountant']);
    }
}
