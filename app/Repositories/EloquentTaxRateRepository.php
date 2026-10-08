<?php

namespace App\Repositories;

use App\Contracts\Repositories\TaxRateRepositoryInterface;
use App\Models\TaxRate;
use Illuminate\Database\Eloquent\Collection;

class EloquentTaxRateRepository implements TaxRateRepositoryInterface
{
    public function all(): Collection
    {
        return TaxRate::with('account')->orderBy('name')->get();
    }

    public function getActive(): Collection
    {
        return TaxRate::with('account')->where('is_active', true)->orderBy('rate')->get();
    }

    public function getDefault(): ?TaxRate
    {
        return TaxRate::with('account')->where('is_default', true)->where('is_active', true)->first()
            ?? TaxRate::with('account')->where('is_active', true)->first();
    }

    public function findById(int $id): ?TaxRate
    {
        return TaxRate::with('account')->find($id);
    }

    public function create(array $data): TaxRate
    {
        if (!empty($data['is_default'])) {
            TaxRate::query()->update(['is_default' => false]);
        }

        return TaxRate::create($data);
    }

    public function update(TaxRate $taxRate, array $data): bool
    {
        if (!empty($data['is_default'])) {
            TaxRate::where('id', '!=', $taxRate->id)->update(['is_default' => false]);
        }

        return $taxRate->update($data);
    }

    public function setDefault(TaxRate $taxRate): bool
    {
        TaxRate::query()->update(['is_default' => false]);
        return $taxRate->update(['is_default' => true]);
    }
}
