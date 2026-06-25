<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('remittance_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('remittance_id')->constrained()->onDelete('cascade');
            $table->morphs('allocatable');
            $table->string('allocation_type');
            $table->decimal('amount', 18, 2);
            $table->string('currency', 3)->default('NGN');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['remittance_id', 'allocation_type']);
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remittance_allocations');
    }
};
