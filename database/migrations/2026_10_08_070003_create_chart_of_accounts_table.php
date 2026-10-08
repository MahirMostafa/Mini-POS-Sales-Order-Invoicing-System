<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('account_code', 30)->unique();
            $table->string('account_name');
            $table->enum('account_type', ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']);
            $table->enum('normal_balance', ['Debit', 'Credit']);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('account_code');
            $table->index('account_type');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chart_of_accounts');
    }
};
