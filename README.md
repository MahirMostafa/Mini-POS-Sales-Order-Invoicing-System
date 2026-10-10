# Mini POS, Sales Order & Invoicing System with Real-Time Double-Entry Accounting

[![Laravel 11](https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.x-black?style=for-the-badge&logo=framer&logoColor=blue)](https://www.framer.com/motion/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A robust, enterprise-grade **Point of Sale (POS), Sales Order Processing, and Invoicing System** built with **Laravel 11**, **React 19**, **Vite**, **Tailwind CSS**, **Framer Motion**, and an integrated **Double-Entry General Ledger Accounting Engine**.

---

## 🌟 Key Highlights & Architecture

- **Full-Stack Separation**: Decoupled React 19 Single Page Application (SPA) powered by a clean, testable Laravel 11 REST API with the **Repository & Service Layer Pattern**.
- **Real-Time Double-Entry Accounting**: Automatic balanced journal entries (`SUM(Debits) == SUM(Credits)`) posted on every transaction (Sales Invoices, COGS, Cash Flow, Bank Settlements, Purchases, Customer Credit, and VAT Liabilities).
- **Scalable 5,000 Product Inventory**: High-performance chunked pagination (100 products per page), interactive "Load More" with **Framer Motion** transitions, and instant full-database search across all 5,000 products by SKU, barcode, brand, and name.
- **Granular Role-Based Access Control (Spatie RBAC)**: Strict role matrices for `Admin`, `Accountant`, `Cashier`, and a specialized `Store Keeper` role restricted exclusively to Goods Received Note (GRN) verification.
- **Enterprise Forensic Audit Trail**: Dedicated asynchronous audit logging capturing state diffs (before vs after) for purchases, goods receipts, bank transactions, cash withdrawals, price revisions, product lifecycle changes, and customer due settlements.
- **Secure Authentication & Instant Demo Logins**: Protected by visual mathematical CAPTCHAs, rate-limiting brute force protection (60s cooldown timer), and 1-click Instant Demo Logins.

---

## 🛠️ Feature Modules

### 1. Interactive POS Terminal & Checkout
- **Scalable Catalog**: Paginated 100-item grid with fluid Framer Motion animations and live percentage progress bar.
- **Global Inventory Search**: Search by product title, brand, variant name, SKU (`PRD-00001` to `PRD-05000`), or Barcode (`890100000001` to `890100005000`) across all 5,000 items in real time.
- **Live Barcode Scanner**: Hardware-compatible barcode reader input that queries the full inventory and adds matching items directly to the sales cart.
- **Multi-Variant Architecture**: Multi-attribute variant support (e.g. *Perfume - ABC* in 80ml, 120ml, 200ml) with independent cost and selling prices.
- **Multi-Tender Payments**:
  - **Cash in Hand**: Instant change calculation and quick-add denomination presets.
  - **Card / POS Terminal**: Direct debit to bank accounting heads.
  - **Digital Wallet / MFS**: bKash Merchant QR integration with payment reference tracking.
  - **Credit / Due Sales**: Permitted exclusively for registered customers with automatic Accounts Receivable ledger updates.
- **Thermal Receipts & Invoices**: Native 80mm thermal receipt generator modal and downloadable printable tax invoices.

### 2. Real-Time Double-Entry Accounting & Banking
- **Standard Chart of Accounts (COA)**:
  - `1010` Cash in Hand (Asset)
  - `1020` Bank Accounts (Asset)
  - `1050` Accounts Receivable (Asset)
  - `1060` Merchandise Inventory (Asset)
  - `2010` Tax / VAT Output Liability (Liability)
  - `2020` Accounts Payable (Liability)
  - `3010` Owner's Capital / Equity (Equity)
  - `4010` Sales Revenue (Revenue)
  - `5010` Cost of Goods Sold / COGS (Expense)
- **Multi-Bank Management**:
  - Registered anonymous enterprise accounts (e.g. *Corporate Operating Account*, *Reserve & Vendor Settlement Account*, *POS Digital Merchant QR*).
  - Real-time Bank Book with chronological running balance calculations.
  - Inter-bank fund transfers and cash-to-bank deposits/withdrawals with automated contra vouchers.
- **Cash Management**:
  - Real-time Cash Book tracking daily counter collections, petty cash disbursements, and bank deposits.

### 3. Financial Statements & Operational Reporting Suite
10 decoupled, printable, and exportable financial statements with custom date filters and presets:
1. **Balance Sheet**: Full financial position statement ($Assets = Liabilities + Equity$).
2. **Income Statement (Profit & Loss)**: Revenues, COGS, gross profit, operational expenses, and net profit.
3. **Trial Balance**: Zero-sum mathematical verification of all debit and credit balances.
4. **General Ledger**: Account-by-account transaction drill-down with running balances.
5. **Cash Book**: Chronological ledger of cash receipts, collections, and disbursements.
6. **Bank Book**: Multi-bank account transaction history with live running balances.
7. **Day Book**: Daily operational digest of all journal vouchers.
8. **Tax / VAT Report**: Output VAT collected vs Input VAT paid for statutory compliance.
9. **Sales by Customer Report**: Aggregated volume, invoice count, and revenue per customer.
10. **Sales by Item Report**: Product and variant unit sales, discounts, and total revenue.

### 4. Procurement & Two-Stage Purchase Orders
- **Procurement Workflow**: Purchase Orders (`Pending` -> `Received`).
- **Store Keeper Verification**: Store Keepers verify physical shipments, replenish variant stock, and confirm Goods Received Notes (GRN) with automatic inventory asset journals.

### 5. Enterprise Forensic Audit Trail
- **Comprehensive Event Logging**:
  - `purchase_created`: Purchase order placed with supplier details and line items.
  - `goods_received`: GRN confirmation with receiving store keeper timestamp.
  - `bank_created`, `bank_deposit`, `bank_withdraw`: Bank registration, inflows, and outflows.
  - `cash_deposit`, `cash_withdraw`: Cash register additions and withdrawals with reason.
  - `product_created`, `price_changed`, `product_deleted`: Product lifecycle & **exact before/after price diffs**.
  - `category_created`, `category_updated`, `category_deleted`: Category taxonomy tracking.
  - `customer_due_settled`: Customer payment collection with remaining due calculation.
  - `order_created`, `order_completed`, `order_cancelled`: Sales orders and invoicing.
- **Audit Diff Inspector**: Interactive modal displaying actor, client IP address, human narrative, and state diff JSON snapshots.

---

## 👥 Seeded Users & Demo Credentials

Default Password for all seeded accounts: `password123`

### Instant 1-Click Demo Accounts (Featured on Login Screen)

| Role | Name | Email | Password | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin (Demo)** | Super Admin | `admin@pos.com` | `password123` | Full enterprise control, RBAC, Financials, Banking, Auditing |
| **Accountant (Demo)** | Senior Accountant | `accountant1@pos.com` | `password123` | General Ledger, Chart of Accounts, Bank & Cash Books, Financial Reports |
| **Cashier (Demo)** | Counter 1 Cashier | `counter1@pos.com` | `password123` | POS Terminal, Quick Customer Creation, Cash/Card Sales |

### Additional Production Accounts

| Role | Name | Email |
| :--- | :--- | :--- |
| **Admin** | Operations Admin | `admin.ops@pos.com` |
| **Admin** | Store Admin | `admin.store@pos.com` |
| **Accountant** | Junior Accountant | `accountant2@pos.com` |
| **Cashier** | Counter 2 Cashier | `counter2@pos.com` |
| **Cashier** | Counter 3 Cashier | `counter3@pos.com` |
| **Cashier** | Counter 4 Cashier | `counter4@pos.com` |
| **Cashier** | Counter 5 Cashier | `counter5@pos.com` |
| **Store Keeper** | Warehouse Store Keeper | `storekeeper@pos.com` |

---

## 🚀 Installation & Quick Start Guide

### Prerequisites
- **PHP**: 8.2 or higher (with `pdo`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`)
- **Composer**: 2.x
- **Node.js**: 18.x or higher & NPM
- **Database**: MySQL 8.0+ / MariaDB 10.4+ / PostgreSQL

### Setup Instructions

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

# 5. Configure your database in .env (DB_DATABASE, DB_USERNAME, DB_PASSWORD)

# 6. Run database migrations & seeders (Includes 5,000 products, COA, bank accounts, and 10 users)
php artisan migrate:fresh --seed

# 7. Compile frontend assets
npm run build

# 8. Start development servers
php artisan serve
```

The application will be accessible at: `http://localhost:8000`

---

## 🏗️ Technical Architecture

```
app/
├── Contracts/
│   ├── Repositories/
│   │   ├── AccountingRepositoryInterface.php
│   │   ├── AuditLogRepositoryInterface.php
│   │   ├── BankAccountRepositoryInterface.php
│   │   ├── CategoryRepositoryInterface.php
│   │   ├── CustomerRepositoryInterface.php
│   │   ├── DashboardRepositoryInterface.php
│   │   ├── InvoiceRepositoryInterface.php
│   │   ├── OrderRepositoryInterface.php
│   │   ├── ProductRepositoryInterface.php
│   │   ├── ProductVariantRepositoryInterface.php
│   │   ├── PurchaseRepositoryInterface.php
│   │   ├── SettingRepositoryInterface.php
│   │   ├── StockMovementRepositoryInterface.php
│   │   ├── TaxRateRepositoryInterface.php
│   │   └── UserRepositoryInterface.php
│   └── Services/
│       ├── AccountingServiceInterface.php
│       ├── AuditServiceInterface.php
│       ├── DashboardServiceInterface.php
│       ├── InventoryServiceInterface.php
│       ├── InvoiceServiceInterface.php
│       └── OrderServiceInterface.php
├── Http/Controllers/
│   ├── AccountingController.php
│   ├── AuditLogController.php
│   ├── AuthController.php
│   ├── BankAccountController.php
│   ├── CategoryController.php
│   ├── CustomerController.php
│   ├── DashboardController.php
│   ├── InvoiceController.php
│   ├── OrderController.php
│   ├── PosController.php
│   ├── ProductController.php
│   ├── PurchaseController.php
│   ├── RolePermissionController.php
│   ├── TaxRateController.php
│   └── UserController.php
├── Models/
│   ├── AuditLog.php
│   ├── BankAccount.php
│   ├── ChartOfAccount.php
│   ├── Customer.php
│   ├── Invoice.php
│   ├── InvoiceItem.php
│   ├── JournalEntry.php
│   ├── JournalItem.php
│   ├── Order.php
│   ├── OrderItem.php
│   ├── Product.php
│   ├── ProductCategory.php
│   ├── ProductVariant.php
│   ├── Purchase.php
│   ├── PurchaseItem.php
│   ├── Setting.php
│   ├── StockMovement.php
│   ├── TaxRate.php
│   └── User.php
└── Services/
    ├── AccountingService.php
    ├── AuditService.php
    ├── DashboardService.php
    ├── InventoryService.php
    ├── InvoiceService.php
    └── OrderService.php
```

---

## 👨‍💻 Author & Credits

Developed by **Mahir Mostafa**  
LinkedIn: [https://www.linkedin.com/in/mahirmostafa/](https://www.linkedin.com/in/mahirmostafa/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
