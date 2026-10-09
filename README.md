# Mini POS, Sales Order & Invoicing System with Real-Time Double-Entry Accounting

[![Laravel 11](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A robust, enterprise-grade **Point of Sale (POS), Sales Order Processing, and Invoicing System** built with **Laravel 11**, **React 19**, **Vite**, **Tailwind CSS**, and an integrated **Double-Entry General Ledger Accounting Engine**.

---

## System Overview

This system bridges the gap between front-end point-of-sale operations and back-office corporate accounting. Every business transaction—whether a retail checkout at the counter, a wholesale order with credit terms, a purchase order receipt, or a cash-to-bank transfer—atomically updates inventory levels and posts balanced, GAAP-compliant double-entry journal vouchers to the General Ledger in real time.

---

## Core Feature Modules

### 1. Interactive POS Terminal & Checkout
- **Instant Product Lookup**: Category filtering, real-time multi-field search (Name, SKU, Barcode, Brand), and live barcode scanner input support.
- **Multi-Variant Product Architecture**: Seamlessly handle multiple variations per product (e.g., sizes, volumes, colors) with independent SKU tracking and dynamic selling prices.
- **Real-Time Calculation Engine**: Live recalculation of Subtotal, Item-level Discounts, Flat/Percentage Cart Discounts, Configurable Tax Rates (e.g., 5% Standard VAT), and Rounding Adjustments.
- **Multi-Tender Payment Gateway**:
  - **Cash in Hand**: Instant change calculation and denomination quick-add presets.
  - **Card / POS Terminal**: Direct integration debiting bank accounting heads with exact payable enforcement.
  - **Bank / Digital Transfer**: Real-time selection across registered company bank accounts without exposing internal bank balances to store cashiers.
  - **Credit / Due Sales**: Allowed exclusively for registered customers with real-time Accounts Receivable tracking.
- **Instant Receipt & Invoice Generation**: Native 80mm thermal receipt modal and standard printable tax invoices.

### 2. Sales Order & Lifecycle Management
- **Order State Machine**: Strict lifecycle flow (`Draft` / `Pending` -> `Completed` -> `Cancelled`).
- **Atomic Stock Verification**: Orders in `Pending` status reserve inventory logically; transitioning to `Completed` atomically validates stock availability, deducts inventory at the variant SKU level, generates the official invoice, and posts ledger entries.
- **Unified Completion Workflow**: Harmonized payment and accounting modal across the POS Terminal, Order Lists, and Order Details views.

### 3. Procurement & Purchase Order Management
- **Two-Stage Purchase Receiving**: Purchase orders transition from `Pending` to `Received` upon physical warehouse inspection.
- **Supplier & Landed Cost Tracking**: Manage supplier profiles, unit purchase costs, tax implications, and automatic weighted average cost (WAC) recalculations.
- **Printable Purchase Vouchers**: Print-ready purchase orders with supplier details, line-item audits, and authorized signature placeholders.

### 4. Real-Time Double-Entry Accounting & Banking Engine
- **Pre-Configured Chart of Accounts**:
  - `1010` Cash in Hand (Asset)
  - `1020` Bank Accounts (Asset)
  - `1050` Accounts Receivable (Asset)
  - `1060` Merchandise Inventory (Asset)
  - `2010` Tax Payable / Output VAT (Liability)
  - `2020` Accounts Payable (Liability)
  - `3010` Owner's Capital / Equity (Equity)
  - `4010` Sales Revenue (Revenue)
  - `5010` Cost of Goods Sold (COGS) (Expense)
- **Automatic Balanced Journal Entries**: System guarantees `SUM(Debits) == SUM(Credits)` on every transaction before committing database transactions.
- **Dedicated Bank Management**:
  - Multi-bank account registration (Bank Name, Account Name, Account Number, Branch, Routing Number).
  - Real-time Bank Book with chronological running balance calculations.
  - Inter-account fund transfers and cash-to-bank deposits/withdrawals with automated contra vouchers.
- **Cash Management**:
  - Real-time Cash Book tracking daily counter collections, petty cash disbursements, and bank settlements.

### 5. Granular Financial & Operational Reporting
A decoupled suite of 10 standalone financial report components equipped with custom date range filters, presets (Today, Yesterday, Last 7 Days, This Month), CSV export, and print optimization:
1. **Balance Sheet**: Comprehensive financial position statement (Assets = Liabilities + Equity).
2. **Income Statement (Profit & Loss)**: Operating revenues, cost of goods sold, gross profit, operating expenses, and net profit.
3. **Trial Balance**: Real-time validation of all ledger accounts with zero-sum verification.
4. **General Ledger**: Account-by-account transaction drill-down with running debit and credit balances.
5. **Cash Book**: Complete ledger of all cash receipts and disbursements.
6. **Bank Book**: Multi-bank account transaction history with chronological balances.
7. **Day Book**: Daily chronological digest of all operational vouchers.
8. **Tax / VAT Report**: Output tax collected vs input tax paid for statutory compliance.
9. **Sales by Customer Report**: Aggregate sales volume, invoices, and revenue breakdown per customer account.
10. **Sales by Item Report**: Product and variant sales volume, unit pricing, discounts, and total revenue performance.

### 6. Customer & Credit Management
- Customer directory with unique customer codes, contact details, and credit limits.
- Customer balance tracking and settlement collection directly into Cash or Bank accounts with automated Accounts Receivable reconciliation.

### 7. Role-Based Access Control (RBAC)
- Built on **Spatie Laravel Permission**.
- Granular permission matrix controlling access to POS checkout, order completion, purchase orders, bank account management, cash transfers, user roles, and each individual financial report.
- Pre-configured roles: `Admin`, `Manager`, `Accountant`, and `Cashier`.

### 8. Comprehensive Enterprise Audit Logging
- **Automated Activity Tracking**: Immutable audit trails logging every critical business action, including:
  - Sales order creations, status transitions, and cancellations.
  - Purchase order creation and inventory receipt verifications.
  - Inventory quantity adjustments and variant pricing updates.
  - Bank and cash deposits, withdrawals, and inter-account transfers.
  - Customer profile modifications and credit settlements.
  - System configuration and tax rate changes.
  - Role, permission, and user credential modifications.
- **Detailed Forensic Data**: Each audit entry records the initiating user ID, action type, affected model, old vs new JSON snapshots, client IP address, user agent, and timestamp.

---

## Architectural Design & Directory Structure

The application strictly adheres to the **Repository & Service Layer Pattern**, ensuring high testability, separation of concerns, and clean SOLID principles.

```
app/
├── Contracts/
│   ├── Repositories/
│   │   ├── AccountingRepositoryInterface.php
│   │   ├── BankAccountRepositoryInterface.php
│   │   ├── CustomerRepositoryInterface.php
│   │   ├── InvoiceRepositoryInterface.php
│   │   ├── OrderRepositoryInterface.php
│   │   ├── ProductRepositoryInterface.php
│   │   ├── ProductVariantRepositoryInterface.php
│   │   ├── PurchaseRepositoryInterface.php
│   │   ├── StockMovementRepositoryInterface.php
│   │   └── TaxRateRepositoryInterface.php
│   └── Services/
│       ├── AccountingServiceInterface.php
│       ├── InventoryServiceInterface.php
│       ├── InvoiceServiceInterface.php
│       └── OrderServiceInterface.php
├── Http/
│   ├── Controllers/
│   │   ├── AccountingController.php
│   │   ├── AuthController.php
│   │   ├── BankAccountController.php
│   │   ├── CustomerController.php
│   │   ├── InvoiceController.php
│   │   ├── OrderController.php
│   │   ├── PosController.php
│   │   ├── ProductController.php
│   │   ├── PurchaseController.php
│   │   ├── RolePermissionController.php
│   │   └── TaxRateController.php
│   └── Requests/
│       ├── CompleteOrderRequest.php
│       ├── StoreCustomerRequest.php
│       ├── StoreOrderRequest.php
│       ├── StoreProductRequest.php
│       └── StorePurchaseRequest.php
├── Models/
│   ├── AuditLog.php
│   ├── BankAccount.php
│   ├── ChartOfAccount.php
│   ├── Customer.php
│   ├── Invoice.php
│   ├── JournalEntry.php
│   ├── JournalItem.php
│   ├── Order.php
│   ├── OrderItem.php
│   ├── Product.php
│   ├── ProductCategory.php
│   ├── ProductVariant.php
│   ├── Purchase.php
│   ├── PurchaseItem.php
│   ├── StockMovement.php
│   ├── Supplier.php
│   └── TaxRate.php
├── Repositories/
│   ├── EloquentAccountingRepository.php
│   ├── EloquentBankAccountRepository.php
│   ├── EloquentCustomerRepository.php
│   ├── EloquentInvoiceRepository.php
│   ├── EloquentOrderRepository.php
│   ├── EloquentProductRepository.php
│   ├── EloquentPurchaseRepository.php
│   └── EloquentStockMovementRepository.php
├── Services/
│   ├── AccountingService.php
│   ├── InventoryService.php
│   ├── InvoiceService.php
│   └── OrderService.php
└── Providers/
    └── RepositoryServiceProvider.php

resources/js/
├── api/
│   └── client.js                  # Axios client with bearer token injection & interceptors
├── components/
│   ├── CompleteOrderModal.jsx     # Order completion modal
│   ├── PosPaymentModal.jsx        # POS payment & accounting allocation modal
│   ├── PosThermalReceiptModal.jsx # 80mm thermal receipt generator
│   ├── ReportHeader.jsx           # Unified financial report header with filters & actions
│   └── Sidebar.jsx                # Responsive navigation with permission filtering
├── context/
│   └── AuthContext.jsx            # Authentication state, active user, and Spatie permission checks
└── pages/
    ├── BankManagement.jsx         # Multi-bank account operations & transfer workflows
    ├── CashManagement.jsx         # Cash in hand & counter drawer management
    ├── CustomerManagement.jsx     # Customer ledger, dues, and settlements
    ├── Dashboard.jsx              # Executive KPI metrics and financial summaries
    ├── InvoicesList.jsx           # Sales invoices repository and print triggers
    ├── OrdersList.jsx             # Sales orders management and completion
    ├── PosTerminal.jsx            # Interactive retail POS terminal
    ├── ProductCatalog.jsx         # Product and variant catalog management
    ├── PurchaseManagement.jsx     # Two-stage procurement and purchase orders
    ├── RolePermissionManagement.jsx # RBAC matrix and role assignments
    └── reports/
        ├── BalanceSheetReport.jsx
        ├── BankBookReport.jsx
        ├── CashBookReport.jsx
        ├── DayBookReport.jsx
        ├── GeneralLedgerReport.jsx
        ├── IncomeStatementReport.jsx
        ├── SalesByCustomerReport.jsx
        ├── SalesByItemReport.jsx
        ├── TaxReport.jsx
        └── TrialBalanceReport.jsx
```

---

## Installation & Setup Guide

### Prerequisites
- **PHP**: 8.2 or higher
- **Composer**: 2.x
- **Node.js**: 18.x or higher & NPM
- **Database**: MySQL 8.0+ / MariaDB 10.4+ / PostgreSQL / SQLite

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/MahirMostafa/Mini-POS-Sales-Order-Invoicing-System.git
cd "Mini-POS-Sales-Order-Invoicing-System"

# 2. Install PHP backend dependencies
composer install

# 3. Install Node frontend dependencies
npm install

# 4. Configure environment variables
cp .env.example .env
php artisan key:generate

# 5. Configure your database connection in .env (DB_DATABASE, DB_USERNAME, DB_PASSWORD)

# 6. Execute database migrations and seed default data
php artisan migrate:fresh --seed

# 7. Compile frontend assets
npm run build

# 8. Start the development server
php artisan serve
```

The application will be accessible at: `http://localhost:8000`

---

## Default Demo Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@test.com` | `password` | Full system access, RBAC, Banking, Accounting, Auditing |
| **Store Manager** | `manager@test.com` | `password` | POS, Sales Orders, Purchases, Inventory, Operational Reports |
| **Lead Accountant** | `accountant@test.com` | `password` | Full Financial Suite, Bank Books, Journal Vouchers, Balance Sheet |
| **POS Cashier** | `cashier@test.com` | `password` | POS Terminal, Quick Customer Creation, Order Completion |

---

## Automated Testing Suite

The application includes automated feature tests covering the complete transactional lifecycle:

```bash
# Run all automated tests
php artisan test

# Run POS, Order, and Double-Entry Accounting integration tests
php artisan test --filter=PosOrderAccountingWorkflowTest

# Run Product Stock and Accounting Rule verification tests
php artisan test --filter=ProductStockAccountingRuleTest
```

---

## Technical Stack Summary

- **Backend Framework**: Laravel 11.x
- **Frontend Architecture**: React 19, React Router v6, Tailwind CSS, Lucide Icons, SweetAlert2
- **Build Tool**: Vite 7.x
- **Security & Authorization**: Laravel Sanctum, Spatie Laravel Permission
- **Architecture**: Repository Pattern, Service Layer, Form Requests, Strict Double-Entry Ledger

---

## License

This project is licensed under the [MIT License](LICENSE).
