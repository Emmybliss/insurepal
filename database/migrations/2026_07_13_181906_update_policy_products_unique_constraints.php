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
        Schema::table('policy_products', function (Blueprint $table) {
            // Drop old unique constraints
            $table->dropUnique(['code']);

            // Add tenant-scoped unique constraints
            $table->unique(['tenant_id', 'code'], 'policy_products_tenant_code_unique');
            $table->unique(['tenant_id', 'name'], 'policy_products_tenant_name_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policy_products', function (Blueprint $table) {
            if (Schema::hasIndex('policy_products', 'policy_products_tenant_code_unique')) {
                $table->dropUnique('policy_products_tenant_code_unique');
            }

            if (Schema::hasIndex('policy_products', 'policy_products_tenant_name_unique')) {
                $table->dropUnique('policy_products_tenant_name_unique');
            }
        });
    }
};
