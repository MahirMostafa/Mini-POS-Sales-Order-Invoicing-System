<?php

namespace App\Contracts\Services;

use App\Models\Order;
use App\Models\JournalEntry;

interface AccountingServiceInterface
{
    /**
     * Automatically post double-entry entries on order completion:
     * - Debit: Accounts Receivable (1050) or Cash (1010) = Grand Total
     * - Credit: Sales Revenue (4010) = Net Subtotal (Subtotal - Discount)
     * - Credit: Tax Payable (2010) = Tax Amount
     * - Optional COGS: Debit COGS (5010), Credit Merchandise Inventory (1060)
     */
    public function recordOrderCompletionJournalEntry(Order $order): JournalEntry;

    /**
     * Record payment receipt for an existing order/invoice
     */
    public function recordPaymentReceipt(Order $order, float $amount, string $paymentMethod): JournalEntry;

    /**
     * Get Accounting Dashboard KPI Metrics
     */
    public function getDashboardMetrics(): array;
}
