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

        // Create Permissions
        $permissions = [
            'view-pos',
            'create-order',
            'complete-order',
            'cancel-order',
            'view-invoices',
            'print-invoices',
            'manage-products',
            'view-categories',
            'create-categories',
            'edit-categories',
            'delete-categories',
            'manage-categories',
            'manage-purchases',
            'receive-purchases',
            'view-customers',
            'create-customers',
            'edit-customers',
            'delete-customers',
            'manage-customers',
            'manage-tax-rates',
            'view-accounting-dashboard',
            'view-ledger',
            'view-journal-entries',
            'manage-users',
            'manage-roles',
            'view-audit-logs',
            'manage-settings',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // 1. Admin Role (Has all permissions)
        $adminRole = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::all());

        // 2. Cashier Role (POS, Orders, Invoices, Customer View/Create/Edit, but CANNOT delete customers)
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
        ]);

        // 3. Accountant Role (Accounting Dashboard, Ledger, Journal Entries, Invoices, Customer View, Tax Rates, Audit Logs)
        $accountantRole = Role::firstOrCreate(['name' => 'Accountant', 'guard_name' => 'web']);
        $accountantRole->syncPermissions([
            'view-invoices',
            'print-invoices',
            'view-customers',
            'view-accounting-dashboard',
            'view-ledger',
            'view-journal-entries',
            'manage-tax-rates',
            'view-audit-logs',
        ]);
    }
}
