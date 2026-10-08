<?php

namespace Tests\Feature;

use App\Contracts\Services\AccountingServiceInterface;
use App\Contracts\Services\InventoryServiceInterface;
use App\Contracts\Services\OrderServiceInterface;
use App\Models\ChartOfAccount;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\TaxRate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosOrderAccountingWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_create_pending_sales_order_without_deducting_stock(): void
    {
        $user = User::first();
        $customer = Customer::first();
        $variant = ProductVariant::where('sku', 'PRF-ABC-80ML')->first();
        $initialStock = $variant->stock_quantity; // 35

        $orderService = app(OrderServiceInterface::class);

        $order = $orderService->createOrder([
            'customer_id' => $customer->id,
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 2,
                    'unit_price' => 100.00,
                    'discount' => 0.00,
                ],
            ],
            'discount_rate' => 0,
            'discount_amount' => 0,
            'notes' => 'Test pending order',
        ], $user->id);

        $this->assertEquals('pending', $order->status);
        $this->assertEquals(200.00, (float) $order->subtotal);
        $this->assertEquals(10.00, (float) $order->tax_amount); // 5% of 200 = 10
        $this->assertEquals(210.00, (float) $order->grand_total);

        // Stock MUST NOT be deducted yet!
        $this->assertEquals($initialStock, $variant->fresh()->stock_quantity);
    }

    public function test_cannot_complete_order_when_stock_is_insufficient(): void
    {
        $user = User::first();
        $customer = Customer::first();
        $variant = ProductVariant::where('sku', 'PRF-ABC-80ML')->first();

        // Reduce stock artificially to 1
        $variant->update(['stock_quantity' => 1]);

        $orderService = app(OrderServiceInterface::class);

        // Create order requesting 5 units
        $order = $orderService->createOrder([
            'customer_id' => $customer->id,
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 5,
                    'unit_price' => 100.00,
                ],
            ],
        ], $user->id);

        // Attempt completion
        $result = $orderService->completeOrder($order);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Insufficient stock', $result['message']);
        $this->assertEquals('pending', $order->fresh()->status);
    }

    public function test_completing_order_deducts_stock_and_posts_balanced_double_entry(): void
    {
        $user = User::first();
        $customer = Customer::first();
        $variant = ProductVariant::where('sku', 'PRF-ABC-80ML')->first();
        $variant->update(['stock_quantity' => 50]);
        $initialStock = 50;


        $orderService = app(OrderServiceInterface::class);

        $order = $orderService->createOrder([
            'customer_id' => $customer->id,
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 3,
                    'unit_price' => 100.00, // Subtotal = 300
                    'discount' => 10.00,    // Net Subtotal = 290
                ],
            ],
            'discount_amount' => 0,
        ], $user->id);

        $this->assertEquals(0.50, (float) $order->rounding_amount);
        $this->assertEquals(305.00, (float) $order->grand_total);

        // Complete Order with rounded grand total
        $result = $orderService->completeOrder($order, $order->grand_total, 'cash');

        $this->assertTrue($result['success']);

        // 1. Stock deducted by 3
        $this->assertEquals($initialStock - 3, $variant->fresh()->stock_quantity);

        // 2. Order status completed
        $this->assertEquals('completed', $order->fresh()->status);

        // 3. Invoice generated with matching ceiling rounding
        $this->assertNotNull($order->fresh()->invoice);
        $this->assertStringStartsWith('INV-', $order->fresh()->invoice->invoice_number);
        $this->assertEquals(0.50, (float) $order->fresh()->invoice->rounding_amount);

        // 4. Double-Entry Journal Entry strictly balanced
        $journalEntry = $order->fresh()->journalEntry;
        $this->assertNotNull($journalEntry);
        $this->assertTrue($journalEntry->isBalanced());

        // Check specific debit/credit accounts
        $arItem = $journalEntry->items->where('account.account_code', '1050')->first();
        $salesItem = $journalEntry->items->where('account.account_code', '4010')->first();
        $taxItem = $journalEntry->items->where('account.account_code', '2010')->first();

        $this->assertNotNull($arItem);
        $this->assertNotNull($salesItem);
        $this->assertNotNull($taxItem);
        $this->assertEquals(14.50, (float) $taxItem->credit); // 5% of 290 = 14.50
    }

    public function test_credit_sale_tracks_customer_due_balance_and_allows_settlement(): void
    {
        $user = User::first();
        $customer = Customer::where('id', '>', 1)->first();
        $initialBalance = (float) $customer->credit_balance;
        $variant = ProductVariant::first();
        $variant->update(['stock_quantity' => 20]);

        $orderService = app(OrderServiceInterface::class);

        // 1. Create and complete a credit sale with ৳0 down payment
        $order = $orderService->createOrder([
            'customer_id' => $customer->id,
            'payment_method' => 'credit',
            'paid_amount' => 0.00,
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    'unit_price' => 500.00,
                    'discount' => 0.00,
                ],
            ],
        ], $user->id);

        $result = $orderService->completeOrder($order, 0.00, 'credit');
        $this->assertTrue($result['success']);

        $grandTotal = (float) $order->fresh()->grand_total; // 525.00 (with 5% VAT)
        $this->assertEquals('unpaid', $order->fresh()->payment_status);
        $this->assertEquals(0.00, (float) $order->fresh()->paid_amount);
        $this->assertEquals($grandTotal, (float) $order->fresh()->due_amount);

        // Customer credit/due balance must increment by the due amount
        $expectedBalance = $initialBalance + $grandTotal;
        $this->assertEquals($expectedBalance, (float) $customer->fresh()->credit_balance);

        // 2. Test Settle Due Payment
        $this->actingAs($user);
        $settleResponse = $this->postJson("/api/customers/{$customer->id}/settle-due", [
            'amount' => 200.00,
            'payment_method' => 'cash',
            'note' => 'Partial cash settlement',
        ]);

        $settleResponse->assertStatus(200);
        $this->assertEquals($expectedBalance - 200.00, (float) $customer->fresh()->credit_balance);
    }

    public function test_cannot_sell_on_credit_or_due_to_walk_in_customer(): void
    {
        $user = User::first();
        $walkInCustomer = Customer::where('customer_code', 'CUST-0001')->first() ?: Customer::first();
        $variant = ProductVariant::first();

        $orderService = app(OrderServiceInterface::class);

        // Expect exception when trying to create a credit sale for walk-in customer
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Credit / Due sales are not permitted for Walk-in Customers');

        $orderService->createOrder([
            'customer_id' => $walkInCustomer->id,
            'payment_method' => 'credit',
            'paid_amount' => 0.00,
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    'unit_price' => 200.00,
                ],
            ],
        ], $user->id);
    }
}
