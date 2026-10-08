<?php

namespace App\Repositories;

use App\Contracts\Repositories\InvoiceRepositoryInterface;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Pagination\LengthAwarePaginator;

class EloquentInvoiceRepository implements InvoiceRepositoryInterface
{
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Invoice::with(['order', 'customer', 'user', 'items']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            if ($filters['payment_status'] === 'paid') {
                $query->whereColumn('paid_amount', '>=', 'grand_total');
            } elseif ($filters['payment_status'] === 'unpaid') {
                $query->where('paid_amount', '<=', 0);
            } elseif ($filters['payment_status'] === 'partially_paid') {
                $query->where('paid_amount', '>', 0)
                      ->whereColumn('paid_amount', '<', 'grand_total');
            }
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('invoice_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('invoice_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('order', function ($oq) use ($search) {
                      $oq->where('order_number', 'like', "%{$search}%");
                  })
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('customer_code', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest('id')->paginate($perPage);
    }

    public function findById(int $id): ?Invoice
    {
        return Invoice::with(['order.items.variant.product', 'order.taxRate', 'customer', 'user', 'items'])->find($id);
    }

    public function findByInvoiceNumber(string $invoiceNumber): ?Invoice
    {
        return Invoice::with(['order.items.variant.product', 'order.taxRate', 'customer', 'user', 'items'])->where('invoice_number', $invoiceNumber)->first();
    }

    public function findByOrderId(int $orderId): ?Invoice
    {
        return Invoice::with(['order.items.variant.product', 'order.taxRate', 'customer', 'user', 'items'])->where('order_id', $orderId)->first();
    }

    public function create(array $invoiceData, array $itemsData): Invoice
    {
        if (empty($invoiceData['invoice_number'])) {
            $datePrefix = date('Ymd');
            $countToday = Invoice::whereDate('created_at', today())->count() + 1;
            $invoiceData['invoice_number'] = 'INV-' . $datePrefix . '-' . str_pad($countToday, 4, '0', STR_PAD_LEFT);
        }

        $invoice = Invoice::create($invoiceData);

        foreach ($itemsData as $item) {
            $item['invoice_id'] = $invoice->id;
            InvoiceItem::create($item);
        }

        return $invoice->load(['order', 'customer', 'user', 'items']);
    }

    public function updateStatus(Invoice $invoice, string $status, ?float $paidAmount = null): bool
    {
        $update = ['status' => $status];
        if ($paidAmount !== null) {
            $update['paid_amount'] = $paidAmount;
        }

        return $invoice->update($update);
    }
}
