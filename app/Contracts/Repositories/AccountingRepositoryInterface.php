<?php

namespace App\Contracts\Repositories;

use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface AccountingRepositoryInterface
{
    // Chart of Accounts (COA) Management
    public function getAllAccounts(): Collection;
    public function getActiveAccounts(): Collection;
    public function findAccountByCode(string $code): ?ChartOfAccount;
    public function findAccountById(int $id): ?ChartOfAccount;
    public function createAccount(array $data): ChartOfAccount;
    public function updateAccount(ChartOfAccount $account, array $data): ChartOfAccount;
    public function deleteAccount(ChartOfAccount $account): bool;

    // Journal Entries & Ledgers
    public function createJournalEntry(array $entryData, array $itemsData): JournalEntry;
    public function paginateJournalEntries(int $perPage = 15, array $filters = []): LengthAwarePaginator;
    public function findJournalEntryById(int $id): ?JournalEntry;
    public function getAccountLedger(int $accountId, ?string $startDate = null, ?string $endDate = null): Collection;

    // Financial Books & Statements
    public function getTrialBalance(?string $asOfDate = null): array;
    public function getCashBook(array $filters = []): array;
    public function getBankBook(array $filters = []): array;
    public function getDayBook(string $date, array $filters = []): array;
    public function getBalanceSheet(?string $asOfDate = null): array;
    public function getProfitAndLoss(?string $startDate = null, ?string $endDate = null): array;

    // Dashboard & Metrics
    public function getAccountingMetrics(): array;
    public function getDashboardStockMetrics(): array;
}
