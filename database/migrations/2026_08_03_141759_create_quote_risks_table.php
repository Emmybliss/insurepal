<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_risks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quote_id')->constrained()->cascadeOnDelete();
            $table->foreignId('policy_class_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('policy_product_id')->nullable()->constrained()->nullOnDelete();
            $table->text('description')->nullable();
            $table->string('identifier')->nullable();
            $table->string('location')->nullable();
            $table->integer('quantity')->nullable();
            $table->decimal('coverage_amount', 18, 2)->default(0);
            $table->decimal('rate', 10, 4)->nullable();
            $table->string('rate_basis')->nullable();
            $table->decimal('premium', 18, 2)->nullable();
            $table->decimal('net_premium', 18, 2)->default(0);
            $table->decimal('commission_rate', 5, 2)->nullable();
            $table->decimal('commission_amount', 18, 2)->nullable();
            $table->decimal('taxes', 18, 2)->nullable();
            $table->decimal('fees', 18, 2)->nullable();
            $table->json('dynamic_fields')->nullable();
            $table->json('metadata')->nullable();
            $table->date('inception_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['quote_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_risks');
    }
};
