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
        Schema::table('roles', function (Blueprint $table) {
            // Only add tenant_id if it doesn't exist
            if (! Schema::hasColumn('roles', 'tenant_id')) {
                $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            }

            // Only add display_name if it doesn't exist
            if (! Schema::hasColumn('roles', 'display_name')) {
                $table->string('display_name')->nullable()->after('name');
            }

            // Only add is_system_role if it doesn't exist
            if (! Schema::hasColumn('roles', 'is_system_role')) {
                $table->boolean('is_system_role')->default(false)->after('description');
            }

            // Add indexes for faster queries
            $table->index(['tenant_id', 'is_active'], 'roles_tenant_active_index');
            $table->index(['is_system_role', 'is_active'], 'roles_system_active_index');

            // Ensure unique role names per tenant (global roles have null tenant_id)
            $table->unique(['name', 'tenant_id'], 'roles_name_tenant_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            // Only drop what we added
            if (Schema::hasColumn('roles', 'tenant_id')) {
                $table->dropForeign(['tenant_id']);
                $table->dropColumn('tenant_id');
            }

            if (Schema::hasColumn('roles', 'is_system_role')) {
                $table->dropColumn('is_system_role');
            }

            // Drop indexes and constraints
            $table->dropIndex('roles_tenant_active_index');
            $table->dropIndex('roles_system_active_index');
            $table->dropUnique('roles_name_tenant_unique');
        });
    }
};
