<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_number', 50)->unique();
            $table->string('supplier_name');
            $table->string('supplier_phone')->nullable();
            $table->string('supplier_invoice_no')->nullable();
            $table->date('purchase_date');
            $table->enum('status', ['received', 'pending'])->default('received');
            $table->decimal('total_amount', 14, 2)->default(0.00);
            $table->decimal('paid_amount', 14, 2)->default(0.00);
            $table->string('payment_method')->default('cash');
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('purchase_number');
            $table->index('purchase_date');
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('line_total', 14, 2);
            $table->timestamps();

            $table->index('purchase_id');
            $table->index('product_variant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
    }
};
