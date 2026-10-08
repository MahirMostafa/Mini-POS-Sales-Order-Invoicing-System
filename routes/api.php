<?php

use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TaxRateController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes for Mini POS & Invoicing System
|--------------------------------------------------------------------------
*/

// Authentication Endpoints
Route::prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/quick-login/{user}', [AuthController::class, 'quickLogin']);
    Route::get('/demo-users', [AuthController::class, 'getDemoUsers']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// POS Screen
Route::prefix('pos')->group(function () {
    Route::get('/init', [PosController::class, 'init']);
    Route::get('/search', [PosController::class, 'search']);
});

// Sales Orders
Route::prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/{id}', [OrderController::class, 'show']);
    Route::get('/{id}/validate-stock', [OrderController::class, 'validateStock']);
    Route::post('/{id}/complete', [OrderController::class, 'complete']);
    Route::post('/{id}/cancel', [OrderController::class, 'cancel']);
});

// Invoices
Route::prefix('invoices')->group(function () {
    Route::get('/', [InvoiceController::class, 'index']);
    Route::get('/{id}', [InvoiceController::class, 'show']);
});

// Accounting Module & Dashboard
Route::prefix('accounting')->group(function () {
    Route::get('/dashboard', [AccountingController::class, 'dashboard']);
    Route::get('/journal-entries', [AccountingController::class, 'journalEntries']);
    Route::get('/trial-balance', [AccountingController::class, 'trialBalance']);
    Route::get('/ledger/{accountId}', [AccountingController::class, 'ledger']);
});

// User Management
Route::prefix('users')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\UserController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\UserController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\Api\UserController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);
});

// Roles & Permissions (Spatie)
Route::prefix('roles')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\RolePermissionController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\RolePermissionController::class, 'store']);
    Route::put('/{roleId}/permissions', [\App\Http\Controllers\Api\RolePermissionController::class, 'updatePermissions']);
});

// Purchases & Inflow Management
Route::prefix('purchases')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\PurchaseController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\PurchaseController::class, 'store']);
    Route::post('/{id}/receive', [\App\Http\Controllers\Api\PurchaseController::class, 'receive']);
});

// Categories Management
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::get('/{id}', [CategoryController::class, 'show']);
    Route::put('/{id}', [CategoryController::class, 'update']);
    Route::post('/{id}/toggle-status', [CategoryController::class, 'toggleStatus']);
    Route::delete('/{id}', [CategoryController::class, 'destroy']);
});

// Products & Inventory

Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::post('/', [ProductController::class, 'store']);
    Route::get('/{id}', [ProductController::class, 'show']);
    Route::put('/{id}', [ProductController::class, 'update']);
    Route::delete('/{id}', [ProductController::class, 'destroy']);
    Route::post('/variants/{variantId}/stock', [ProductController::class, 'addStock']);
});

// Customers
Route::prefix('customers')->group(function () {
    Route::get('/', [CustomerController::class, 'index']);
    Route::post('/', [CustomerController::class, 'store']);
    Route::get('/{id}', [CustomerController::class, 'show']);
    Route::put('/{id}', [CustomerController::class, 'update']);
    Route::post('/{id}/settle-due', [CustomerController::class, 'settleDue']);
    Route::delete('/{id}', [CustomerController::class, 'destroy']);
});

// Tax Rates (Dynamic CRUD)
Route::prefix('tax-rates')->group(function () {
    Route::get('/', [TaxRateController::class, 'index']);
    Route::post('/', [TaxRateController::class, 'store']);
    Route::put('/{id}', [TaxRateController::class, 'update']);
    Route::post('/{id}/set-default', [TaxRateController::class, 'setDefault']);
    Route::delete('/{id}', [TaxRateController::class, 'destroy']);
});

// Audit Logs
Route::get('/audit-logs', [AuditLogController::class, 'index']);
