<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class ProductCategoriesAndProductsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categories
        $fragranceCat = ProductCategory::firstOrCreate(
            ['slug' => 'fragrances-perfumes'],
            ['name' => 'Fragrances & Perfumes', 'description' => 'Premium perfumes, colognes, and body mists']
        );

        $beveragesCat = ProductCategory::firstOrCreate(
            ['slug' => 'beverages-coffee'],
            ['name' => 'Beverages & Coffee', 'description' => 'Packaged drinks, beans, and teas']
        );

        $electronicsCat = ProductCategory::firstOrCreate(
            ['slug' => 'electronics-accessories'],
            ['name' => 'Electronics & Accessories', 'description' => 'Gadgets, chargers, and audio']
        );

        $skincareCat = ProductCategory::firstOrCreate(
            ['slug' => 'health-skincare'],
            ['name' => 'Health & Skincare', 'description' => 'Lotions, serums, and organic care']
        );

        $apparelCat = ProductCategory::firstOrCreate(
            ['slug' => 'apparel-fashion'],
            ['name' => 'Apparel & Fashion', 'description' => 'Clothing, accessories, and wearable goods']
        );

        $snacksCat = ProductCategory::firstOrCreate(
            ['slug' => 'snacks-confectionery'],
            ['name' => 'Snacks & Confectionery', 'description' => 'Chocolates, biscuits, roasted nuts, and sweets']
        );

        $officeCat = ProductCategory::firstOrCreate(
            ['slug' => 'stationery-office'],
            ['name' => 'Stationery & Office Supplies', 'description' => 'Notebooks, pens, desk organizers, and paper products']
        );

        // 2. Product: Perfume - ABC (with Variants as specifically requested by user!)
        $perfume = Product::firstOrCreate(
            ['slug' => 'perfume-abc'],
            [
                'category_id' => $fragranceCat->id,
                'name' => 'Perfume - ABC',
                'brand' => 'Aura Luxury',
                'description' => 'Signature luxury aromatic fragrance with long-lasting scent notes.',
                'has_variants' => true,
                'base_cost_price' => 70.00,
                'base_selling_price' => 100.00,
                'is_active' => true,
            ]
        );

        // Variant 1: 80ml - 100 Taka
        ProductVariant::firstOrCreate(
            ['sku' => 'PRF-ABC-80ML'],
            [
                'product_id' => $perfume->id,
                'variant_name' => '80ml',
                'barcode' => '890123456001',
                'cost_price' => 60.00,
                'selling_price' => 100.00,
                'stock_quantity' => 35,
                'alert_quantity' => 5,
                'is_active' => true,
            ]
        );

        // Variant 2: 120ml - 150 Taka
        ProductVariant::firstOrCreate(
            ['sku' => 'PRF-ABC-120ML'],
            [
                'product_id' => $perfume->id,
                'variant_name' => '120ml',
                'barcode' => '890123456002',
                'cost_price' => 90.00,
                'selling_price' => 150.00,
                'stock_quantity' => 20,
                'alert_quantity' => 5,
                'is_active' => true,
            ]
        );

        // Variant 3: 200ml - 220 Taka
        ProductVariant::firstOrCreate(
            ['sku' => 'PRF-ABC-200ML'],
            [
                'product_id' => $perfume->id,
                'variant_name' => '200ml (Deluxe)',
                'barcode' => '890123456003',
                'cost_price' => 135.00,
                'selling_price' => 220.00,
                'stock_quantity' => 12,
                'alert_quantity' => 3,
                'is_active' => true,
            ]
        );

        // 3. Product: Royal Blue Oud Perfume
        $oudPerfume = Product::firstOrCreate(
            ['slug' => 'royal-blue-oud'],
            [
                'category_id' => $fragranceCat->id,
                'name' => 'Royal Blue Oud Perfume',
                'brand' => 'Orient Treasures',
                'description' => 'Pure oriental woody oud fragrance with amber and rose.',
                'has_variants' => true,
                'base_cost_price' => 200.00,
                'base_selling_price' => 350.00,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'OUD-BLU-50ML'],
            [
                'product_id' => $oudPerfume->id,
                'variant_name' => '50ml Spray',
                'barcode' => '890123456004',
                'cost_price' => 200.00,
                'selling_price' => 350.00,
                'stock_quantity' => 18,
                'alert_quantity' => 4,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'OUD-BLU-100ML'],
            [
                'product_id' => $oudPerfume->id,
                'variant_name' => '100ml Edition',
                'barcode' => '890123456005',
                'cost_price' => 320.00,
                'selling_price' => 550.00,
                'stock_quantity' => 15,
                'alert_quantity' => 3,
                'is_active' => true,
            ]
        );

        // 4. Product: Artisan Roasted Coffee Beans
        $coffee = Product::firstOrCreate(
            ['slug' => 'artisan-roasted-coffee'],
            [
                'category_id' => $beveragesCat->id,
                'name' => 'Artisan Roasted Arabica Coffee',
                'brand' => 'Mountain Brew',
                'description' => 'Single-origin freshly roasted medium dark whole coffee beans.',
                'has_variants' => true,
                'base_cost_price' => 250.00,
                'base_selling_price' => 450.00,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'COF-ARA-250G'],
            [
                'product_id' => $coffee->id,
                'variant_name' => '250g Pouch',
                'barcode' => '890123456006',
                'cost_price' => 250.00,
                'selling_price' => 450.00,
                'stock_quantity' => 40,
                'alert_quantity' => 10,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'COF-ARA-1KG'],
            [
                'product_id' => $coffee->id,
                'variant_name' => '1kg Commercial Bag',
                'barcode' => '890123456007',
                'cost_price' => 850.00,
                'selling_price' => 1400.00,
                'stock_quantity' => 10,
                'alert_quantity' => 2,
                'is_active' => true,
            ]
        );

        // 5. Product: Fast Wireless Power Bank 10,000mAh
        $powerBank = Product::firstOrCreate(
            ['slug' => 'wireless-power-bank-10k'],
            [
                'category_id' => $electronicsCat->id,
                'name' => 'Fast Wireless Power Bank 10,000mAh',
                'brand' => 'VoltGear',
                'description' => 'MagSafe compatible 22.5W fast charging power bank with LED display.',
                'has_variants' => true,
                'base_cost_price' => 600.00,
                'base_selling_price' => 950.00,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'PWR-MAG-BLK'],
            [
                'product_id' => $powerBank->id,
                'variant_name' => 'Midnight Black',
                'barcode' => '890123456008',
                'cost_price' => 600.00,
                'selling_price' => 950.00,
                'stock_quantity' => 25,
                'alert_quantity' => 5,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'PWR-MAG-WHT'],
            [
                'product_id' => $powerBank->id,
                'variant_name' => 'Glacier White',
                'barcode' => '890123456009',
                'cost_price' => 600.00,
                'selling_price' => 950.00,
                'stock_quantity' => 22,
                'alert_quantity' => 5,
                'is_active' => true,
            ]
        );

        // 6. Product: Hydrating Vitamin C Face Serum
        $serum = Product::firstOrCreate(
            ['slug' => 'hydrating-vitamin-c-serum'],
            [
                'category_id' => $skincareCat->id,
                'name' => 'Hydrating Vitamin C Face Serum',
                'brand' => 'DermaGlow',
                'description' => 'Pure Hyaluronic acid and 15% active Vitamin C facial serum.',
                'has_variants' => true,
                'base_cost_price' => 180.00,
                'base_selling_price' => 320.00,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'SRM-VITC-30ML'],
            [
                'product_id' => $serum->id,
                'variant_name' => '30ml Dropper',
                'barcode' => '890123456010',
                'cost_price' => 180.00,
                'selling_price' => 320.00,
                'stock_quantity' => 30,
                'alert_quantity' => 5,
                'is_active' => true,
            ]
        );

        // 7. Establish Double-Entry Accounting Asset Records & Stock Movement Ledger for Seeded Inventory
        $admin = \App\Models\User::first();
        $userId = $admin ? $admin->id : 1;
        $accountingService = app(\App\Contracts\Services\AccountingServiceInterface::class);

        $variants = ProductVariant::with('product')->get();
        foreach ($variants as $v) {
            if ($v->stock_quantity > 0) {
                // Post balanced Journal Entry (Debit: 1060 Merchandise Inventory Asset, Credit: 3010 Owner's Capital Equity)
                $alreadyJournaled = \App\Models\JournalEntry::where('reference_type', 'OpeningStock')
                    ->where('reference_id', $v->id)
                    ->exists();

                if (!$alreadyJournaled) {
                    $accountingService->recordOpeningStockJournalEntry(
                        $v,
                        $v->stock_quantity,
                        (float) $v->cost_price,
                        $userId,
                        'Initial seed stock asset valuation'
                    );
                }

                // Log stock movement audit trail
                $hasMovement = \App\Models\StockMovement::where('product_variant_id', $v->id)
                    ->where('type', 'IN')
                    ->exists();

                if (!$hasMovement) {
                    \App\Models\StockMovement::create([
                        'product_id' => $v->product_id,
                        'product_variant_id' => $v->id,
                        'order_id' => null,
                        'user_id' => $userId,
                        'type' => 'IN',
                        'quantity' => $v->stock_quantity,
                        'stock_before' => 0,
                        'stock_after' => $v->stock_quantity,
                        'unit_cost' => $v->cost_price,
                        'reference_number' => 'INIT-SEED-' . $v->sku,
                        'notes' => "Initial seed inventory allocation for {$v->fullName}",
                    ]);
                }
            }
        }
    }
}
