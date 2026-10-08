<?php

namespace App\Contracts\Services;

use App\Models\Invoice;
use App\Models\Order;

interface InvoiceServiceInterface
{
    /**
     * Generate an invoice from a completed sales order
     */
    public function generateFromOrder(Order $order): Invoice;

    /**
     * Prepare invoice printable payload
     */
    public function getPrintableInvoiceData(Invoice $invoice): array;
}
