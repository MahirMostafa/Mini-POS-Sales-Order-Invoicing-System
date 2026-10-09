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

            // Granular Dashboard Section Permissions
            'view-accounting-dashboard',
            'view-dashboard-financials',
            'view-dashboard-stock-info',
            'view-dashboard-customer-info',
            'view-dashboard-orders-info',
            'view-dashboard-recent-journals',

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

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // 1. Admin Role (Has all permissions without exception)
        $adminRole = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::all());

        // 2. Cashier Role (POS, Orders, Invoices, Customer View/Create/Edit, Customer & Order Dashboard cards, Cash in Hand & Bank views)
        $cashierRole = Role::firstOrCreate(['name' => 'Cashier', 'guard_name' => 'web']);
        $cashierRole->syncPermissions([
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
            'view-dashboard-orders-info',
            'view-dashboard-customer-info',
            'view-cash-book',
            'add-cash-money',
            'view-banks',
            'deposit-banks',
        ]);

        // 3. Accountant Role (Full Financials, Cash Book, Bank Book, Day Book, Trial Balance, Balance Sheet, P&L, Ledger, Taxes, Bank Management)
        $accountantRole = Role::firstOrCreate(['name' => 'Accountant', 'guard_name' => 'web']);
        $accountantRole->syncPermissions([
            'view-invoices',
            'print-invoices',
            'view-customers',
            'view-accounting-dashboard',
            'view-dashboard-financials',
            'view-dashboard-stock-info',
            'view-dashboard-customer-info',
            'view-dashboard-orders-info',
            'view-dashboard-recent-journals',
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
    }
}
