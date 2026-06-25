<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        try {
            Schema::table('policy_payments', function (Blueprint $table) {
                $table->dropForeign(['commission_rule_id']);
            });
        } catch (\Throwable $e) {
            // Foreign key may not exist in all environments
        }

        $columns = ['insurer_amount', 'broker_amount', 'platform_amount', 'commission_rule_id', 'wallets_credited'];
        $existing = array_filter($columns, fn ($col) => Schema::hasColumn('policy_payments', $col));

        if (! empty($existing)) {
            Schema::table('policy_payments', function (Blueprint $table) use ($existing) {
                $table->dropColumn($existing);
            });
        }
    }

    public function down(): void
    {
        Schema::table('policy_payments', function (Blueprint $table) {
            $table->decimal('insurer_amount', 15, 2)->nullable();
            $table->decimal('broker_amount', 15, 2)->nullable();
            $table->decimal('platform_amount', 15, 2)->nullable();
            $table->foreignId('commission_rule_id')->nullable()->constrained('commission_rules')->onDelete('set null');
            $table->boolean('wallets_credited')->default(false);
        });
    }
};
