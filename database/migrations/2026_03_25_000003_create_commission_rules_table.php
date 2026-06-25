<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('scope', ['global', 'product', 'policy_class'])->default('global');
            $table->unsignedBigInteger('scope_id')->nullable(); // policy_product_id or policy_class_id
            $table->decimal('insurer_percent', 5, 2)->default(70.00);  // to insurance company
            $table->decimal('broker_percent', 5, 2)->default(20.00);   // to broker wallet
            $table->decimal('platform_percent', 5, 2)->default(10.00); // to InsurePal platform
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['scope', 'scope_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_rules');
    }
};
