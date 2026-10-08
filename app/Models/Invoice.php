<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'order_id',
        'customer_id',
        'user_id',
        'invoice_date',
        'due_date',
        'status',
        'subtotal',
        'discount_amount',
        'tax_rate',
        'tax_amount',
        'rounding_amount',
        'grand_total',
        'paid_amount',
        'notes',
        'terms_and_conditions',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'rounding_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    protected $appends = [
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_address',
        'customer_tax_number',
        'due_amount',
        'payment_method',
        'payment_status',
        'tax_rate_percent',
        'tax_rate_name',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function getCustomerNameAttribute(): string
    {
        return $this->customer?->name ?? 'Walk-in Customer';
    }

    public function getCustomerPhoneAttribute(): ?string
    {
        return $this->customer?->phone;
    }

    public function getCustomerEmailAttribute(): ?string
    {
        return $this->customer?->email;
    }

    public function getCustomerAddressAttribute(): ?string
    {
        return $this->customer?->address;
    }

    public function getCustomerTaxNumberAttribute(): ?string
    {
        return $this->customer?->tax_number;
    }

    public function getDueAmountAttribute(): float
    {
        return (float) max(0, $this->grand_total - $this->paid_amount);
    }

    public function getPaymentMethodAttribute(): string
    {
        return $this->order?->payment_method ?? 'cash';
    }

    public function getPaymentStatusAttribute(): string
    {
        if ($this->order?->payment_status) {
            return $this->order->payment_status;
        }
        return $this->paid_amount >= $this->grand_total ? 'paid' : ($this->paid_amount > 0 ? 'partially_paid' : 'unpaid');
    }

    public function getTaxRatePercentAttribute(): float
    {
        return (float) ($this->tax_rate ?? 5.00);
    }

    public function getTaxRateNameAttribute(): string
    {
        return 'VAT';
    }
}
