<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

// Repository Contracts & Implementations
use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Repositories\EloquentCustomerRepository;
use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Repositories\EloquentCategoryRepository;
use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Repositories\EloquentProductRepository;
use App\Contracts\Repositories\ProductVariantRepositoryInterface;
use App\Repositories\EloquentProductVariantRepository;
use App\Contracts\Repositories\OrderRepositoryInterface;
use App\Repositories\EloquentOrderRepository;
use App\Contracts\Repositories\InvoiceRepositoryInterface;
use App\Repositories\EloquentInvoiceRepository;
use App\Contracts\Repositories\AccountingRepositoryInterface;
use App\Repositories\EloquentAccountingRepository;
use App\Contracts\Repositories\TaxRateRepositoryInterface;
use App\Repositories\EloquentTaxRateRepository;
use App\Contracts\Repositories\StockMovementRepositoryInterface;
use App\Repositories\EloquentStockMovementRepository;
use App\Contracts\Repositories\AuditLogRepositoryInterface;
use App\Repositories\EloquentAuditLogRepository;
use App\Contracts\Repositories\PurchaseRepositoryInterface;
use App\Repositories\EloquentPurchaseRepository;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Repositories\EloquentUserRepository;
use App\Contracts\Repositories\BankAccountRepositoryInterface;
use App\Repositories\EloquentBankAccountRepository;
use App\Contracts\Repositories\RolePermissionRepositoryInterface;
use App\Repositories\EloquentRolePermissionRepository;
use App\Contracts\Repositories\SettingRepositoryInterface;
use App\Repositories\EloquentSettingRepository;

// Service Contracts & Implementations
use App\Contracts\Services\OrderServiceInterface;
use App\Services\OrderService;
use App\Contracts\Services\AccountingServiceInterface;
use App\Services\AccountingService;
use App\Contracts\Services\InventoryServiceInterface;
use App\Services\InventoryService;
use App\Contracts\Services\InvoiceServiceInterface;
use App\Services\InvoiceService;
use App\Contracts\Services\AuditServiceInterface;
use App\Services\AuditService;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind Repositories
        $this->app->bind(CustomerRepositoryInterface::class, EloquentCustomerRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, EloquentCategoryRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
        $this->app->bind(ProductVariantRepositoryInterface::class, EloquentProductVariantRepository::class);
        $this->app->bind(OrderRepositoryInterface::class, EloquentOrderRepository::class);
        $this->app->bind(InvoiceRepositoryInterface::class, EloquentInvoiceRepository::class);
        $this->app->bind(AccountingRepositoryInterface::class, EloquentAccountingRepository::class);
        $this->app->bind(BankAccountRepositoryInterface::class, EloquentBankAccountRepository::class);
        $this->app->bind(TaxRateRepositoryInterface::class, EloquentTaxRateRepository::class);
        $this->app->bind(StockMovementRepositoryInterface::class, EloquentStockMovementRepository::class);
        $this->app->bind(AuditLogRepositoryInterface::class, EloquentAuditLogRepository::class);
        $this->app->bind(PurchaseRepositoryInterface::class, EloquentPurchaseRepository::class);
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
        $this->app->bind(RolePermissionRepositoryInterface::class, EloquentRolePermissionRepository::class);
        $this->app->bind(SettingRepositoryInterface::class, EloquentSettingRepository::class);

        // Bind Services
        $this->app->bind(OrderServiceInterface::class, OrderService::class);
        $this->app->bind(AccountingServiceInterface::class, AccountingService::class);
        $this->app->bind(InventoryServiceInterface::class, InventoryService::class);
        $this->app->bind(InvoiceServiceInterface::class, InvoiceService::class);
        $this->app->bind(AuditServiceInterface::class, AuditService::class);
    }

    public function boot(): void
    {
        //
    }
}
