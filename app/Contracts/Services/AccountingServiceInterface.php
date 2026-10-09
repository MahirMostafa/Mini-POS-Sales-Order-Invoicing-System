<?php

namespace App\Contracts\Services;

use App\Models\Customer;
use App\Models\JournalEntry;
use App\Models\Order;
use App\Models\Purchase;

interface AccountingServiceInterface
{
    /**
     * Automatically post double-entry entries on order completion:
     * - Debit: Cash in Hand (1010) or Bank Account (1020/specific bank) or Accounts Receivable (1050)
     * - Credit: Sales Revenue (4010) = Net Subtotal
     * - Credit: Tax Payable (2010) = Tax Amount
     * - COGS: Debit COGS (5010), Credit Merchandise Inventory (1060)
     */
    public function recordOrderCompletionJournalEntry(Order $order): JournalEntry;

    /**
     * Record payment receipt for an existing order/invoice
     */
    public function recordPaymentReceipt(Order $order, float $amount, string $paymentMethod, ?int $bankAccountId = null): JournalEntry;

    /**
     * Record balanced journal entry for Purchase Order (Procurement)
     * - Debit: Merchandise Inventory (1060)
     * - Credit: Cash in Hand (1010) or Bank Account (1020/bank) for paid amount
     * - Credit: Accounts Payable (2020) for outstanding credit balance
     */
    public function recordPurchaseJournalEntry(Purchase $purchase): JournalEntry;

    /**
     * Record customer due settlement journal entry
     * - Debit: Cash in Hand (1010) or Bank Account (1020/bank)
     * - Credit: Accounts Receivable (1050)
     */
    public function recordCustomerDueSettlementJournalEntry(Customer $customer, float $amount, string $paymentMethod, ?int $bankAccountId = null, ?string $note = null): JournalEntry;

    /**
     * Post a manual journal voucher (Contra / Expense / Income / Adjustment)
     */
    public function recordManualVoucher(array $data, int $userId): JournalEntry;

    /**
     * Record balanced Opening Stock Journal Entry:
     * - Debit: Merchandise Inventory Asset (1060)
     * - Credit: Owner's Capital / Opening Equity (3010)
     */
    public function recordOpeningStockJournalEntry(\App\Models\ProductVariant $variant, int $quantity, float $unitCost, int $userId, string $note = ''): JournalEntry;

    /**
     * Get Accounting Dashboard KPI Metrics
     */
    public function getDashboardMetrics(): array;

    /**
     * Get Inventory Stock Valuation & Expected Sales Metrics
     */
    public function getDashboardStockMetrics(): array;
}
