<?php

namespace App\Repositories;

use App\Contracts\Repositories\OrderRepositoryInterface;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        $query = Order::with(['customer', 'user', 'items.variant.product', 'invoice']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('customer_code', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $query->whereBetween('order_date', [$filters['start_date'], $filters['end_date']]);
        }

        return $query->latest('id')->paginate($perPage);
    }

    public function findById(int $id): ?Order
    {
        return Order::with(['customer', 'user', 'items.variant.product', 'invoice', 'journalEntry.items.account', 'taxRate'])->find($id);
    }

    public function findByOrderNumber(string $orderNumber): ?Order
    {
        return Order::with(['customer', 'user', 'items.variant.product', 'invoice', 'journalEntry.items.account'])->where('order_number', $orderNumber)->first();
    }

    public function create(array $orderData, array $itemsData): Order
    {
        if (empty($orderData['order_number'])) {
            $datePrefix = date('Ymd');
            $countToday = Order::whereDate('created_at', today())->count() + 1;
            $orderData['order_number'] = 'ORD-' . $datePrefix . '-' . str_pad($countToday, 4, '0', STR_PAD_LEFT);
        }

        $order = Order::create($orderData);

        foreach ($itemsData as $item) {
            $item['order_id'] = $order->id;
            OrderItem::create($item);
        }

        return $order->load(['customer', 'user', 'items.variant.product', 'taxRate']);
    }

    public function updateStatus(Order $order, string $status, ?string $paymentStatus = null): bool
    {
        $updateData = ['status' => $status];
        if ($status === 'completed') {
            $updateData['completed_at'] = now();
        }
        if ($paymentStatus !== null) {
            $updateData['payment_status'] = $paymentStatus;
        }

        return $order->update($updateData);
    }

    public function getRecent(int $limit = 10): Collection
    {
        return Order::with(['customer', 'user', 'invoice'])->latest('id')->limit($limit)->get();
    }

    public function getSalesSummaryByDateRange(string $startDate, string $endDate): array
    {
        $orders = Order::where('status', 'completed')
            ->whereBetween('order_date', [$startDate, $endDate])
            ->get();

        return [
            'total_orders' => $orders->count(),
            'total_sales' => (float) $orders->sum('grand_total'),
            'total_subtotal' => (float) $orders->sum('subtotal'),
            'total_discount' => (float) $orders->sum('discount_amount'),
            'total_tax' => (float) $orders->sum('tax_amount'),
            'total_paid' => (float) $orders->sum('paid_amount'),
        ];
    }
}
