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
        Schema::table('permissions', function (Blueprint $table) {
            // Only add tenant_id if it doesn't exist
            if (! Schema::hasColumn('permissions', 'tenant_id')) {
                $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            }

            // Only add display_name if it doesn't exist
            if (! Schema::hasColumn('permissions', 'display_name')) {
                $table->string('display_name')->nullable()->after('name');
            }

            // Add category column (rename from module if it exists, otherwise create new)
            if (Schema::hasColumn('permissions', 'module') && ! Schema::hasColumn('permissions', 'category')) {
                $table->renameColumn('module', 'category');
            } elseif (! Schema::hasColumn('permissions', 'category')) {
                $table->string('category')->nullable()->after('description');
            }

            // Only add is_system_permission if it doesn't exist
            if (! Schema::hasColumn('permissions', 'is_system_permission')) {
                $table->boolean('is_system_permission')->default(false)->after('category');
            }

            // Add indexes for faster queries
            $table->index(['tenant_id', 'is_active'], 'permissions_tenant_active_index');
            $table->index(['category', 'is_active'], 'permissions_category_active_index');
            $table->index(['is_system_permission', 'is_active'], 'permissions_system_active_index');

            // Ensure unique permission names per tenant (global permissions have null tenant_id)
            $table->unique(['name', 'tenant_id'], 'permissions_name_tenant_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            // Only drop what we added
            if (Schema::hasColumn('permissions', 'tenant_id')) {
                $table->dropForeign(['tenant_id']);
                $table->dropColumn('tenant_id');
            }

            if (Schema::hasColumn('permissions', 'display_name')) {
                $table->dropColumn('display_name');
            }

            if (Schema::hasColumn('permissions', 'is_system_permission')) {
                $table->dropColumn('is_system_permission');
            }

            // Rename category back to module if we renamed it
            if (Schema::hasColumn('permissions', 'category') && ! Schema::hasColumn('permissions', 'module')) {
                $table->renameColumn('category', 'module');
            }

            // Drop indexes and constraints
            $table->dropIndex('permissions_tenant_active_index');
            $table->dropIndex('permissions_category_active_index');
            $table->dropIndex('permissions_system_active_index');
            $table->dropUnique('permissions_name_tenant_unique');
        });
    }
};
