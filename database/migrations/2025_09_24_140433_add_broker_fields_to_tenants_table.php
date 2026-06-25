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
        Schema::table('tenants', function (Blueprint $table) {
            // Check and add columns only if they don't exist
            if (! Schema::hasColumn('tenants', 'company_name')) {
                $table->string('company_name')->nullable()->after('name');
            }
            if (! Schema::hasColumn('tenants', 'contact_email')) {
                $table->string('contact_email')->nullable()->after('email');
            }
            if (! Schema::hasColumn('tenants', 'contact_phone')) {
                $table->string('contact_phone')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('tenants', 'city')) {
                $table->string('city')->nullable()->after('address');
            }
            if (! Schema::hasColumn('tenants', 'state')) {
                $table->string('state')->nullable()->after('city');
            }
            if (! Schema::hasColumn('tenants', 'postal_code')) {
                $table->string('postal_code')->nullable()->after('state');
            }
            if (! Schema::hasColumn('tenants', 'country')) {
                $table->string('country')->nullable()->default('Nigeria')->after('postal_code');
            }
        });

        // Indexes are added by the parent tenant migration
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Drop columns that were added (check if they exist first)
            $columns = ['company_name', 'contact_email', 'contact_phone', 'city', 'state', 'postal_code', 'country'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('tenants', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
