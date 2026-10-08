<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\AccountingRepositoryInterface;
use App\Contracts\Services\AccountingServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    public function __construct(
        protected AccountingRepositoryInterface $accountingRepo,
        protected AccountingServiceInterface $accountingService
    ) {
    }

    public function dashboard(): JsonResponse
    {
        $metrics = $this->accountingService->getDashboardMetrics();
        $currency = Setting::get('currency_symbol', '৳');

        // Recent 5 Journal Entries
        $recentEntries = $this->accountingRepo->paginateJournalEntries(5)->items();

        return response()->json([
            'success' => true,
            'metrics' => $metrics,
            'currency' => $currency,
            'recent_journal_entries' => $recentEntries,
        ]);
    }

    public function journalEntries(Request $request): JsonResponse
    {
        $filters = [
            'reference_type' => $request->get('reference_type'),
            'search' => $request->get('search'),
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
        ];

        $entries = $this->accountingRepo->paginateJournalEntries($request->integer('per_page', 15), $filters);

        return response()->json([
            'success' => true,
            'entries' => $entries,
        ]);
    }

    public function trialBalance(): JsonResponse
    {
        $trialBalance = $this->accountingRepo->getTrialBalance();
        $currency = Setting::get('currency_symbol', '৳');

        return response()->json([
            'success' => true,
            'trial_balance' => $trialBalance,
            'currency' => $currency,
        ]);
    }

    public function ledger(int $accountId, Request $request): JsonResponse
    {
        $account = $this->accountingRepo->findAccountById($accountId);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
        }

        $items = $this->accountingRepo->getAccountLedger(
            $accountId,
            $request->get('start_date'),
            $request->get('end_date')
        );

        return response()->json([
            'success' => true,
            'account' => $account,
            'ledger_items' => $items,
        ]);
    }
}
