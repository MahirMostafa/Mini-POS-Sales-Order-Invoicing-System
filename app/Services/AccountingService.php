<?php

namespace App\Services;

use App\Contracts\Repositories\AccountingRepositoryInterface;
use App\Contracts\Services\AccountingServiceInterface;
use App\Models\BankAccount;
use App\Models\Customer;
use App\Models\JournalEntry;
use App\Models\Order;
use App\Models\Purchase;
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
        $generalBankAccount = $this->accountingRepo->findAccountByCode('1020'); // Bank (Asset)
        $cogsAccount = $this->accountingRepo->findAccountByCode('5010');     // COGS (Expense)
        $inventoryAccount = $this->accountingRepo->findAccountByCode('1060');// Merchandise Inventory (Asset)

        if (!$arAccount || !$salesAccount || !$taxAccount) {
            throw new RuntimeException("Core Chart of Accounts (1050, 4010, 2010) must be initialized before posting sales journal entries.");
        }

        $items = [];
        $grandTotal = (float) $order->grand_total;
        $paidAmount = min($grandTotal, max(0, (float) $order->paid_amount));
        $dueAmount = max(0, round($grandTotal - $paidAmount, 2));
        $netSales = (float) ($order->subtotal - $order->discount_amount);
        $taxAmount = (float) $order->tax_amount;
        $roundingAmount = (float) ($order->rounding_amount ?? 0.00);

        // Entry 1: Credit Sales Revenue (Net Sales + Rounding adjustment)
        $revenueCredit = round($netSales + $roundingAmount, 2);
        $items[] = [
            'account_id' => $salesAccount->id,
            'debit' => 0.00,
            'credit' => $revenueCredit,
            'narration' => "Sales Revenue from Order #{$order->order_number}" . ($roundingAmount > 0 ? " (+{$roundingAmount} ceiling round)" : ""),
        ];

        // Entry 2: Credit Tax Payable (Tax Collected)
        if ($taxAmount > 0) {
            $items[] = [
                'account_id' => $taxAccount->id,
                'debit' => 0.00,
                'credit' => $taxAmount,
                'narration' => "Output VAT/Tax collected on Order #{$order->order_number}",
            ];
        }

        // Entry 3: Debit Paid Amount (Cash or Bank)
        if ($paidAmount > 0) {
            $isBank = in_array($order->payment_method, ['bank_transfer', 'card', 'digital']) || !empty($order->bank_account_id);
            
            $bankAcc = null;
            if ($order->bank_account_id) {
                $bankAcc = BankAccount::find($order->bank_account_id);
            }

            if ($isBank) {
                $bankHeadId = $bankAcc?->chart_of_account_id ?? $generalBankAccount?->id ?? $cashAccount->id;
                $items[] = [
                    'account_id' => $bankHeadId,
                    'bank_account_id' => $bankAcc?->id,
                    'debit' => $paidAmount,
                    'credit' => 0.00,
                    'narration' => "Payment received via " . ($bankAcc ? $bankAcc->display_label : "Bank ({$order->payment_method})") . " for Order #{$order->order_number}",
                ];
            } else {
                $items[] = [
                    'account_id' => $cashAccount->id,
                    'debit' => $paidAmount,
                    'credit' => 0.00,
                    'narration' => "Cash tender received at POS for Order #{$order->order_number}",
                ];
            }
        }

        // Entry 4: Debit Accounts Receivable for any remaining due balance
        if ($dueAmount > 0) {
            $items[] = [
                'account_id' => $arAccount->id,
                'debit' => $dueAmount,
                'credit' => 0.00,
                'narration' => "Receivable Due from Customer: {$order->customer->name} (Order #{$order->order_number})",
            ];
        }

        // Entry 5: COGS & Inventory Perpetual Entry
        $totalCost = 0.0;
        foreach ($order->items as $orderItem) {
            $unitCost = (float) ($orderItem->unit_cost ?: ($orderItem->variant ? $orderItem->variant->cost_price : 0));
            $totalCost += ($unitCost * $orderItem->quantity);
        }

        if ($totalCost > 0 && $cogsAccount && $inventoryAccount) {
            // Debit: Cost of Goods Sold
            $items[] = [
                'account_id' => $cogsAccount->id,
                'debit' => round($totalCost, 2),
                'credit' => 0.00,
                'narration' => "Cost of Goods Sold (COGS) for Order #{$order->order_number}",
            ];

            // Credit: Merchandise Inventory
            $items[] = [
                'account_id' => $inventoryAccount->id,
                'debit' => 0.00,
                'credit' => round($totalCost, 2),
                'narration' => "Merchandise inventory reduction for Order #{$order->order_number}",
            ];
        }

        $entryData = [
            'entry_date' => $order->order_date,
            'reference_type' => 'Order',
            'reference_id' => $order->id,
            'description' => "Sales Invoicing & Ledger Entry for Order #{$order->order_number} ({$order->customer->name})",
            'created_by' => $order->user_id,
        ];

        return $this->accountingRepo->createJournalEntry($entryData, $items);
    }

    public function recordPaymentReceipt(Order $order, float $amount, string $paymentMethod, ?int $bankAccountId = null): JournalEntry
    {
        $arAccount = $this->accountingRepo->findAccountByCode('1050');
        $cashAccount = $this->accountingRepo->findAccountByCode('1010');
        $generalBankAccount = $this->accountingRepo->findAccountByCode('1020');

        $isBank = in_array($paymentMethod, ['bank_transfer', 'card', 'digital']) || !empty($bankAccountId);
        $bankAcc = $bankAccountId ? BankAccount::find($bankAccountId) : null;
        $settlementAccount = $isBank ? ($bankAcc?->chart_of_account_id ?? $generalBankAccount?->id ?? $cashAccount->id) : $cashAccount->id;

        $items = [
            [
                'account_id' => $settlementAccount,
                'bank_account_id' => $bankAcc?->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => "Subsequent payment receipt (" . ($bankAcc ? $bankAcc->bank_name : $paymentMethod) . ") for Order #{$order->order_number}",
            ],
            [
                'account_id' => $arAccount->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => "Credit to AR for payment on Order #{$order->order_number}",
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

    public function recordPurchaseJournalEntry(Purchase $purchase): JournalEntry
    {
        $inventoryAccount = $this->accountingRepo->findAccountByCode('1060'); // Merchandise Inventory (Asset)
        $cashAccount = $this->accountingRepo->findAccountByCode('1010');      // Cash in Hand (Asset)
        $generalBankAccount = $this->accountingRepo->findAccountByCode('1020'); // Bank (Asset)
        $apAccount = $this->accountingRepo->findAccountByCode('2020');        // Accounts Payable (Liability)

        if (!$inventoryAccount) {
            $inventoryAccount = $this->accountingRepo->createAccount([
                'account_code' => '1060',
                'account_name' => 'Merchandise Inventory',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'Stock inventory asset',
            ]);
        }

        if (!$apAccount) {
            $apAccount = $this->accountingRepo->createAccount([
                'account_code' => '2020',
                'account_name' => 'Accounts Payable (Suppliers)',
                'account_type' => 'Liability',
                'normal_balance' => 'Credit',
                'description' => 'Outstanding supplier dues',
            ]);
        }

        $totalAmount = (float) $purchase->total_amount;
        $paidAmount = (float) $purchase->paid_amount;
        $dueAmount = max(0, round($totalAmount - $paidAmount, 2));

        $items = [];

        // 1. Debit Merchandise Inventory for total cost value of goods
        $items[] = [
            'account_id' => $inventoryAccount->id,
            'debit' => $totalAmount,
            'credit' => 0.00,
            'narration' => "Goods Restocked via Purchase Order #{$purchase->purchase_number} from {$purchase->supplier_name}",
        ];

        // 2. Credit Cash / Bank for paid portion
        if ($paidAmount > 0) {
            $isBank = in_array($purchase->payment_method, ['bank_transfer', 'card']) || !empty($purchase->bank_account_id);
            $bankAcc = $purchase->bank_account_id ? BankAccount::find($purchase->bank_account_id) : null;

            if ($isBank) {
                $targetAccountId = $bankAcc?->chart_of_account_id ?? $generalBankAccount?->id ?? $cashAccount->id;
                $items[] = [
                    'account_id' => $targetAccountId,
                    'bank_account_id' => $bankAcc?->id,
                    'debit' => 0.00,
                    'credit' => $paidAmount,
                    'narration' => "Payment disbursed via " . ($bankAcc ? $bankAcc->display_label : "Bank") . " for PO #{$purchase->purchase_number}",
                ];
            } else {
                $items[] = [
                    'account_id' => $cashAccount->id,
                    'debit' => 0.00,
                    'credit' => $paidAmount,
                    'narration' => "Cash paid for Purchase Order #{$purchase->purchase_number}",
                ];
            }
        }

        // 3. Credit Accounts Payable for any remaining due
        if ($dueAmount > 0) {
            $items[] = [
                'account_id' => $apAccount->id,
                'debit' => 0.00,
                'credit' => $dueAmount,
                'narration' => "Accounts Payable due to Supplier: {$purchase->supplier_name} (PO #{$purchase->purchase_number})",
            ];
        }

        $entryData = [
            'entry_date' => $purchase->purchase_date->toDateString(),
            'reference_type' => 'Purchase',
            'reference_id' => $purchase->id,
            'description' => "Purchase & Inflow Posting for PO #{$purchase->purchase_number} ({$purchase->supplier_name})",
            'created_by' => $purchase->user_id,
        ];

        return $this->accountingRepo->createJournalEntry($entryData, $items);
    }

    public function recordCustomerDueSettlementJournalEntry(Customer $customer, float $amount, string $paymentMethod, ?int $bankAccountId = null, ?string $note = null): JournalEntry
    {
        $arAccount = $this->accountingRepo->findAccountByCode('1050');
        $cashAccount = $this->accountingRepo->findAccountByCode('1010');
        $generalBankAccount = $this->accountingRepo->findAccountByCode('1020');

        $isBank = in_array($paymentMethod, ['bank_transfer', 'card', 'digital']) || !empty($bankAccountId);
        $bankAcc = $bankAccountId ? BankAccount::find($bankAccountId) : null;
        $targetAccountId = $isBank ? ($bankAcc?->chart_of_account_id ?? $generalBankAccount?->id ?? $cashAccount->id) : $cashAccount->id;

        $items = [
            [
                'account_id' => $targetAccountId,
                'bank_account_id' => $bankAcc?->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => "Customer Due Collection from {$customer->name}" . ($note ? " ({$note})" : ""),
            ],
            [
                'account_id' => $arAccount->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => "Accounts Receivable reduction for {$customer->name}",
            ],
        ];

        $entryData = [
            'entry_date' => now()->toDateString(),
            'reference_type' => 'Customer',
            'reference_id' => $customer->id,
            'description' => "Customer Due Settlement for {$customer->name} (৳" . number_format($amount, 2) . ")",
            'created_by' => auth()->id() ?? 1,
        ];

        return $this->accountingRepo->createJournalEntry($entryData, $items);
    }

    public function recordOpeningStockJournalEntry(\App\Models\ProductVariant $variant, int $quantity, float $unitCost, int $userId, string $note = ''): JournalEntry
    {
        $inventoryAccount = $this->accountingRepo->findAccountByCode('1060'); // Merchandise Inventory (Asset)
        $equityAccount = $this->accountingRepo->findAccountByCode('3010');    // Owner's Capital / Opening Equity

        if (!$inventoryAccount) {
            $inventoryAccount = $this->accountingRepo->createAccount([
                'account_code' => '1060',
                'account_name' => 'Merchandise Inventory',
                'account_type' => 'Asset',
                'normal_balance' => 'Debit',
                'description' => 'Stock inventory asset',
            ]);
        }

        if (!$equityAccount) {
            $equityAccount = $this->accountingRepo->findAccountByCode('3020') ?: $this->accountingRepo->createAccount([
                'account_code' => '3010',
                'account_name' => "Owner's Capital",
                'account_type' => 'Equity',
                'normal_balance' => 'Credit',
                'description' => "Owner's equity and opening balances",
            ]);
        }

        $totalValue = round($quantity * $unitCost, 2);

        $productName = $variant->product ? $variant->product->name : 'Product';
        $variantTitle = "{$productName} - {$variant->variant_name}";

        $items = [
            [
                'account_id' => $inventoryAccount->id,
                'debit' => $totalValue,
                'credit' => 0.00,
                'narration' => "Opening Stock Asset Valuation: {$variantTitle} ({$quantity} units @ ৳" . number_format($unitCost, 2) . ")",
            ],
            [
                'account_id' => $equityAccount->id,
                'debit' => 0.00,
                'credit' => $totalValue,
                'narration' => "Opening Balance Equity for {$variantTitle}" . ($note ? " ({$note})" : ""),
            ],
        ];

        $entryData = [
            'entry_date' => now()->toDateString(),
            'reference_type' => 'OpeningStock',
            'reference_id' => $variant->id,
            'description' => "Opening Stock Initialization for {$variantTitle} (৳" . number_format($totalValue, 2) . ")",
            'created_by' => $userId,
        ];

        return $this->accountingRepo->createJournalEntry($entryData, $items);
    }

    public function recordManualVoucher(array $data, int $userId): JournalEntry
    {
        $voucherType = $data['voucher_type'] ?? 'general';
        $amount = (float) ($data['amount'] ?? 0);
        $entryDate = $data['entry_date'] ?? date('Y-m-d');
        $narration = $data['narration'] ?? 'Manual Voucher Entry';

        $cashAccount = $this->accountingRepo->findAccountByCode('1010');
        $generalBankAccount = $this->accountingRepo->findAccountByCode('1020');

        $items = [];

        if ($voucherType === 'contra_deposit') {
            // Cash to Bank Deposit
            $bankAcc = !empty($data['bank_account_id']) ? BankAccount::find($data['bank_account_id']) : null;
            $bankHeadId = $bankAcc?->chart_of_account_id ?? $generalBankAccount->id;

            // Debit: Bank
            $items[] = [
                'account_id' => $bankHeadId,
                'bank_account_id' => $bankAcc?->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => "Cash Deposit to " . ($bankAcc ? $bankAcc->display_label : "Bank"),
            ];

            // Credit: Cash
            $items[] = [
                'account_id' => $cashAccount->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => "Cash Withdrawn from Counter for Bank Deposit",
            ];
        } elseif ($voucherType === 'contra_withdraw') {
            // Bank to Cash Withdrawal
            $bankAcc = !empty($data['bank_account_id']) ? BankAccount::find($data['bank_account_id']) : null;
            $bankHeadId = $bankAcc?->chart_of_account_id ?? $generalBankAccount->id;

            // Debit: Cash
            $items[] = [
                'account_id' => $cashAccount->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => "Cash Withdrawn from " . ($bankAcc ? $bankAcc->display_label : "Bank"),
            ];

            // Credit: Bank
            $items[] = [
                'account_id' => $bankHeadId,
                'bank_account_id' => $bankAcc?->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => "Withdrawal from " . ($bankAcc ? $bankAcc->display_label : "Bank") . " to Cash in Hand",
            ];
        } elseif ($voucherType === 'contra_transfer') {
            // Bank to Bank Transfer
            $fromBank = BankAccount::find($data['from_bank_account_id'] ?? null);
            $toBank = BankAccount::find($data['to_bank_account_id'] ?? null);

            $fromHead = $fromBank?->chart_of_account_id ?? $generalBankAccount->id;
            $toHead = $toBank?->chart_of_account_id ?? $generalBankAccount->id;

            // Debit To Bank
            $items[] = [
                'account_id' => $toHead,
                'bank_account_id' => $toBank?->id,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => "Transfer Received from " . ($fromBank ? $fromBank->display_label : "Source Bank"),
            ];

            // Credit From Bank
            $items[] = [
                'account_id' => $fromHead,
                'bank_account_id' => $fromBank?->id,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => "Transfer Sent to " . ($toBank ? $toBank->display_label : "Destination Bank"),
            ];
        } elseif ($voucherType === 'expense') {
            // Direct Expense Payment
            $expenseAccountId = (int) $data['account_id'];
            $paymentSource = $data['payment_source'] ?? 'cash';
            $bankAcc = !empty($data['bank_account_id']) ? BankAccount::find($data['bank_account_id']) : null;

            // Debit: Expense Head
            $items[] = [
                'account_id' => $expenseAccountId,
                'debit' => $amount,
                'credit' => 0.00,
                'narration' => $narration,
            ];

            // Credit: Cash or Bank
            if ($paymentSource === 'bank') {
                $bankHeadId = $bankAcc?->chart_of_account_id ?? $generalBankAccount->id;
                $items[] = [
                    'account_id' => $bankHeadId,
                    'bank_account_id' => $bankAcc?->id,
                    'debit' => 0.00,
                    'credit' => $amount,
                    'narration' => "Expense disbursed via " . ($bankAcc ? $bankAcc->display_label : "Bank"),
                ];
            } else {
                $items[] = [
                    'account_id' => $cashAccount->id,
                    'debit' => 0.00,
                    'credit' => $amount,
                    'narration' => "Expense paid in Cash",
                ];
            }
        } elseif ($voucherType === 'income') {
            // Direct Income Receipt
            $incomeAccountId = (int) $data['account_id'];
            $receiptDestination = $data['payment_source'] ?? 'cash';
            $bankAcc = !empty($data['bank_account_id']) ? BankAccount::find($data['bank_account_id']) : null;

            // Debit: Cash or Bank
            if ($receiptDestination === 'bank') {
                $bankHeadId = $bankAcc?->chart_of_account_id ?? $generalBankAccount->id;
                $items[] = [
                    'account_id' => $bankHeadId,
                    'bank_account_id' => $bankAcc?->id,
                    'debit' => $amount,
                    'credit' => 0.00,
                    'narration' => "Income received into " . ($bankAcc ? $bankAcc->display_label : "Bank"),
                ];
            } else {
                $items[] = [
                    'account_id' => $cashAccount->id,
                    'debit' => $amount,
                    'credit' => 0.00,
                    'narration' => "Income received in Cash",
                ];
            }

            // Credit: Income Head
            $items[] = [
                'account_id' => $incomeAccountId,
                'debit' => 0.00,
                'credit' => $amount,
                'narration' => $narration,
            ];
        } else {
            // Custom multi-line voucher
            $rawItems = $data['items'] ?? [];
            foreach ($rawItems as $it) {
                $items[] = [
                    'account_id' => $it['account_id'],
                    'bank_account_id' => $it['bank_account_id'] ?? null,
                    'debit' => (float) ($it['debit'] ?? 0),
                    'credit' => (float) ($it['credit'] ?? 0),
                    'narration' => $it['narration'] ?? $narration,
                ];
            }
        }

        $entryData = [
            'entry_date' => $entryDate,
            'reference_type' => 'Voucher',
            'reference_id' => null,
            'description' => $narration,
            'created_by' => $userId,
        ];

        return $this->accountingRepo->createJournalEntry($entryData, $items);
    }

    public function getDashboardMetrics(): array
    {
        return $this->accountingRepo->getAccountingMetrics();
    }

    public function getDashboardStockMetrics(): array
    {
        return $this->accountingRepo->getDashboardStockMetrics();
    }
}
