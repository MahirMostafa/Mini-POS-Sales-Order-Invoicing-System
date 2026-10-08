<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'variant_name',
        'sku',
        'barcode',
        'cost_price',
        'selling_price',
        'stock_quantity',
        'alert_quantity',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'stock_quantity' => 'integer',
            'alert_quantity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'product_variant_id');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'product_variant_id');
    }

    public function getFullNameAttribute(): string
    {
        if ($this->variant_name && $this->variant_name !== 'Standard' && $this->variant_name !== 'Default') {
            return "{$this->product->name} - {$this->variant_name}";
        }
        return $this->product->name;
    }

    public function isLowStock(): bool
    {
        return $this->stock_quantity <= $this->alert_quantity;
    }
}
