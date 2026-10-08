<?php

namespace App\Services;

use App\Contracts\Repositories\AccountingRepositoryInterface;
use App\Contracts\Services\AccountingServiceInterface;
use App\Models\JournalEntry;
use App\Models\Order;
use RuntimeException;

class AccountingService implements AccountingServiceInterface
{
    public function __construct(
        protected AccountingRepositoryInterface $accountingRepo
    ) {
    }

    public function recordOrderCompletionJournalEntry(Order $order): JournalEntry
    {
        // 1. Fetch Chart of Accounts
        $arAccount = $this->accountingRepo->findAccountByCode('1050');       // Accounts Receivable (Asset)
        $salesAccount = $this->accountingRepo->findAccountByCode('4010');    // Sales Revenue (Revenue)
        $taxAccount = $this->accountingRepo->findAccountByCode('2010');      // Tax Payable (Liability)
        $cashAccount = $this->accountingRepo->findAccountByCode('1010');     // Cash in Hand (Asset)
        $bankAccount = $this->accountingRepo->findAccountByCode('1020');     // Bank (Asset)
        $cogsAccount = $this->accountingRepo->findAccountByCode('5010');     // COGS (Expense)
        $inventoryAccount = $this->accountingRepo->findAccountByCode('1060');// Merchandise Inventory (Asset)

        if (!$arAccount || !$salesAccount || !$taxAccount) {
            throw new RuntimeException("Core Chart of Accounts (1050, 4010, 2010) must be initialized before posting sales journal entries.");
        }

        $items = [];
        $grandTotal = (float) $order->grand_total;
        $netSales = (float) ($order->subtotal - $order->discount_amount);
        $taxAmount = (float) $order->tax_amount;

        // Entry 1: Debit Accounts Receivable (Full Order Amount)
        $items[] = [
            'account_id' => $arAccount->id,
            'debit' => $grandTotal,
            'credit' => 0.00,
            'narration' => "Receivable from Customer: {$order->customer->name} (Order #{$order->order_number})",
        ];

        // Entry 2: Credit Sales Revenue (Net Sales)
        $items[] = [
            'account_id' => $salesAccount->id,
            'debit' => 0.00,
            'credit' => $netSales,
            'narration' => "Sales Revenue generated from Order #{$order->order_number}",
        ];

        // Entry 3: Credit Tax Payable (Tax Collected)
        if ($taxAmount > 0) {
            $items[] = [
                'account_id' => $taxAccount->id,
                'debit' => 0.00,
                'credit' => $taxAmount,
                'narration' => "5% Sales Tax / VAT Payable on Order #{$order->order_number}",
            ];
        }

        // Entry 4: Calculate Total Cost for COGS Perpetual Inventory Entry
        $totalCost = 0.0;
        foreach ($order->items as $orderItem) {
            $unitCost = (float) ($orderItem->unit_cost ?: ($orderItem->variant ? $orderItem->variant->cost_price : 0));
            $totalCost += ($unitCost * $orderItem->quantity);
        }

        if ($totalCost > 0 && $cogsAccount && $inventoryAccount) {
            // Debit: Cost of Goods Sold
            $items[] = [
                'account_id' => $cogsAccount->id,
                'debit' => $totalCost,
                'credit' => 0.00,
                'narration' => "Cost of Goods Sold for Order #{$order->order_number}",
            ];

            // Credit: Merchandise Inventory
            $items[] = [
                'account_id' => $inventoryAccount->id,
                'debit' => 0.00,
                'credit' => $totalCost,
                'narration' => "Inventory reduction for Order #{$order->order_number}",
            ];
        }

        // Entry 5: If paid at checkout, record payment settlement
        $paidAmount = (float) $order->paid_amount;
        if ($paidAmount > 0) {
            $settlementAccount = ($order->payment_method === 'bank_transfer' || $order->payment_method === 'card') 
                ? ($bankAccount ?? $cashAccount) 
                : ($cashAccount ?? $bankAccount);

            if ($settlementAccount) {
                // Debit Cash / Bank
                $items[] = [
                    'account_id' => $settlementAccount->id,
                    'debit' => $paidAmount,
                    'credit' => 0.00,
                    'narration' => "Payment received ({$order->payment_method}) for Order #{$order->order_number}",
                ];

                // Credit Accounts Receivable
                $items[] = [
                    'account_id' => $arAccount->id,
                    'debit' => 0.00,
                    'credit' => $paidAmount,
                    'narration' => "AR Settlement for Order #{$order->order_number}",
                ];
            }
        }

        $entryData = [
            'entry_date' => $order->order_date,
            'reference_type' => 'Order',
            'reference_id' => $order->id,
            'description' => "Sales & Invoicing Journal Entry for Order #{$order->order_number} ({$order->customer->name})",
            'created_by' => $order->user_id,
        ];

        return $this->accountingRepo->createJournalEntry($entryData, $items);
    }

    public function recordPaymentReceipt(Order $order, float $amount, string $paymentMethod): JournalEntry
    {
        $arAccount = $this->accountingRepo->findAccountByCode('1050');
        $cashAccount = $this->accountingRepo->findAccountByCode('1010');
        $bankAccount = $this->accountingRepo->findAccountByCode('1020');

        $settlementAccount = in_array($paymentMethod, ['bank_transfer', 'card']) ? ($bankAccount ?? $cashAccount) : $cashAccount;

        $items = [
            [
                'account_id' => $settlementAccount->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => "Subsequent payment receipt ({$paymentMethod}) for Order #{$order->order_number}",
            ],
            [
                'account_id' => $arAccount->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => "Credit to AR from payment on Order #{$order->order_number}",
            ],
        ];

        $entryData = [
            'entry_date' => now()->toDateString(),
            'reference_type' => 'Order',
            'reference_id' => $order->id,
            'description' => "Customer Payment Receipt for Order #{$order->order_number}",
            'created_by' => auth()->id() ?? $order->user_id,
        ];

        return $this->accountingRepo->createJournalEntry($entryData, $items);
    }

    public function getDashboardMetrics(): array
    {
        return $this->accountingRepo->getAccountingMetrics();
    }
}
