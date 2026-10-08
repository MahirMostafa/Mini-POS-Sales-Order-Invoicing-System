<?php

namespace App\Contracts\Repositories;

use App\Models\Invoice;
use Illuminate\Pagination\LengthAwarePaginator;

interface InvoiceRepositoryInterface
{
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator;
    public function findById(int $id): ?Invoice;
    public function findByInvoiceNumber(string $invoiceNumber): ?Invoice;
    public function findByOrderId(int $orderId): ?Invoice;
    public function create(array $invoiceData, array $itemsData): Invoice;
    public function updateStatus(Invoice $invoice, string $status, ?float $paidAmount = null): bool;
}
