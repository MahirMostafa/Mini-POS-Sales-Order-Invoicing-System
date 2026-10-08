<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index(['is_active', 'category_id', 'name'], 'idx_products_lookup');
            $table->index('brand', 'idx_products_brand');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->index(['product_id', 'is_active'], 'idx_variants_product_active');
            $table->index(['is_active', 'selling_price'], 'idx_variants_active_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_lookup');
            $table->dropIndex('idx_products_brand');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex('idx_variants_product_active');
            $table->dropIndex('idx_variants_active_price');
        });
    }
};
