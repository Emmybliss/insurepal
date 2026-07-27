<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $indexes = Schema::getIndexes('policies');
        $hasGlobalUnique = collect($indexes)->contains(function ($index) {
            return $index['name'] === 'policies_policy_number_unique';
        });

        $hasTenantUnique = collect($indexes)->contains(function ($index) {
            return $index['name'] === 'policies_tenant_id_policy_number_unique';
        });

        Schema::table('policies', function (Blueprint $table) use ($hasGlobalUnique, $hasTenantUnique) {
            if ($hasGlobalUnique) {
                $table->dropUnique('policies_policy_number_unique');
            }

            if (! $hasTenantUnique) {
                $table->unique(['tenant_id', 'policy_number'], 'policies_tenant_id_policy_number_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $indexes = Schema::getIndexes('policies');
        $hasTenantUnique = collect($indexes)->contains(function ($index) {
            return $index['name'] === 'policies_tenant_id_policy_number_unique';
        });

        if ($hasTenantUnique) {
            Schema::table('policies', function (Blueprint $table) {
                $table->dropUnique('policies_tenant_id_policy_number_unique');
            });
        }
    }
};
