<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create bank_accounts table
        if (!Schema::hasTable('bank_accounts')) {
            Schema::create('bank_accounts', function (Blueprint $table) {
                $table->id();
                $table->string('bank_name');
                $table->string('account_name');
                $table->string('account_number')->unique();
                $table->string('branch_name')->nullable();
                $table->string('routing_number')->nullable();
                $table->decimal('opening_balance', 15, 2)->default(0.00);
                $table->foreignId('chart_of_account_id')->nullable()->constrained('chart_of_accounts')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index('is_active');
                $table->index('bank_name');
            });
        }

        // 2. Add bank_account_id to orders
        if (Schema::hasTable('orders') && !Schema::hasColumn('orders', 'bank_account_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreignId('bank_account_id')->nullable()->after('payment_method')->constrained('bank_accounts')->nullOnDelete();
                $table->foreignId('chart_of_account_id')->nullable()->after('bank_account_id')->constrained('chart_of_accounts')->nullOnDelete();
            });
        }

        // 3. Add bank_account_id to purchases
        if (Schema::hasTable('purchases') && !Schema::hasColumn('purchases', 'bank_account_id')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->foreignId('bank_account_id')->nullable()->after('payment_method')->constrained('bank_accounts')->nullOnDelete();
                $table->foreignId('chart_of_account_id')->nullable()->after('bank_account_id')->constrained('chart_of_accounts')->nullOnDelete();
            });
        }

        // 4. Add bank_account_id to journal_items
        if (Schema::hasTable('journal_items') && !Schema::hasColumn('journal_items', 'bank_account_id')) {
            Schema::table('journal_items', function (Blueprint $table) {
                $table->foreignId('bank_account_id')->nullable()->after('account_id')->constrained('bank_accounts')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('journal_items') && Schema::hasColumn('journal_items', 'bank_account_id')) {
            Schema::table('journal_items', function (Blueprint $table) {
                $table->dropForeign(['bank_account_id']);
                $table->dropColumn('bank_account_id');
            });
        }

        if (Schema::hasTable('purchases') && Schema::hasColumn('purchases', 'bank_account_id')) {
            Schema::table('purchases', function (Blueprint $table) {
                $table->dropForeign(['bank_account_id']);
                $table->dropForeign(['chart_of_account_id']);
                $table->dropColumn(['bank_account_id', 'chart_of_account_id']);
            });
        }

        if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'bank_account_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropForeign(['bank_account_id']);
                $table->dropForeign(['chart_of_account_id']);
                $table->dropColumn(['bank_account_id', 'chart_of_account_id']);
            });
        }

        Schema::dropIfExists('bank_accounts');
    }
};
