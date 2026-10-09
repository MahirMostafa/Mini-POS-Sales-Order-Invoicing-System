<?php

namespace App\Contracts\Repositories;

use App\Models\BankAccount;
use Illuminate\Database\Eloquent\Collection;

interface BankAccountRepositoryInterface
{
    public function getAll(bool $onlyActive = false): Collection;
    public function findById(int $id): ?BankAccount;
    public function create(array $data): BankAccount;
    public function update(BankAccount $bank, array $data): BankAccount;
    public function delete(BankAccount $bank): bool;
    public function toggleStatus(BankAccount $bank): BankAccount;
    public function getBankSummary(): array;
}
