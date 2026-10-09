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

    protected $appends = [
        'code',
        'name',
        'type',
        'is_system',
        'current_balance',
    ];

    public function getCodeAttribute(): ?string
    {
        return $this->attributes['account_code'] ?? null;
    }

    public function setCodeAttribute(?string $value): void
    {
        $this->attributes['account_code'] = $value;
    }

    public function getNameAttribute(): ?string
    {
        return $this->attributes['account_name'] ?? null;
    }

    public function setNameAttribute(?string $value): void
    {
        $this->attributes['account_name'] = $value;
    }

    public function getTypeAttribute(): ?string
    {
        return ucfirst(strtolower($this->attributes['account_type'] ?? 'Asset'));
    }

    public function setTypeAttribute(?string $value): void
    {
        $this->attributes['account_type'] = ucfirst(strtolower($value ?? 'Asset'));
    }

    public function getIsSystemAttribute(): bool
    {
        $systemCodes = ['1010', '1020', '1050', '1060', '2010', '2020', '3010', '3020', '4010', '4020', '5010', '5020', '5030'];
        return in_array($this->account_code, $systemCodes);
    }

    public function getCurrentBalanceAttribute(): float
    {
        return $this->getBalanceAttribute();
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

        if (strtolower($this->normal_balance) === 'debit') {
            return $debitSum - $creditSum;
        }

        return $creditSum - $debitSum;
    }
}
