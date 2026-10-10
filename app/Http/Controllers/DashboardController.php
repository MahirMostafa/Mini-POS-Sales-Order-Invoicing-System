<?php

namespace App\Http\Controllers;

use App\Contracts\Services\DashboardServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardServiceInterface $dashboardService
    ) {
    }

    /**
     * Get consolidated dashboard intelligence stats.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = auth()->user();

        // Check if user has at least one dashboard permission or is admin
        $hasAnyDashboardPerm = $user && (
            $user->hasRole('Admin') ||
            $user->hasAnyPermission([
                'view-dashboard',
                'view-dashboard-gross-revenue',
                'view-dashboard-total-orders',
                'view-dashboard-aov',
                'view-dashboard-vat-collected',
                'view-dashboard-cash-in-hand',
                'view-dashboard-bank-balance',
                'view-dashboard-liabilities',
                'view-dashboard-expenses',
                'view-dashboard-net-profit',
                'view-dashboard-revenue-chart',
                'view-dashboard-tender-chart',
                'view-dashboard-customers',
                'view-dashboard-products',
                'view-dashboard-cashier-leaderboard',
                'view-dashboard-recent-orders',
                'view-dashboard-my-sales',
                'view-dashboard-my-orders',
                'view-dashboard-my-vat',
                'view-dashboard-my-tender',
                'view-dashboard-my-aov',
            ])
        );

        if (!$hasAnyDashboardPerm) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to access the Executive Dashboard.',
            ], 403);
        }

        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $result = $this->dashboardService->getDashboardIntelligence($startDate, $endDate, $user?->id);

        // Also include backward-compatible keys for any older caller
        $result['metrics'] = $result['data']['sales'] ?? [];
        $result['stock_metrics'] = $result['data']['products'] ?? [];
        $result['recent_journal_entries'] = $result['data']['recent_journals'] ?? [];

        return response()->json($result);
    }
}
