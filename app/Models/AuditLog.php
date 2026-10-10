<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'event',
        'auditable_type',
        'auditable_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $appends = ['description', 'event_category'];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public function getEventCategoryAttribute(): string
    {
        $evt = strtolower($this->event ?? '');
        if (str_contains($evt, 'purchase') || str_contains($evt, 'goods_received')) {
            return 'purchases';
        }
        if (str_contains($evt, 'bank') || str_contains($evt, 'cash') || str_contains($evt, 'voucher')) {
            return 'banking_cash';
        }
        if (str_contains($evt, 'product') || str_contains($evt, 'price') || str_contains($evt, 'category') || str_contains($evt, 'stock')) {
            return 'inventory_pricing';
        }
        if (str_contains($evt, 'customer')) {
            return 'customers';
        }
        if (str_contains($evt, 'order') || str_contains($evt, 'invoice')) {
            return 'sales';
        }
        return 'general';
    }

    public function getDescriptionAttribute(): string
    {
        $new = $this->new_values ?? [];
        $old = $this->old_values ?? [];
        $evt = strtolower($this->event ?? '');

        // If explicit description provided in payload
        if (!empty($new['description'])) {
            return $new['description'];
        }

        switch ($evt) {
            case 'purchase_created':
            case 'purchases.created':
                $po = $new['purchase_number'] ?? "#{$this->auditable_id}";
                $sup = $new['supplier_name'] ?? 'Supplier';
                $amt = isset($new['total_amount']) ? '৳' . number_format((float) $new['total_amount'], 2) : '';
                return "Created Purchase Order {$po} from {$sup} for total {$amt}";

            case 'goods_received':
            case 'purchases.received':
                $po = $new['purchase_number'] ?? "#{$this->auditable_id}";
                $sup = $new['supplier_name'] ?? 'Supplier';
                return "Confirmed Goods Receipt (GRN) for Purchase Order {$po} from {$sup}. Inventory replenished.";

            case 'bank_created':
            case 'bank_accounts.created':
                $name = $new['bank_name'] ?? 'Bank Account';
                $num = $new['account_number'] ?? '';
                $open = isset($new['opening_balance']) ? '৳' . number_format((float) $new['opening_balance'], 2) : '৳0.00';
                return "Registered new Bank Account '{$name}' ({$num}) with opening balance {$open}";

            case 'bank_deposit':
            case 'bank_accounts.deposit':
                $name = $new['bank_name'] ?? 'Bank Account';
                $amt = isset($new['amount']) ? '৳' . number_format((float) $new['amount'], 2) : '';
                $note = $new['note'] ?? '';
                return "Deposited {$amt} into {$name}" . ($note ? " ({$note})" : '');

            case 'bank_withdraw':
            case 'bank_accounts.withdraw':
                $name = $new['bank_name'] ?? 'Bank Account';
                $amt = isset($new['amount']) ? '৳' . number_format((float) $new['amount'], 2) : '';
                $dest = $new['destination_type'] ?? 'payout';
                return "Withdrew {$amt} from {$name} for {$dest}";

            case 'cash_deposit':
            case 'cash.deposit':
                $amt = isset($new['amount']) ? '৳' . number_format((float) $new['amount'], 2) : '';
                $src = $new['source_type'] ?? 'inflow';
                return "Added {$amt} into Cash in Hand from {$src}";

            case 'cash_withdraw':
            case 'cash.withdraw':
                $amt = isset($new['amount']) ? '৳' . number_format((float) $new['amount'], 2) : '';
                $dest = $new['destination_type'] ?? 'outflow';
                $note = $new['note'] ?? '';
                return "Withdrew {$amt} from Cash in Hand for {$dest}" . ($note ? " ({$note})" : '');

            case 'product_created':
            case 'products.created':
                $name = $new['name'] ?? 'Product';
                $vc = $new['variants_count'] ?? 1;
                return "Created new product '{$name}' with {$vc} active variant(s)";

            case 'price_changed':
            case 'products.price_changed':
                $name = $new['name'] ?? $old['name'] ?? 'Product';
                return "Updated price / cost structure for product '{$name}'";

            case 'product_deleted':
            case 'products.deleted':
                $name = $old['name'] ?? $new['name'] ?? 'Product';
                return "Deleted product '{$name}' from catalog";

            case 'category_created':
            case 'categories.created':
                $name = $new['name'] ?? 'Category';
                return "Created product category '{$name}'";

            case 'category_updated':
            case 'categories.updated':
                $name = $new['name'] ?? 'Category';
                return "Updated product category '{$name}'";

            case 'category_deleted':
            case 'categories.deleted':
                $name = $old['name'] ?? 'Category';
                return "Deleted product category '{$name}'";

            case 'customer_due_settled':
            case 'customers.balance_settled':
                $name = $new['customer_name'] ?? 'Customer';
                $amt = isset($new['settle_amount']) ? '৳' . number_format((float) $new['settle_amount'], 2) : '';
                $rem = isset($new['new_due_balance']) ? '৳' . number_format((float) $new['new_due_balance'], 2) : '';
                return "Settled customer due balance for {$name}. Paid: {$amt}, Remaining Due: {$rem}";

            case 'order_created':
            case 'orders.created':
                $num = $new['order_number'] ?? "#{$this->auditable_id}";
                $cust = $new['customer_name'] ?? 'Walk-in Customer';
                return "Created Sales Order {$num} for {$cust}";

            case 'order_completed':
            case 'orders.completed':
                $num = $new['order_number'] ?? "#{$this->auditable_id}";
                $amt = isset($new['total_amount']) ? '৳' . number_format((float) $new['total_amount'], 2) : '';
                return "Completed and invoiced Sales Order {$num} for total {$amt}";

            case 'stock_adjusted':
            case 'products.stock_adjusted':
                $name = $new['variant_name'] ?? $new['product_name'] ?? 'Product';
                $diff = $new['quantity_change'] ?? '';
                return "Adjusted stock for '{$name}'" . ($diff ? " (Change: {$diff})" : '');

            default:
                return "Executed action " . str_replace(['_', '.'], ' ', $evt) . " on {$this->auditable_type} #{$this->auditable_id}";
        }
    }
}
