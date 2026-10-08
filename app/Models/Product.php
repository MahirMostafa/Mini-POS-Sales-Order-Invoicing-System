<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'brand',
        'description',
        'has_variants',
        'base_cost_price',
        'base_selling_price',
        'image',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'has_variants' => 'boolean',
            'base_cost_price' => 'decimal:2',
            'base_selling_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the total stock across all variants or simple product
     */
    public function getTotalStockAttribute(): int
    {
        if ($this->has_variants) {
            return $this->variants()->sum('stock_quantity');
        }
        $primaryVariant = $this->variants()->first();
        return $primaryVariant ? $primaryVariant->stock_quantity : 0;
    }
}
