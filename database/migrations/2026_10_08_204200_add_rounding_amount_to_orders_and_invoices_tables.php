<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'rounding_amount')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->decimal('rounding_amount', 8, 2)->default(0.00)->after('tax_amount');
            });
        }

        if (Schema::hasTable('invoices') && !Schema::hasColumn('invoices', 'rounding_amount')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->decimal('rounding_amount', 8, 2)->default(0.00)->after('tax_amount');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'rounding_amount')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('rounding_amount');
            });
        }

        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'rounding_amount')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('rounding_amount');
            });
        }
    }
};
