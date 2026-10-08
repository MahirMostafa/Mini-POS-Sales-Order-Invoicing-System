<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChartOfAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_code',
        'account_name',
        'account_type',
        'normal_balance',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function journalItems(): HasMany
    {
        return $this->hasMany(JournalItem::class, 'account_id');
    }

    public function taxRates(): HasMany
    {
        return $this->hasMany(TaxRate::class, 'account_id');
    }

    /**
     * Compute current balance based on debit/credit sum and normal balance
     */
    public function getBalanceAttribute(): float
    {
        $debitSum = (float) $this->journalItems()->sum('debit');
        $creditSum = (float) $this->journalItems()->sum('credit');

        if ($this->normal_balance === 'Debit') {
            return $debitSum - $creditSum;
        }

        return $creditSum - $debitSum;
    }
}
