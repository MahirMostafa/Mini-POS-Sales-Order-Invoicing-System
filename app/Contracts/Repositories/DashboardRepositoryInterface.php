<?php

namespace App\Contracts\Repositories;

interface DashboardRepositoryInterface
{
    /**
     * Get all aggregated dashboard data in a single optimized payload.
     */
    public function getComprehensiveMetrics(?string $startDate = null, ?string $endDate = null, ?int $userId = null): array;

    /**
     * Get user-specific sales & shift metrics (My Sales, My Orders, My VAT, My Tenders).
     */
    public function getUserSpecificMetrics(int $userId, ?string $startDate = null, ?string $endDate = null): array;

    /**
     * Get sales & revenue metrics (Gross sales, net sales, VAT, AOV, order counts).
     */
    public function getSalesMetrics(?string $startDate = null, ?string $endDate = null): array;

    /**
     * Get financial and treasury metrics (Cash in hand, bank balances, liabilities, expenses, net profit).
     */
    public function getFinancialMetrics(?string $startDate = null, ?string $endDate = null): array;

    /**
     * Get customer metrics (Total customers, total receivables/dues, active count, top customers).
     */
    public function getCustomerMetrics(): array;

    /**
     * Get product & stock inventory metrics (Total products, variants, stock cost value, expected sales value, potential margin, low stock).
     */
    public function getProductStockMetrics(): array;

    /**
     * Get procurement & purchase metrics (Total purchases, completed purchases, supplier payables).
     */
    public function getPurchaseMetrics(): array;

    /**
     * Get sales breakdown performance by cashier/user.
     */
    public function getSalesByUserMetrics(?string $startDate = null, ?string $endDate = null): array;

    /**
     * Get daily sales trends for chart rendering.
     */
    public function getSalesChartData(int $days = 7): array;

    /**
     * Get top selling products by quantity and revenue.
     */
    public function getTopSellingProducts(int $limit = 5): array;

    /**
     * Get payment method distribution (Cash, Bank, Mobile, Credit).
     */
    public function getPaymentMethodDistribution(?string $startDate = null, ?string $endDate = null): array;

    /**
     * Get recent completed/pending sales orders.
     */
    public function getRecentOrders(int $limit = 8): array;

    /**
     * Get recent double-entry accounting journal entries.
     */
    public function getRecentJournals(int $limit = 6): array;
}
