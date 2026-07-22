<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create the new broker_slip_risks table
        Schema::create('broker_slip_risks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('broker_slip_id')->constrained()->cascadeOnDelete();

            $table->foreignId('policy_class_id')->nullable()->constrained('policy_classes')->nullOnDelete();
            $table->foreignId('policy_product_id')->nullable()->constrained('policy_products')->nullOnDelete();

            $table->string('item_type', 50)->default('general');
            $table->text('description')->nullable();
            $table->string('identifier', 100)->nullable();
            $table->string('location', 255)->nullable();
            $table->integer('quantity')->nullable();

            $table->decimal('coverage_amount', 18, 2)->default(0);
            $table->decimal('rate', 10, 4)->nullable();
            $table->string('rate_basis', 20)->nullable();

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
        });

        // 2. Copy data from old broker_slip_items to new broker_slip_risks
        if (Schema::hasTable('broker_slip_items')) {
            $columns = [
                'tenant_id',
                'broker_slip_id',
                'item_type',
                'description',
                'identifier',
                'location',
                'quantity',
                'rate',
                'rate_basis',
                'premium',
                'sort_order',
                'created_at',
                'updated_at',
            ];

            $selectColumns = implode(', ', $columns);
            $castColumns = 'NULL AS policy_class_id, NULL AS policy_product_id, sum_insured AS coverage_amount, 0 AS net_premium, NULL AS commission_rate, NULL AS commission_amount, NULL AS taxes, NULL AS fees, NULL AS dynamic_fields, metadata, NULL AS inception_date, NULL AS expiry_date';

            DB::statement("
                INSERT INTO broker_slip_risks (id, {$selectColumns}, policy_class_id, policy_product_id, coverage_amount, net_premium, commission_rate, commission_amount, taxes, fees, dynamic_fields, metadata, inception_date, expiry_date)
                SELECT id, {$selectColumns}, {$castColumns}
                FROM broker_slip_items
            ");

            // 3. Drop old table
            Schema::dropIfExists('broker_slip_items');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('broker_slip_risks');
    }
};
