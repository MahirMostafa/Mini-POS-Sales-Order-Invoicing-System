<?php

namespace App\Services;

use App\Contracts\Repositories\InvoiceRepositoryInterface;
use App\Contracts\Services\InvoiceServiceInterface;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Setting;

class InvoiceService implements InvoiceServiceInterface
{
    public function __construct(
        protected InvoiceRepositoryInterface $invoiceRepo
    ) {
    }

    public function generateFromOrder(Order $order): Invoice
    {
        // Check if invoice already exists
        $existing = $this->invoiceRepo->findByOrderId($order->id);
        if ($existing) {
            return $existing;
        }

        $invoiceData = [
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'user_id' => $order->user_id,
            'invoice_date' => $order->order_date,
            'due_date' => $order->due_date ?? $order->order_date,
            'status' => $order->payment_status === 'paid' ? 'paid' : 'issued',
            'subtotal' => $order->subtotal,
            'discount_amount' => $order->discount_amount,
            'tax_rate' => $order->tax_rate,
            'tax_amount' => $order->tax_amount,
            'grand_total' => $order->grand_total,
            'paid_amount' => $order->paid_amount,
            'notes' => $order->notes,
            'terms_and_conditions' => Setting::get('invoice_terms', 'Thank you for your business. Payment is due within 15 days.'),
        ];

        $itemsData = [];
        foreach ($order->items as $item) {
            $displayName = $item->variant_name ? "{$item->product_name} ({$item->variant_name})" : $item->product_name;
            $itemsData[] = [
                'product_id' => $item->product_id,
                'product_variant_id' => $item->product_variant_id,
                'item_name' => $displayName,
                'item_sku' => $item->product_sku,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'discount' => $item->discount,
                'tax_amount' => $item->tax_amount,
                'line_total' => $item->line_total,
            ];
        }

        return $this->invoiceRepo->create($invoiceData, $itemsData);
    }

    public function getPrintableInvoiceData(Invoice $invoice): array
    {
        $companyName = Setting::get('company_name', 'Mini POS Enterprise');
        $companyAddress = Setting::get('company_address', '123 Commercial Area, Dhaka, Bangladesh');
        $companyPhone = Setting::get('company_phone', '+880 1700-000000');
        $companyEmail = Setting::get('company_email', 'contact@minipos.com');
        $taxNumber = Setting::get('tax_number', 'BIN-123456789');
        $currencySymbol = Setting::get('currency_symbol', '৳');

        return [
            'invoice' => $invoice->load(['customer', 'user', 'items', 'order.journalEntry.items.account']),
            'company' => [
                'name' => $companyName,
                'address' => $companyAddress,
                'phone' => $companyPhone,
                'email' => $companyEmail,
                'tax_number' => $taxNumber,
                'currency' => $currencySymbol,
            ],
        ];
    }
}
