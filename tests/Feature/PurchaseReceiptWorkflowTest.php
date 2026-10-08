<?php

namespace Tests\Feature;

use App\Contracts\Repositories\PurchaseRepositoryInterface;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\User;
use Tests\TestCase;

class PurchaseReceiptWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_purchase_created_as_pending_does_not_increase_stock(): void
    {
        $creator = User::first();
        $variant = ProductVariant::first();
        $initialStock = $variant->stock_quantity;

        $repo = app(PurchaseRepositoryInterface::class);

        $purchase = $repo->create([
            'supplier_name' => 'Apex Test Supplier',
            'supplier_phone' => '01700000000',
            'supplier_invoice_no' => 'INV-TEST-001',
            'purchase_date' => date('Y-m-d'),
            'status' => 'pending',
            'payment_method' => 'bank_transfer',
            'paid_amount' => 500,
            'notes' => 'Awaiting physical delivery',
        ], [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 25,
                'unit_cost' => 120.00,
            ],
        ], $creator->id);

        $this->assertEquals('pending', $purchase->status);
        $this->assertEquals($creator->id, $purchase->user_id);
        $this->assertNull($purchase->received_by_user_id);
        $this->assertNull($purchase->received_at);

        // Stock MUST remain unchanged while purchase is pending
        $this->assertEquals($initialStock, $variant->fresh()->stock_quantity);
    }

    public function test_receiving_pending_purchase_replenishes_stock_and_tracks_receiving_user(): void
    {
        $creator = User::first();
        $receiver = User::latest('id')->first();
        $variant = ProductVariant::first();
        $initialStock = $variant->stock_quantity;

        $repo = app(PurchaseRepositoryInterface::class);

        $purchase = $repo->create([
            'supplier_name' => 'Pacific Suppliers Ltd',
            'supplier_phone' => '01800000000',
            'purchase_date' => date('Y-m-d'),
            'status' => 'pending',
            'payment_method' => 'cash',
        ], [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 10,
                'unit_cost' => 150.00,
            ],
        ], $creator->id);

        $this->assertEquals($initialStock, $variant->fresh()->stock_quantity);

        // Now receive goods via API endpoint
        $response = $this->actingAs($receiver)->postJson("/api/purchases/{$purchase->id}/receive");

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        $freshPurchase = Purchase::with(['user', 'receivedBy'])->find($purchase->id);
        $this->assertEquals('received', $freshPurchase->status);
        $this->assertEquals($creator->id, $freshPurchase->user_id);
        $this->assertEquals($receiver->id, $freshPurchase->received_by_user_id);
        $this->assertNotNull($freshPurchase->received_at);

        // Stock MUST now be increased by 10
        $this->assertEquals($initialStock + 10, $variant->fresh()->stock_quantity);
    }
}
