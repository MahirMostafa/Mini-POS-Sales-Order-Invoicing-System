<?php

namespace App\Contracts\Repositories;

use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface AccountingRepositoryInterface
{
    public function getAllAccounts(): Collection;
    public function getActiveAccounts(): Collection;
    public function findAccountByCode(string $code): ?ChartOfAccount;
    public function findAccountById(int $id): ?ChartOfAccount;
    public function createAccount(array $data): ChartOfAccount;
    
    public function createJournalEntry(array $entryData, array $itemsData): JournalEntry;
    public function paginateJournalEntries(int $perPage = 15, array $filters = []): LengthAwarePaginator;
    public function findJournalEntryById(int $id): ?JournalEntry;
    public function getAccountLedger(int $accountId, ?string $startDate = null, ?string $endDate = null): Collection;
    public function getTrialBalance(): array;
    public function getAccountingMetrics(): array;
}
