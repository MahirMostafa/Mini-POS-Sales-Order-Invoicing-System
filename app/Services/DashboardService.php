<?php

namespace App\Services;

use App\Contracts\Repositories\DashboardRepositoryInterface;
use App\Contracts\Services\DashboardServiceInterface;
use App\Models\Setting;

class DashboardService implements DashboardServiceInterface
{
    public function __construct(
        protected DashboardRepositoryInterface $dashboardRepo
    ) {
    }

    public function getDashboardIntelligence(?string $startDate = null, ?string $endDate = null, ?int $userId = null): array
    {
        $metrics = $this->dashboardRepo->getComprehensiveMetrics($startDate, $endDate, $userId);
        $currency = Setting::get('currency_symbol', '৳');
        $companyName = Setting::get('company_name', 'MINI POS & ERP');

        return [
            'success' => true,
            'company_name' => $companyName,
            'currency' => $currency,
            'timestamp' => now()->toIso8601String(),
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'data' => $metrics,
        ];
    }
}
