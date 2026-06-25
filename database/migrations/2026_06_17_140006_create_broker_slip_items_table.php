<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('broker_slip_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('broker_slip_id')->constrained()->cascadeOnDelete();
            $table->string('item_type', 50)->default('general');
            $table->text('description')->nullable();
            $table->string('identifier', 100)->nullable();
            $table->string('location', 255)->nullable();
            $table->integer('quantity')->nullable();
            $table->decimal('sum_insured', 18, 2)->default(0);
            $table->decimal('rate', 10, 4)->nullable();
            $table->string('rate_basis', 20)->nullable();
            $table->decimal('premium', 18, 2)->nullable();
            $table->json('metadata')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broker_slip_items');
    }
};
