<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaxRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'rate',
        'account_id',
        'is_default',
        'is_active',
    ];

    protected $appends = [
        'rate_percent',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function getRatePercentAttribute(): float
    {
        return (float) ($this->rate ?? 0);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
