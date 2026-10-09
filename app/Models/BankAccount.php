<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'bank_name',
        'account_name',
        'account_number',
        'branch_name',
        'routing_number',
        'opening_balance',
        'chart_of_account_id',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    protected $appends = [
        'current_balance',
        'display_label',
    ];

    public function chartOfAccount(): BelongsTo
    {
        return $this->belongsTo(ChartOfAccount::class, 'chart_of_account_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function journalItems(): HasMany
    {
        return $this->hasMany(JournalItem::class, 'bank_account_id');
    }

    public function getDisplayLabelAttribute(): string
    {
        $shortAcc = strlen($this->account_number) > 4 ? substr($this->account_number, -4) : $this->account_number;
        return "{$this->bank_name} - {$this->account_name} (Ac: ••••{$shortAcc})";
    }

    public function getCurrentBalanceAttribute(): float
    {
        $hasOpeningJournal = JournalItem::where('bank_account_id', $this->id)
            ->whereHas('entry', fn($q) => $q->where('reference_type', 'BankOpeningBalance'))
            ->exists();

        $opening = $hasOpeningJournal ? 0.0 : (float) $this->opening_balance;
        
        // Sum debit and credit journal items directly tagged with bank_account_id or through its chart_of_account_id
        $debitSum = (float) JournalItem::where(function ($q) {
            $q->where('bank_account_id', $this->id);
            if ($this->chart_of_account_id) {
                $q->orWhere('account_id', $this->chart_of_account_id);
            }
        })->sum('debit');

        $creditSum = (float) JournalItem::where(function ($q) {
            $q->where('bank_account_id', $this->id);
            if ($this->chart_of_account_id) {
                $q->orWhere('account_id', $this->chart_of_account_id);
            }
        })->sum('credit');

        // Bank is an Asset account -> normal balance is Debit (Debit increases balance, Credit decreases balance)
        return round($opening + $debitSum - $creditSum, 2);
    }
}
