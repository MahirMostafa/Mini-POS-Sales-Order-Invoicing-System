<?php

namespace App\Contracts\Services;

interface DashboardServiceInterface
{
    /**
     * Retrieve complete dashboard intelligence dataset.
     */
    public function getDashboardIntelligence(?string $startDate = null, ?string $endDate = null, ?int $userId = null): array;
}
