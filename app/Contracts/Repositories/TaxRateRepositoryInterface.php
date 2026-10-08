<?php

namespace App\Contracts\Repositories;

use App\Models\TaxRate;
use Illuminate\Database\Eloquent\Collection;

interface TaxRateRepositoryInterface
{
    public function all(): Collection;
    public function getActive(): Collection;
    public function getDefault(): ?TaxRate;
    public function findById(int $id): ?TaxRate;
    public function create(array $data): TaxRate;
    public function update(TaxRate $taxRate, array $data): bool;
    public function setDefault(TaxRate $taxRate): bool;
}
