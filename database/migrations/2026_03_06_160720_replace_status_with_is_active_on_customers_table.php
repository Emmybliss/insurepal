<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('annual_income');
        });

        // Migrate existing data: 'active' -> true, everything else -> false
        DB::table('customers')->update([
            'is_active' => DB::raw("CASE WHEN `status` = 'active' THEN 1 ELSE 0 END"),
        ]);

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'status']);
            $table->dropColumn('status');
            $table->index(['tenant_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('annual_income');
        });

        DB::table('customers')->update([
            'status' => DB::raw("CASE WHEN `is_active` = 1 THEN 'active' ELSE 'inactive' END"),
        ]);

        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'is_active']);
            $table->dropColumn('is_active');
            $table->index(['tenant_id', 'status']);
        });
    }
};
