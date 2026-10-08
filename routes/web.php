<?php

use App\Http\Controllers\AccountingController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\TaxRateController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes & Application Endpoints
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
    Route::get('/', [UserController::class, 'index']);
    Route::post('/', [UserController::class, 'store']);
    Route::put('/{id}', [UserController::class, 'update']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
});

// Roles & Permissions (Spatie)
Route::prefix('roles')->group(function () {
    Route::get('/', [RolePermissionController::class, 'index']);
    Route::post('/', [RolePermissionController::class, 'store']);
    Route::put('/{roleId}/permissions', [RolePermissionController::class, 'updatePermissions']);
});

// Purchases & Inflow Management
Route::prefix('purchases')->group(function () {
    Route::get('/', [PurchaseController::class, 'index']);
    Route::post('/', [PurchaseController::class, 'store']);
    Route::post('/{id}/receive', [PurchaseController::class, 'receive']);
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

// Single Page Application Route Fallback
Route::fallback(function () {
    return view('app');
});
