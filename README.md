# Mini POS, Sales Order & Invoicing System with Double-Entry Accounting

[![Laravel 11](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> A standalone **Mini POS / Sales Order & Invoicing System** built with **Laravel 11**, **React 19 + Vite**, **Tailwind CSS**, and **Double-Entry Accounting**.

---

## 🌟 Key Features

1. **Interactive Mini POS Terminal**:
   - Customer selection with quick customer registration modal.
   - Dynamic product catalog with category pills, live text search, and instant barcode scanner.
   - **Multi-Variant Product Support** (e.g. *Perfume ABC -> 80ml @ 100 Tk, 120ml @ 150 Tk*) with live stock badges.
   - Dynamic sales order line items table with real-time recalculation of Subtotal, Line Discounts, Overall Discounts, Dynamic Tax (5% standard VAT default), and Grand Total.

2. **Order Lifecycle & Atomic Stock Verification**:
   - **`Pending` $\rightarrow$ `Completed`** state machine.
   - Orders saved in `Pending` state do **NOT** deduct stock.
   - Upon completion, the system executes an atomic database transaction that:
     - Verifies stock availability (aborts with SweetAlert if stock is insufficient).
     - Atomically deducts inventory at the variant SKU level.
     - Logs an immutable `StockMovement` audit record.
     - Auto-generates an official printable `Invoice`.
     - Automatically posts a strictly balanced **Double-Entry General Journal Entry**.

3. **Double-Entry Accounting Module**:
   - Pre-seeded Chart of Accounts:
     - `1010` Cash in Hand (Asset)
     - `1020` Bank Account (Asset)
     - `1050` Accounts Receivable (Asset)
     - `1060` Merchandise Inventory (Asset)
     - `2010` Tax Payable / Output VAT 5% (Liability)
     - `4010` Sales Revenue (Revenue)
     - `5010` Cost of Goods Sold (COGS) (Expense)
   - Balanced Journal Entries upon order completion:
     - **Debit**: Accounts Receivable (`1050`) = $Grand Total
     - **Credit**: Sales Revenue (`4010`) = $Net Sales (Subtotal - Discount)
     - **Credit**: Tax Payable (`2010`) = $5% Tax Amount
     - **Debit / Credit**: COGS (`5010`) / Inventory (`1060`) for perpetual inventory.
   - Financial **Trial Balance** statement with dynamic zero-sum verification (`SUM(Debits) == SUM(Credits)`).
   - **General Ledger** statement drill-down per account.

4. **Printable Invoices**:
   - Clean, printable invoice layout with company header, BIN/tax numbers, customer details, line items breakdown, discount/tax calculations, terms & conditions, and double-entry cross-reference.
   - Browser print trigger (`window.print()`).

5. **Asynchronous Queued Audit Logging**:
   - High-performance `audit_logs` tracking via background queue workers (`LogActivityJob` implementing `ShouldQueue`).
   - Zero POS latency with complete JSON snapshot diffs (who modified what, old vs new values, IP, user-agent).

6. **Dynamic Tax Rate CRUD**:
   - Full admin management of tax percentage rates (5.00% VAT, 0.00% Zero-Tax, 10.00% Luxury Tax) and default POS rate assignment.

---

## 🏛️ Architectural Design & SOLID Patterns

```
app/
├── Contracts/
│   ├── Repositories/
│   │   ├── CustomerRepositoryInterface.php
│   │   ├── ProductRepositoryInterface.php
│   │   ├── ProductVariantRepositoryInterface.php
│   │   ├── OrderRepositoryInterface.php
│   │   ├── InvoiceRepositoryInterface.php
│   │   ├── AccountingRepositoryInterface.php
│   │   ├── TaxRateRepositoryInterface.php
│   │   ├── StockMovementRepositoryInterface.php
│   │   └── AuditLogRepositoryInterface.php
│   └── Services/
│       ├── OrderServiceInterface.php
│       ├── AccountingServiceInterface.php
│       ├── InventoryServiceInterface.php
│       ├── InvoiceServiceInterface.php
│       └── AuditServiceInterface.php
├── Repositories/
│   ├── EloquentCustomerRepository.php
│   ├── EloquentProductRepository.php
│   ├── EloquentProductVariantRepository.php
│   ├── EloquentOrderRepository.php
│   ├── EloquentInvoiceRepository.php
│   ├── EloquentAccountingRepository.php
│   ├── EloquentTaxRateRepository.php
│   ├── EloquentStockMovementRepository.php
│   └── EloquentAuditLogRepository.php
├── Services/
│   ├── OrderService.php           # DB transaction, stock availability validator, order transitions
│   ├── AccountingService.php      # Double-entry posting, balancing checks, trial balance
│   ├── InventoryService.php       # Variant stock deduction, low stock alerts, WAC costing
│   ├── InvoiceService.php         # Invoice generator, printable payload formatter
│   └── AuditService.php           # Dispatches async LogActivityJob to queue worker
├── Jobs/
│   └── LogActivityJob.php         # Asynchronous queue worker job
├── Providers/
│   └── RepositoryServiceProvider.php
```

---

## 🚀 Quick Setup & Installation

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/MahirMostafa/Mini-POS-Sales-Order-Invoicing-System.git
cd "Mini-POS-Sales-Order-Invoicing-System"

# 2. Start Docker containers (App, Nginx, MySQL 8, phpMyAdmin, Queue Worker)
docker compose up -d --build

# 3. Setup application key and database
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate:fresh --seed
docker compose exec app npm run build
```

The application will be live at:
- **Web App / POS**: [http://localhost:8000](http://localhost:8000)
- **phpMyAdmin**: [http://localhost:8080](http://localhost:8080)

---

### Option 2: Local PHP & MySQL Setup

```bash
# 1. Install Composer dependencies
composer install

# 2. Install NPM dependencies & build frontend
npm install --legacy-peer-deps
npm run build

# 3. Configure environment
cp .env.example .env
php artisan key:generate

# 4. Run database migrations & seeders
php artisan migrate:fresh --seed

# 5. Start background queue worker
php artisan queue:work

# 6. Start local dev server
php artisan serve
```

---

## 🔑 Demo User Accounts (1-Click Switcher Available in UI)

| Role | Email | Password | Permissions / Access |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@minipos.com` | `password123` | Full system access, Tax CRUD, Products, Accounting, Audits |
| **Main POS Cashier** | `cashier@minipos.com` | `password123` | POS Terminal, Orders, Invoices, Quick Customer Add |
| **Lead Accountant** | `accountant@minipos.com` | `password123` | Accounting Dashboard, Trial Balance, Ledger, Journal Entries |

---

## 🧪 Automated Testing

Run the feature test suite covering pending order creation, stock prevention, atomic stock deduction, invoice generation, and double-entry accounting:

```bash
php artisan test --filter=PosOrderAccountingWorkflowTest
```

---

## 📜 License
This project is open-source software licensed under the **[MIT License](LICENSE)**.
