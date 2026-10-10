<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create All Granular Atomic Permissions
        $permissions = [
            // Dashboard: Core Landing & Global Enterprise Cards
            'view-dashboard',
            'view-dashboard-gross-revenue',
            'view-dashboard-total-orders',
            'view-dashboard-aov',
            'view-dashboard-vat-collected',
            'view-dashboard-cash-in-hand',
            'view-dashboard-bank-balance',
            'view-dashboard-liabilities',
            'view-dashboard-expenses',
            'view-dashboard-net-profit',
            'view-dashboard-revenue-chart',
            'view-dashboard-tender-chart',
            'view-dashboard-customers',
            'view-dashboard-products',
            'view-dashboard-cashier-leaderboard',
            'view-dashboard-recent-orders',

            // Dashboard: User-Specific / My Shift Telemetry Cards
            'view-dashboard-my-sales',
            'view-dashboard-my-orders',
            'view-dashboard-my-vat',
            'view-dashboard-my-tender',
            'view-dashboard-my-aov',

            // POS & Sales
            'view-pos',
            'create-order',
            'complete-order',
            'cancel-order',
            'view-invoices',
            'print-invoices',

            // Customer Management
            'view-customers',
            'create-customers',
            'edit-customers',
            'delete-customers',
            'manage-customers',

            // Products & Categories
            'manage-products',
            'view-categories',
            'create-categories',
            'edit-categories',
            'delete-categories',
            'manage-categories',

            // Purchases & Procurement
            'manage-purchases',
            'receive-purchases',

            // Tax Rates
            'manage-tax-rates',

            // Cash in Hand Permissions
            'view-cash-book',
            'add-cash-money',
            'withdraw-cash-money',
            'manage-cash-book',

            // Bank Accounts Permissions
            'view-banks',
            'create-banks',
            'edit-banks',
            'delete-banks',
            'deposit-banks',
            'withdraw-banks',
            'view-bank-statements',
            'manage-banks',

            // Financial Statements & Books
            'view-bank-book',
            'view-day-book',
            'view-trial-balance',
            'view-balance-sheet',
            'view-profit-loss',
            'view-ledger',
            'view-journal-entries',
            'create-journal-entry',

            // Chart of Accounts (COA)
            'view-chart-of-accounts',
            'create-chart-of-accounts',
            'edit-chart-of-accounts',
            'delete-chart-of-accounts',
            'manage-chart-of-accounts',

            // Administration
            'manage-users',
            'manage-roles',
            'view-audit-logs',
            'manage-settings',
        ];

        // Clean up legacy, phantom, and redundant permissions if they exist
        $legacyPerms = [
            'view-accounting-dashboard',
            'view-dashboard-stock-info',
            'view-dashboard-customer-info',
            'view-dashboard-orders-info',
            'view-dashboard-recent-journals',
            'view-dashboard-purchases',
            'view-dashboard-low-stock',
            'view-dashboard-sales',
            'view-dashboard-financials',
            'view-dashboard-charts',
            'view-dashboard-sales-by-user',
        ];
        Permission::whereIn('name', $legacyPerms)->delete();

        // Ensure all valid permissions exist in database
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // 1. Admin Role (Has all permissions without exception)
        $adminRole = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::all());

        // 2. Cashier Role
        $cashierRole = Role::firstOrCreate(['name' => 'Cashier', 'guard_name' => 'web']);
        $cashierRole->syncPermissions([
            'view-dashboard',
            'view-dashboard-my-sales',
            'view-dashboard-my-orders',
            'view-dashboard-my-vat',
            'view-dashboard-my-tender',
            'view-dashboard-my-aov',
            'view-pos',
            'create-order',
            'complete-order',
            'cancel-order',
            'view-invoices',
            'print-invoices',
            'view-customers',
            'create-customers',
            'edit-customers',
            'manage-customers',
            'view-cash-book',
            'add-cash-money',
            'view-banks',
            'deposit-banks',
        ]);

        // 3. Accountant Role
        $accountantRole = Role::firstOrCreate(['name' => 'Accountant', 'guard_name' => 'web']);
        $accountantRole->syncPermissions([
            'view-dashboard',
            'view-dashboard-gross-revenue',
            'view-dashboard-total-orders',
            'view-dashboard-aov',
            'view-dashboard-vat-collected',
            'view-dashboard-cash-in-hand',
            'view-dashboard-bank-balance',
            'view-dashboard-liabilities',
            'view-dashboard-expenses',
            'view-dashboard-net-profit',
            'view-dashboard-revenue-chart',
            'view-dashboard-tender-chart',
            'view-dashboard-customers',
            'view-dashboard-products',
            'view-dashboard-cashier-leaderboard',
            'view-dashboard-recent-orders',
            'view-invoices',
            'print-invoices',
            'view-customers',
            'view-cash-book',
            'add-cash-money',
            'withdraw-cash-money',
            'manage-cash-book',
            'view-banks',
            'create-banks',
            'edit-banks',
            'delete-banks',
            'deposit-banks',
            'withdraw-banks',
            'view-bank-statements',
            'manage-banks',
            'view-bank-book',
            'view-day-book',
            'view-trial-balance',
            'view-balance-sheet',
            'view-profit-loss',
            'view-ledger',
            'view-journal-entries',
            'create-journal-entry',
            'view-chart-of-accounts',
            'create-chart-of-accounts',
            'edit-chart-of-accounts',
            'delete-chart-of-accounts',
            'manage-chart-of-accounts',
            'manage-tax-rates',
            'view-audit-logs',
            'manage-purchases',
        ]);

        // 4. Store Keeper Role (Specifically restricted to receiving purchased goods)
        $storeKeeperRole = Role::firstOrCreate(['name' => 'Store Keeper', 'guard_name' => 'web']);
        $storeKeeperRole->syncPermissions([
            'view-dashboard',
            'receive-purchases',
        ]);
    }
}
