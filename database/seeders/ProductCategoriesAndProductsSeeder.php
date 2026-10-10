<?php

namespace Database\Seeders;

use App\Models\BankAccount;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductCategoriesAndProductsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categories
        $categoriesData = [
            ['name' => 'Fragrances & Perfumes', 'slug' => 'fragrances-perfumes', 'description' => 'Premium perfumes, colognes, and body mists'],
            ['name' => 'Beverages & Coffee', 'slug' => 'beverages-coffee', 'description' => 'Packaged drinks, beans, and artisan teas'],
            ['name' => 'Electronics & Accessories', 'slug' => 'electronics-accessories', 'description' => 'Gadgets, chargers, audio, and smart gear'],
            ['name' => 'Health & Skincare', 'slug' => 'health-skincare', 'description' => 'Lotions, serums, sunscreen, and organic care'],
            ['name' => 'Apparel & Fashion', 'slug' => 'apparel-fashion', 'description' => 'Clothing, accessories, and wearable goods'],
            ['name' => 'Snacks & Confectionery', 'slug' => 'snacks-confectionery', 'description' => 'Chocolates, biscuits, roasted nuts, and sweets'],
            ['name' => 'Stationery & Office Supplies', 'slug' => 'stationery-office', 'description' => 'Notebooks, pens, desk organizers, and paper products'],
            ['name' => 'Groceries & Gourmet', 'slug' => 'groceries-gourmet', 'description' => 'Organic staples, oils, sauces, and dry goods'],
            ['name' => 'Personal Care & Grooming', 'slug' => 'personal-care-grooming', 'description' => 'Shampoo, soaps, oral care, and styling'],
            ['name' => 'Home & Living Essentials', 'slug' => 'home-living-essentials', 'description' => 'Diffusers, candles, utensils, and room decor'],
        ];

        $categoryMap = [];
        foreach ($categoriesData as $cat) {
            $created = ProductCategory::firstOrCreate(['slug' => $cat['slug']], $cat);
            $categoryMap[] = $created->id;
        }

        $admin = User::first();
        $adminId = $admin ? $admin->id : 1;

        // 2. Specific Flagship Products with Explicit Variants
        $this->seedFlagshipProducts($categoryMap[0], $categoryMap[1], $categoryMap[2], $categoryMap[3]);

        // 3. Generate Bulk Products to reach 5,000 products
        $existingProductCount = Product::count();
        $targetCount = 5000;
        $needed = $targetCount - $existingProductCount;

        if ($needed > 0) {
            $this->seedBulkProducts($needed, $categoryMap);
        }

        // 4. Create and Maintain Product Purchases
        $this->seedPurchasesAndStock($adminId);
    }

    protected function seedFlagshipProducts(int $fragranceCatId, int $beveragesCatId, int $electronicsCatId, int $skincareCatId): void
    {
        // Perfume - ABC (with 3 variants as specifically required)
        $perfume = Product::firstOrCreate(
            ['slug' => 'perfume-abc'],
            [
                'category_id' => $fragranceCatId,
                'name' => 'Perfume - ABC',
                'brand' => 'Aura Luxury',
                'description' => 'Signature luxury aromatic fragrance with long-lasting scent notes.',
                'has_variants' => true,
                'base_cost_price' => 70.00,
                'base_selling_price' => 100.00,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'PRF-ABC-80ML'],
            [
                'product_id' => $perfume->id,
                'variant_name' => '80ml',
                'barcode' => '890123456001',
                'cost_price' => 60.00,
                'selling_price' => 100.00,
                'stock_quantity' => 45,
                'alert_quantity' => 5,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'PRF-ABC-120ML'],
            [
                'product_id' => $perfume->id,
                'variant_name' => '120ml',
                'barcode' => '890123456002',
                'cost_price' => 90.00,
                'selling_price' => 150.00,
                'stock_quantity' => 30,
                'alert_quantity' => 5,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'PRF-ABC-200ML'],
            [
                'product_id' => $perfume->id,
                'variant_name' => '200ml (Deluxe)',
                'barcode' => '890123456003',
                'cost_price' => 135.00,
                'selling_price' => 220.00,
                'stock_quantity' => 25,
                'alert_quantity' => 3,
                'is_active' => true,
            ]
        );

        // Royal Blue Oud Perfume
        $oud = Product::firstOrCreate(
            ['slug' => 'royal-blue-oud'],
            [
                'category_id' => $fragranceCatId,
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
                'product_id' => $oud->id,
                'variant_name' => '50ml Spray',
                'barcode' => '890123456004',
                'cost_price' => 200.00,
                'selling_price' => 350.00,
                'stock_quantity' => 28,
                'alert_quantity' => 4,
                'is_active' => true,
            ]
        );

        ProductVariant::firstOrCreate(
            ['sku' => 'OUD-BLU-100ML'],
            [
                'product_id' => $oud->id,
                'variant_name' => '100ml Edition',
                'barcode' => '890123456005',
                'cost_price' => 320.00,
                'selling_price' => 550.00,
                'stock_quantity' => 20,
                'alert_quantity' => 3,
                'is_active' => true,
            ]
        );

        // Artisan Roasted Coffee Beans
        $coffee = Product::firstOrCreate(
            ['slug' => 'artisan-roasted-coffee'],
            [
                'category_id' => $beveragesCatId,
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
                'stock_quantity' => 50,
                'alert_quantity' => 10,
                'is_active' => true,
            ]
        );

        // Fast Wireless Power Bank
        $powerBank = Product::firstOrCreate(
            ['slug' => 'wireless-power-bank-10k'],
            [
                'category_id' => $electronicsCatId,
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
                'stock_quantity' => 35,
                'alert_quantity' => 5,
                'is_active' => true,
            ]
        );

        // Vitamin C Serum
        $serum = Product::firstOrCreate(
            ['slug' => 'hydrating-vitamin-c-serum'],
            [
                'category_id' => $skincareCatId,
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
                'stock_quantity' => 40,
                'alert_quantity' => 5,
                'is_active' => true,
            ]
        );
    }

    protected function seedBulkProducts(int $countToCreate, array $categoryIds): void
    {
        $adjectives = ['Premium', 'Organic', 'Ultra', 'Deluxe', 'Classic', 'Pro', 'Pure', 'Eco', 'Natural', 'Essential', 'Artisan', 'Signature', 'Active', 'Fresh', 'Royal', 'Comfort', 'Quick', 'Smart', 'Hydra', 'Gold'];
        $nouns = [
            'Espresso Roast', 'Green Tea', 'Moisturizer', 'Cleansing Foam', 'Wireless Earbuds',
            'USB-C Cable', 'Leather Wallet', 'Cotton T-Shirt', 'Energy Drink', 'Dark Chocolate Bar',
            'Roasted Almonds', 'Ballpoint Pen Set', 'A5 Journal', 'Essential Oil', 'Hand Sanitizer',
            'Body Wash', 'Ceramic Mug', 'Desk Lamp', 'Phone Stand', 'Protein Bar',
            'Almond Butter', 'Olive Oil Extra Virgin', 'Scented Candle', 'Bath Towel', 'Screen Protector',
            'Mechanical Pencil', 'Face Mask', 'Hair Serum', 'Herbal Infusion', 'Granola Mix'
        ];
        $brands = ['Apex Living', 'Aura Botanicals', 'VoltGear', 'DermaCare', 'PureEssence', 'UrbanStyle', 'Summit Roast', 'NovaTech', 'Silk & Herb', 'PrimeGoods'];

        $existingMaxId = (int) (Product::max('id') ?? 0);
        $chunkSize = 500;
        $now = now();

        for ($i = 1; $i <= $countToCreate; $i += $chunkSize) {
            $batchProducts = [];
            $batchVariants = [];
            $limit = min($chunkSize, $countToCreate - $i + 1);

            for ($j = 0; $j < $limit; $j++) {
                $idx = $existingMaxId + $i + $j;
                $adj = $adjectives[$idx % count($adjectives)];
                $noun = $nouns[$idx % count($nouns)];
                $brand = $brands[$idx % count($brands)];
                $catId = $categoryIds[$idx % count($categoryIds)];

                $name = "{$adj} {$noun} #{$idx}";
                $slug = Str::slug($name) . "-{$idx}";
                $cost = round(30 + (($idx * 17) % 450), 2);
                $markup = 1.35 + (($idx % 15) * 0.02);
                $price = round($cost * $markup, 2);

                $batchProducts[] = [
                    'id' => $idx,
                    'category_id' => $catId,
                    'name' => $name,
                    'slug' => $slug,
                    'brand' => $brand,
                    'description' => "High quality {$adj} {$noun} crafted by {$brand}. Reliable and tested for daily performance.",
                    'has_variants' => true,
                    'base_cost_price' => $cost,
                    'base_selling_price' => $price,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $barcode = '890' . str_pad($idx, 9, '0', STR_PAD_LEFT);
                $sku = 'PRD-' . str_pad($idx, 5, '0', STR_PAD_LEFT);
                $stock = 15 + ($idx % 85);

                $batchVariants[] = [
                    'product_id' => $idx,
                    'variant_name' => 'Standard Pack',
                    'sku' => $sku,
                    'barcode' => $barcode,
                    'cost_price' => $cost,
                    'selling_price' => $price,
                    'stock_quantity' => $stock,
                    'alert_quantity' => 5,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('products')->insertOrIgnore($batchProducts);
            DB::table('product_variants')->insertOrIgnore($batchVariants);
        }
    }

    protected function seedPurchasesAndStock(int $userId): void
    {
        $bankAccount = BankAccount::where('bank_name', 'like', '%City%')->first() 
            ?? BankAccount::first();
        $bankAccountId = $bankAccount?->id;
        $cashCoa = ChartOfAccount::where('account_code', '1010')->first();
        $bankCoa = $bankAccount?->chart_of_account_id ?? ChartOfAccount::where('account_code', '1020')->first()?->id;
        $inventoryCoa = ChartOfAccount::where('account_code', '1060')->first();
        $capitalCoa = ChartOfAccount::where('account_code', '3010')->first();

        // Sample initial purchase batches to demonstrate full GRN receiving workflow
        $suppliers = [
            ['name' => 'Global Retail Imports Ltd', 'phone' => '+880 1711-223344'],
            ['name' => 'Aura Fragrance & Cosmetics Supply', 'phone' => '+880 1819-556677'],
            ['name' => 'Pacific Beverage & Agro Distributors', 'phone' => '+880 1912-998877'],
            ['name' => 'Apex Electronics & Gadgets Wholesale', 'phone' => '+880 1610-334455'],
            ['name' => 'Pure Glow Skincare Labs', 'phone' => '+880 1712-445566'],
        ];

        // 1. Create a set of Completed Purchases (with inventory stock movements & journal entries)
        $sampleVariants = ProductVariant::with('product')->take(20)->get();

        foreach ($suppliers as $sIndex => $supplier) {
            $purchaseNo = 'PO-' . date('Ymd') . '-' . str_pad($sIndex + 1, 3, '0', STR_PAD_LEFT);
            $existingPurchase = Purchase::where('purchase_number', $purchaseNo)->first();

            if (!$existingPurchase) {
                $pVariants = $sampleVariants->slice($sIndex * 3, 3);
                if ($pVariants->isEmpty()) {
                    $pVariants = $sampleVariants->take(2);
                }

                $totalAmount = 0;
                $itemsData = [];
                foreach ($pVariants as $v) {
                    $qty = 20 + ($sIndex * 5);
                    $lineTotal = round($qty * (float) $v->cost_price, 2);
                    $totalAmount += $lineTotal;

                    $itemsData[] = [
                        'product_id' => $v->product_id,
                        'product_variant_id' => $v->id,
                        'quantity' => $qty,
                        'unit_cost' => $v->cost_price,
                        'line_total' => $lineTotal,
                    ];
                }

                // 2 out of 5 purchases set to 'pending' (Pending Receipt) so Store Keeper can test receiving!
                $isPending = ($sIndex >= 3);
                $status = $isPending ? 'pending' : 'received';
                $receivedBy = $isPending ? null : $userId;
                $receivedAt = $isPending ? null : now()->subDays(5 - $sIndex);

                $purchase = Purchase::create([
                    'purchase_number' => $purchaseNo,
                    'supplier_name' => $supplier['name'],
                    'supplier_phone' => $supplier['phone'],
                    'supplier_invoice_no' => 'INV-SUP-' . (1000 + $sIndex),
                    'purchase_date' => now()->subDays(7 - $sIndex)->toDateString(),
                    'status' => $status,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $isPending ? 0.00 : $totalAmount,
                    'payment_method' => $isPending ? 'cash' : 'bank',
                    'bank_account_id' => $isPending ? null : $bankAccountId,
                    'chart_of_account_id' => $isPending ? $cashCoa?->id : $bankCoa,
                    'notes' => $isPending 
                        ? 'Goods purchase order placed with supplier. Awaiting Warehouse Store Keeper GRN check & receipt.'
                        : 'Completed purchase receipt and paid via bank settlement.',
                    'user_id' => $userId,
                    'received_by_user_id' => $receivedBy,
                    'received_at' => $receivedAt,
                ]);

                foreach ($itemsData as $item) {
                    $purchase->items()->create($item);

                    if ($status === 'received') {
                        // Stock movement log
                        StockMovement::create([
                            'product_id' => $item['product_id'],
                            'product_variant_id' => $item['product_variant_id'],
                            'order_id' => null,
                            'user_id' => $userId,
                            'type' => 'IN',
                            'quantity' => $item['quantity'],
                            'stock_before' => 10,
                            'stock_after' => 10 + $item['quantity'],
                            'unit_cost' => $item['unit_cost'],
                            'reference_number' => $purchase->purchase_number,
                            'notes' => "Purchase received from {$supplier['name']}",
                        ]);
                    }
                }

                // If completed purchase, record balanced accounting journal entry
                if ($status === 'received' && $inventoryCoa && $bankCoa) {
                    $je = JournalEntry::create([
                        'entry_number' => 'JE-PUR-' . str_pad($purchase->id, 5, '0', STR_PAD_LEFT),
                        'entry_date' => $purchase->purchase_date,
                        'reference_type' => 'Purchase',
                        'reference_id' => $purchase->id,
                        'description' => "Purchase Receipt from {$purchase->supplier_name} ({$purchase->purchase_number})",
                        'total_debit' => $totalAmount,
                        'total_credit' => $totalAmount,
                    ]);

                    // Debit: Merchandise Inventory Asset (1060)
                    JournalItem::create([
                        'journal_entry_id' => $je->id,
                        'account_id' => $inventoryCoa->id,
                        'bank_account_id' => null,
                        'debit' => $totalAmount,
                        'credit' => 0.00,
                        'narration' => "Inventory replenishment from {$purchase->supplier_name}",
                    ]);

                    // Credit: Bank Account Asset (1020)
                    JournalItem::create([
                        'journal_entry_id' => $je->id,
                        'account_id' => $bankCoa,
                        'bank_account_id' => $bankAccountId,
                        'debit' => 0.00,
                        'credit' => $totalAmount,
                        'narration' => "Payment for {$purchase->purchase_number}",
                    ]);
                }
            }
        }
    }
}
