<?php

namespace Tests\Feature;

use App\Models\ChartOfAccount;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use App\Models\User;
use Database\Seeders\ChartOfAccountsSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductStockAccountingRuleTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $this->admin = User::first();
    }

    public function test_product_creation_forces_stock_to_zero_for_accounting_compliance(): void
    {
        $category = ProductCategory::first();

        $response = $this->actingAs($this->admin)->postJson('/products', [
            'name' => 'Royal Oud Perfume',
            'category_id' => $category ? $category->id : null,
            'brand' => 'Crown Collection',
            'variants' => [
                [
                    'variant_name' => '100ml',
                    'sku' => 'OUD-100',
                    'cost_price' => 50.00,
                    'selling_price' => 120.00,
                    'stock_quantity' => 50, // User attempted to enter 50 stock
                ]
            ]
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('products', ['name' => 'Royal Oud Perfume']);

        $variant = ProductVariant::where('sku', 'OUD-100')->first();
        $this->assertNotNull($variant);
        // Stock must be strictly 0
        $this->assertEquals(0, $variant->stock_quantity);
    }

    public function test_opening_stock_voucher_adds_inventory_and_posts_double_entry_journal(): void
    {
        $category = ProductCategory::first();
        $product = Product::create([
            'name' => 'Attar Rose',
            'slug' => 'attar-rose',
            'category_id' => $category ? $category->id : null,
            'base_cost_price' => 30.00,
            'base_selling_price' => 60.00,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'variant_name' => '12ml',
            'sku' => 'ATTAR-12ML',
            'cost_price' => 30.00,
            'selling_price' => 60.00,
            'stock_quantity' => 0,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->postJson("/products/variants/{$variant->id}/stock", [
            'quantity' => 20,
            'purchase_cost' => 30.00,
            'note' => 'Opening stock initialization for store launch',
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));

        // Inventory stock should now be 20
        $this->assertEquals(20, $variant->fresh()->stock_quantity);

        // Verify Journal Entry was created
        $this->assertDatabaseHas('journal_entries', [
            'reference_type' => 'OpeningStock',
            'reference_id' => $variant->id,
        ]);

        $journalEntry = \App\Models\JournalEntry::with('items.account')->where('reference_type', 'OpeningStock')->first();
        $this->assertNotNull($journalEntry);
        $this->assertEquals(600.00, $journalEntry->total_debit);
        $this->assertEquals(600.00, $journalEntry->total_credit);

        // Check Debit: Merchandise Inventory (1060), Credit: Owner's Capital (3010)
        $inventoryItem = $journalEntry->items->firstWhere('account.account_code', '1060');
        $equityItem = $journalEntry->items->firstWhere('account.account_code', '3010');

        $this->assertNotNull($inventoryItem, 'Merchandise Inventory Account (1060) was not debited.');
        $this->assertEquals(600.00, (float) $inventoryItem->debit);
        $this->assertEquals(0.00, (float) $inventoryItem->credit);

        $this->assertNotNull($equityItem, "Owner's Capital Account (3010) was not credited.");
        $this->assertEquals(0.00, (float) $equityItem->debit);
        $this->assertEquals(600.00, (float) $equityItem->credit);
    }
}
