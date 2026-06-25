<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipt_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('receipt_id')->constrained()->onDelete('cascade');
            $table->foreignId('policy_id')->nullable()->constrained()->nullOnDelete();
            $table->string('allocation_type');
            $table->decimal('amount', 18, 2);
            $table->string('currency', 3)->default('NGN');
            $table->decimal('exchange_rate', 10, 6)->default(1.0);
            $table->boolean('is_direct_to_insurer')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['receipt_id', 'allocation_type']);
            $table->index(['policy_id', 'allocation_type']);
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_allocations');
    }
};
