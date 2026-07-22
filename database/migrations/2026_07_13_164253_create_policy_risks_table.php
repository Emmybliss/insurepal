<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('policy_risks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained();
            $table->text('description')->nullable();
            $table->decimal('coverage_amount', 15, 2)->default(0);
            $table->decimal('rate', 10, 4)->nullable();
            $table->string('rate_basis', 20)->default('percentage');
            $table->decimal('premium', 15, 2)->default(0);
            $table->json('dynamic_fields')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('policy_risks');
    }
};
