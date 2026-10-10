<?php

namespace App\Repositories;

use App\Contracts\Repositories\DashboardRepositoryInterface;
use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use App\Models\Customer;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EloquentDashboardRepository implements DashboardRepositoryInterface
{
    public function getComprehensiveMetrics(?string $startDate = null, ?string $endDate = null, ?int $userId = null): array
    {
        return [
            'sales' => $this->getSalesMetrics($startDate, $endDate),
            'financials' => $this->getFinancialMetrics($startDate, $endDate),
            'customers' => $this->getCustomerMetrics(),
            'products' => $this->getProductStockMetrics(),
            'purchases' => $this->getPurchaseMetrics(),
            'sales_by_user' => $this->getSalesByUserMetrics($startDate, $endDate),
            'my_metrics' => $userId ? $this->getUserSpecificMetrics($userId, $startDate, $endDate) : null,
            'charts' => [
                'sales_trend' => $this->getSalesChartData(7),
                'sales_trend_30' => $this->getSalesChartData(30),
                'top_products' => $this->getTopSellingProducts(6),
                'payment_methods' => $this->getPaymentMethodDistribution($startDate, $endDate),
            ],
            'recent_orders' => $this->getRecentOrders(8),
            'recent_journals' => $this->getRecentJournals(6),
        ];
    }

    public function getSalesMetrics(?string $startDate = null, ?string $endDate = null): array
    {
        $query = Order::query();

        if ($startDate && $endDate) {
            $query->whereBetween('order_date', [$startDate, $endDate]);
        }

        $completedQuery = (clone $query)->where('status', 'completed');

        $totalOrders = (int) (clone $query)->count();
        $completedOrdersCount = (int) (clone $completedQuery)->count();
        $pendingOrdersCount = (int) (clone $query)->where('status', 'pending')->count();
        $cancelledOrdersCount = (int) (clone $query)->where('status', 'cancelled')->count();

        $grossRevenue = (float) (clone $completedQuery)->sum('grand_total');
        $subtotal = (float) (clone $completedQuery)->sum('subtotal');
        $discountTotal = (float) (clone $completedQuery)->sum('discount_amount');
        $vatCollected = (float) (clone $completedQuery)->sum('tax_amount');
        
        // Recognized Operating Revenue from 4010 Sales Revenue net of 5030 Sales Discounts (matching P&L)
        $revAccount = ChartOfAccount::where('account_code', '4010')->first();
        $discAccount = ChartOfAccount::where('account_code', '5030')->first();

        $operatingRevenue = 0.0;
        if ($revAccount) {
            $revItems = JournalItem::where('account_id', $revAccount->id);
            if ($startDate && $endDate) {
                $revItems->whereHas('entry', fn($q) => $q->whereBetween('entry_date', [$startDate, $endDate]));
            }
            $grossCredit = (float) (clone $revItems)->sum('credit') - (float) (clone $revItems)->sum('debit');

            $discDebit = 0.0;
            if ($discAccount) {
                $discItems = JournalItem::where('account_id', $discAccount->id);
                if ($startDate && $endDate) {
                    $discItems->whereHas('entry', fn($q) => $q->whereBetween('entry_date', [$startDate, $endDate]));
                }
                $discDebit = (float) (clone $discItems)->sum('debit') - (float) (clone $discItems)->sum('credit');
            }
            $operatingRevenue = max(0, $grossCredit - $discDebit);
        } else {
            $operatingRevenue = max(0, $subtotal - $discountTotal);
        }

        $totalCollected = (float) (clone $completedQuery)->sum('paid_amount');
        
        // Cumulative/Active customer receivables from 1050 or customer credit balance
        $arAccount = ChartOfAccount::where('account_code', '1050')->first();
        if ($arAccount) {
            $arItems = JournalItem::where('account_id', $arAccount->id);
            $totalDue = max(0, round((float) (clone $arItems)->sum('debit') - (float) (clone $arItems)->sum('credit'), 2));
        } else {
            $totalDue = (float) Customer::sum('credit_balance');
        }

        $aov = $completedOrdersCount > 0 ? round($grossRevenue / $completedOrdersCount, 2) : 0.0;

        // Today's vs Yesterday's Sales
        $todayStr = date('Y-m-d');
        $yesterdayStr = date('Y-m-d', strtotime('-1 day'));

        $todaySales = (float) Order::where('status', 'completed')->whereDate('order_date', $todayStr)->sum('grand_total');
        $yesterdaySales = (float) Order::where('status', 'completed')->whereDate('order_date', $yesterdayStr)->sum('grand_total');
        $todayOrdersCount = (int) Order::where('status', 'completed')->whereDate('order_date', $todayStr)->count();

        $salesGrowthPercent = $yesterdaySales > 0 ? round((($todaySales - $yesterdaySales) / $yesterdaySales) * 100, 1) : 0.0;

        return [
            'total_orders' => $totalOrders,
            'completed_orders' => $completedOrdersCount,
            'pending_orders' => $pendingOrdersCount,
            'cancelled_orders' => $cancelledOrdersCount,
            'gross_operating_revenue' => round($operatingRevenue, 2),
            'operating_revenue' => round($operatingRevenue, 2),
            'gross_sales' => round($grossRevenue, 2),
            'gross_invoiced' => round($grossRevenue, 2),
            'net_sales' => round($operatingRevenue, 2),
            'discounts_given' => round($discountTotal, 2),
            'vat_collected' => round($vatCollected, 2),
            'total_cash_collected' => round($totalCollected, 2),
            'total_sales_due' => round($totalDue, 2),
            'average_order_value' => $aov,
            'today_sales' => round($todaySales, 2),
            'today_orders_count' => $todayOrdersCount,
            'yesterday_sales' => round($yesterdaySales, 2),
            'growth_percent' => $salesGrowthPercent,
        ];
    }

    public function getFinancialMetrics(?string $startDate = null, ?string $endDate = null): array
    {
        $asOf = $endDate ?? date('Y-m-d');
        $pnlStart = $startDate ?? '2000-01-01';
        $pnlEnd = $endDate ?? date('Y-m-d');

        // Helper to get cumulative balance as of a date (for Balance Sheet accounts)
        $getCumulativeBalance = function (string $code) use ($asOf) {
            $account = ChartOfAccount::where('account_code', $code)->first();
            if (!$account) return 0.0;

            $items = JournalItem::where('account_id', $account->id)
                ->whereHas('entry', fn($q) => $q->whereDate('entry_date', '<=', $asOf));
            $debit = (float) (clone $items)->sum('debit');
            $credit = (float) (clone $items)->sum('credit');

            return $account->normal_balance === 'Debit' ? ($debit - $credit) : ($credit - $debit);
        };

        // Helper to get periodic balance within start/end range (for P&L accounts)
        $getPeriodBalance = function (string $code) use ($pnlStart, $pnlEnd) {
            $account = ChartOfAccount::where('account_code', $code)->first();
            if (!$account) return 0.0;

            $items = JournalItem::where('account_id', $account->id)
                ->whereHas('entry', fn($q) => $q->whereBetween('entry_date', [$pnlStart, $pnlEnd]));
            $debit = (float) (clone $items)->sum('debit');
            $credit = (float) (clone $items)->sum('credit');

            return $account->normal_balance === 'Debit' ? ($debit - $credit) : ($credit - $debit);
        };

        // 1. Cash in Hand (1010)
        $cashInHand = max(0, $getCumulativeBalance('1010'));

        // 2. Bank Accounts (1020 + individual bank balances)
        $bankAccounts = BankAccount::where('is_active', true)->get();
        $totalBankBalance = (float) $bankAccounts->sum('current_balance');
        $banksBreakdown = $bankAccounts->map(fn($b) => [
            'id' => $b->id,
            'bank_name' => $b->bank_name,
            'account_name' => $b->account_name,
            'account_number' => $b->account_number,
            'balance' => round((float) $b->current_balance, 2),
        ])->toArray();

        // 3. Liabilities (Cumulative as of date)
        $taxBalance = $getCumulativeBalance('2010'); // Output VAT
        $apBalance = $getCumulativeBalance('2020');  // Accounts Payable

        $taxPayable = max(0, $taxBalance);
        $accountsPayable = max(0, $apBalance);
        $totalLiabilities = $taxPayable + $accountsPayable;

        // 4. Period Revenues, Expenses & COGS (matching P&L statement)
        $salesRevenue = max(0, $getPeriodBalance('4010'));
        $otherIncome = max(0, $getPeriodBalance('4020'));
        $salesDiscounts = max(0, $getPeriodBalance('5030'));
        $netSales = $salesRevenue - $salesDiscounts;
        $totalRevenue = $netSales + $otherIncome;

        $cogs = max(0, $getPeriodBalance('5010'));
        $operatingExpenses = max(0, $getPeriodBalance('5020'));

        // Other expense accounts within period
        $otherExpenseAccounts = ChartOfAccount::where('account_type', 'Expense')
            ->whereNotIn('account_code', ['5010', '5020', '5030'])
            ->get();
        $otherExpensesTotal = 0.0;
        foreach ($otherExpenseAccounts as $ea) {
            $otherExpensesTotal += max(0, $getPeriodBalance($ea->account_code));
        }
        $totalExpenses = $operatingExpenses + $otherExpensesTotal;

        $grossProfit = $totalRevenue - $cogs;
        $netOperatingProfit = $grossProfit - $totalExpenses;
        $netProfitMargin = $totalRevenue > 0 ? round(($netOperatingProfit / $totalRevenue) * 100, 1) : 0.0;

        // 5. Cumulative Owner Equity & Earnings (matching Balance Sheet)
        $ownerCapital = max(0, $getCumulativeBalance('3010'));
        $retainedEarnings = max(0, $getCumulativeBalance('3020'));
        
        // All-time net earnings up to asOf
        $allTimeSales = max(0, $getCumulativeBalance('4010')) - max(0, $getCumulativeBalance('5030')) + max(0, $getCumulativeBalance('4020'));
        $allTimeCogs = max(0, $getCumulativeBalance('5010'));
        $allTimeExp = max(0, $getCumulativeBalance('5020'));
        foreach ($otherExpenseAccounts as $ea) {
            $allTimeExp += max(0, $getCumulativeBalance($ea->account_code));
        }
        $cumulativeNetEarnings = $allTimeSales - $allTimeCogs - $allTimeExp;
        $totalEquity = $ownerCapital + $retainedEarnings + $cumulativeNetEarnings;

        return [
            'cash_in_hand' => round($cashInHand, 2),
            'total_bank_balance' => round($totalBankBalance, 2),
            'banks_breakdown' => $banksBreakdown,
            'tax_payable' => round($taxPayable, 2),
            'accounts_payable' => round($accountsPayable, 2),
            'total_liabilities' => round($totalLiabilities, 2),
            'sales_revenue' => round($salesRevenue, 2),
            'sales_discounts' => round($salesDiscounts, 2),
            'net_sales' => round($netSales, 2),
            'cost_of_goods_sold' => round($cogs, 2),
            'cogs' => round($cogs, 2),
            'operating_expenses' => round($totalExpenses, 2),
            'total_revenue' => round($totalRevenue, 2),
            'gross_profit' => round($grossProfit, 2),
            'net_profit' => round($netOperatingProfit, 2),
            'net_profit_margin' => $netProfitMargin,
            'owner_capital' => round($ownerCapital, 2),
            'total_equity' => round($totalEquity, 2),
        ];
    }

    public function getCustomerMetrics(): array
    {
        $totalCustomers = (int) Customer::count();
        $activeCustomers = (int) Customer::where('is_active', true)->count();
        $totalReceivables = (float) Customer::sum('credit_balance');

        $customersWithDuesCount = (int) Customer::where('credit_balance', '>', 0)->count();

        // Top 5 Customers by Lifetime Spend
        $topCustomers = Customer::withCount(['orders' => fn($q) => $q->where('status', 'completed')])
            ->withSum(['orders' => fn($q) => $q->where('status', 'completed')], 'grand_total')
            ->orderByDesc('orders_sum_grand_total')
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'orders_count' => (int) $c->orders_count,
                'total_spent' => round((float) ($c->orders_sum_grand_total ?? 0), 2),
                'current_due' => round((float) $c->credit_balance, 2),
            ])
            ->toArray();

        return [
            'total_customers' => $totalCustomers,
            'active_customers' => $activeCustomers,
            'total_receivables' => round($totalReceivables, 2),
            'customers_with_dues_count' => $customersWithDuesCount,
            'top_customers' => $topCustomers,
        ];
    }

    public function getProductStockMetrics(): array
    {
        $totalProducts = (int) Product::count();
        $totalVariants = (int) ProductVariant::count();

        $variants = ProductVariant::with('product')->get();

        $totalUnitsInStock = 0;
        $totalCostValue = 0.0;
        $totalExpectedSalesValue = 0.0;
        $lowStockVariants = [];

        foreach ($variants as $v) {
            $qty = (int) $v->stock_quantity;
            $cost = (float) $v->cost_price;
            $selling = (float) $v->selling_price;
            $minAlert = (int) ($v->alert_quantity ?? 5);

            $totalUnitsInStock += $qty;
            $totalCostValue += ($qty * $cost);
            $totalExpectedSalesValue += ($qty * $selling);

            if ($qty <= $minAlert) {
                $lowStockVariants[] = [
                    'id' => $v->id,
                    'name' => $v->product ? "{$v->product->name} ({$v->variant_name})" : $v->variant_name,
                    'sku' => $v->sku,
                    'stock_quantity' => $qty,
                    'alert_quantity' => $minAlert,
                    'cost_price' => round($cost, 2),
                    'selling_price' => round($selling, 2),
                ];
            }
        }

        $potentialMargin = $totalExpectedSalesValue > 0 ? round((($totalExpectedSalesValue - $totalCostValue) / $totalExpectedSalesValue) * 100, 1) : 0.0;

        return [
            'total_products' => $totalProducts,
            'total_variants' => $totalVariants,
            'total_units_in_stock' => $totalUnitsInStock,
            'total_stock_cost_value' => round($totalCostValue, 2),
            'total_expected_sales_value' => round($totalExpectedSalesValue, 2),
            'potential_gross_margin' => $potentialMargin,
            'low_stock_count' => count($lowStockVariants),
            'low_stock_items' => array_slice($lowStockVariants, 0, 6),
        ];
    }

    public function getPurchaseMetrics(): array
    {
        $totalPurchasesCount = (int) Purchase::count();
        $completedPurchases = (int) Purchase::where('status', 'completed')->count();
        $pendingPurchases = (int) Purchase::where('status', 'pending')->count();

        $totalPurchaseAmount = (float) Purchase::where('status', 'completed')->sum('total_amount');
        $totalPaid = (float) Purchase::where('status', 'completed')->sum('paid_amount');
        $accountsPayable = max(0, round($totalPurchaseAmount - $totalPaid, 2));

        return [
            'total_purchases' => $totalPurchasesCount,
            'completed_purchases' => $completedPurchases,
            'pending_purchases' => $pendingPurchases,
            'total_purchase_amount' => round($totalPurchaseAmount, 2),
            'total_paid' => round($totalPaid, 2),
            'accounts_payable' => $accountsPayable,
        ];
    }

    public function getSalesByUserMetrics(?string $startDate = null, ?string $endDate = null): array
    {
        $users = User::all();
        $userPerformance = [];

        foreach ($users as $u) {
            $ordersQuery = Order::where('user_id', $u->id)->where('status', 'completed');
            if ($startDate && $endDate) {
                $ordersQuery->whereBetween('order_date', [$startDate, $endDate]);
            }

            $ordersCount = (int) (clone $ordersQuery)->count();
            $totalSales = (float) (clone $ordersQuery)->sum('grand_total');
            $collectedAmount = (float) (clone $ordersQuery)->sum('paid_amount');

            if ($ordersCount > 0 || $totalSales > 0) {
                $userPerformance[] = [
                    'user_id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->roles->pluck('name')->first() ?? 'Staff',
                    'orders_count' => $ordersCount,
                    'total_sales' => round($totalSales, 2),
                    'collected_amount' => round($collectedAmount, 2),
                    'average_order_value' => $ordersCount > 0 ? round($totalSales / $ordersCount, 2) : 0.0,
                ];
            }
        }

        usort($userPerformance, fn($a, $b) => $b['total_sales'] <=> $a['total_sales']);

        return $userPerformance;
    }

    public function getSalesChartData(int $days = 7): array
    {
        $chartData = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $dateStr = date('Y-m-d', strtotime("-{$i} days"));
            $dayLabel = date('D (d M)', strtotime($dateStr));

            $salesQuery = Order::where('status', 'completed')->whereDate('order_date', $dateStr);
            $totalRevenue = (float) (clone $salesQuery)->sum('grand_total');
            $ordersCount = (int) (clone $salesQuery)->count();
            $netSales = (float) (clone $salesQuery)->sum('subtotal');
            $vat = (float) (clone $salesQuery)->sum('tax_amount');

            $chartData[] = [
                'date' => $dateStr,
                'label' => $dayLabel,
                'short_day' => date('D', strtotime($dateStr)),
                'revenue' => round($totalRevenue, 2),
                'net_sales' => round($netSales, 2),
                'vat' => round($vat, 2),
                'orders_count' => $ordersCount,
            ];
        }

        return $chartData;
    }

    public function getTopSellingProducts(int $limit = 5): array
    {
        $topItems = OrderItem::select('product_id', 'product_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(line_total) as total_revenue'))
            ->whereHas('order', fn($q) => $q->where('status', 'completed'))
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('total_qty')
            ->limit($limit)
            ->get();

        $maxQty = (int) ($topItems->max('total_qty') ?: 1);

        return $topItems->map(fn($item) => [
            'product_id' => $item->product_id,
            'name' => $item->product_name,
            'total_qty' => (int) $item->total_qty,
            'total_revenue' => round((float) $item->total_revenue, 2),
            'percentage' => round(((int) $item->total_qty / $maxQty) * 100, 1),
        ])->toArray();
    }

    public function getPaymentMethodDistribution(?string $startDate = null, ?string $endDate = null): array
    {
        $query = Order::where('status', 'completed');
        if ($startDate && $endDate) {
            $query->whereBetween('order_date', [$startDate, $endDate]);
        }

        $methods = (clone $query)->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(grand_total) as total_amount'))
            ->groupBy('payment_method')
            ->get();

        $grandTotalSum = (float) $methods->sum('total_amount');

        return $methods->map(fn($m) => [
            'method' => $m->payment_method ?: 'cash',
            'label' => ucwords(str_replace('_', ' ', $m->payment_method ?: 'cash')),
            'count' => (int) $m->count,
            'amount' => round((float) $m->total_amount, 2),
            'percentage' => $grandTotalSum > 0 ? round(((float) $m->total_amount / $grandTotalSum) * 100, 1) : 0.0,
        ])->toArray();
    }

    public function getRecentOrders(int $limit = 8): array
    {
        return Order::with(['customer', 'user'])
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'order_date' => $o->order_date ? $o->order_date->toDateString() : '',
                'customer_name' => $o->customer?->name ?? 'Walk-in Customer',
                'cashier_name' => $o->user?->name ?? 'System',
                'status' => $o->status,
                'payment_status' => $o->payment_status,
                'payment_method' => $o->payment_method,
                'grand_total' => round((float) $o->grand_total, 2),
                'paid_amount' => round((float) $o->paid_amount, 2),
                'due_amount' => round((float) $o->due_amount, 2),
            ])
            ->toArray();
    }

    public function getRecentJournals(int $limit = 6): array
    {
        return JournalEntry::with('items.account')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn($je) => [
                'id' => $je->id,
                'entry_number' => $je->entry_number,
                'entry_date' => $je->entry_date ? $je->entry_date->toDateString() : '',
                'reference_type' => $je->reference_type,
                'description' => $je->description,
                'total_amount' => round((float) $je->total_amount, 2),
                'items' => $je->items->map(fn($it) => [
                    'account_code' => $it->account?->account_code ?? '',
                    'account_name' => $it->account?->account_name ?? '',
                    'debit' => (float) $it->debit,
                    'credit' => (float) $it->credit,
                    'narration' => $it->narration,
                ])->toArray(),
            ])
            ->toArray();
    }

    public function getUserSpecificMetrics(int $userId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = Order::where('user_id', $userId);

        if ($startDate && $endDate) {
            $query->whereBetween('order_date', [$startDate, $endDate]);
        }

        $completedQuery = (clone $query)->where('status', 'completed');
        $pendingQuery = (clone $query)->where('status', 'pending');

        $totalOrders = (int) (clone $query)->count();
        $completedCount = (int) (clone $completedQuery)->count();
        $pendingCount = (int) (clone $pendingQuery)->count();

        $grossSales = (float) (clone $completedQuery)->sum('grand_total');
        $subtotal = (float) (clone $completedQuery)->sum('subtotal');
        $discountAmount = (float) (clone $completedQuery)->sum('discount_amount');
        $vatCollected = (float) (clone $completedQuery)->sum('tax_amount');
        $netSales = max(0, $subtotal - $discountAmount);
        $totalCollected = (float) (clone $completedQuery)->sum('paid_amount');

        $aov = $completedCount > 0 ? round($grossSales / $completedCount, 2) : 0.0;

        // Payment tenders collected specifically by this cashier/user
        $methods = (clone $completedQuery)->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(grand_total) as total_amount'))
            ->groupBy('payment_method')
            ->get();

        $grandTotalSum = (float) $methods->sum('total_amount');
        $paymentMethods = $methods->map(fn($m) => [
            'method' => $m->payment_method ?: 'cash',
            'label' => ucwords(str_replace('_', ' ', $m->payment_method ?: 'cash')),
            'count' => (int) $m->count,
            'amount' => round((float) $m->total_amount, 2),
            'percentage' => $grandTotalSum > 0 ? round(((float) $m->total_amount / $grandTotalSum) * 100, 1) : 0.0,
        ])->toArray();

        // Recent orders placed by this user
        $myRecentOrders = (clone $query)->with('customer')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'order_date' => $o->order_date ? $o->order_date->toDateString() : '',
                'customer_name' => $o->customer?->name ?? 'Walk-in Customer',
                'status' => $o->status,
                'payment_status' => $o->payment_status,
                'payment_method' => $o->payment_method,
                'grand_total' => round((float) $o->grand_total, 2),
                'paid_amount' => round((float) $o->paid_amount, 2),
            ])->toArray();

        return [
            'user_id' => $userId,
            'total_orders' => $totalOrders,
            'completed_orders' => $completedCount,
            'pending_orders' => $pendingCount,
            'gross_sales' => round($grossSales, 2),
            'net_sales' => round($netSales, 2),
            'operating_revenue' => round($netSales, 2),
            'vat_collected' => round($vatCollected, 2),
            'discounts_given' => round($discountAmount, 2),
            'total_collected' => round($totalCollected, 2),
            'average_order_value' => $aov,
            'payment_methods' => $paymentMethods,
            'recent_orders' => $myRecentOrders,
        ];
    }
}
