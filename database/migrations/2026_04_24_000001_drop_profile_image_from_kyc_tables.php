<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Migrate existing profile_image_path data into canonical fields,
     * then drop the column from both KYC tables.
     *
     * - tenant_kycs.profile_image_path  → tenants.logo (only if tenants.logo is empty)
     * - customer_kycs.profile_image_path → dropped (no canonical equivalent on the users
     *   table is auto-populated here; user must re-upload via Profile Settings)
     */
    public function up(): void
    {
        // 1. Migrate tenant KYC profile images → tenants.logo (where logo is not already set)
        if (Schema::hasColumn('tenant_kycs', 'profile_image_path')) {
            if (DB::getDriverName() === 'sqlite') {
                // SQLite doesn't support UPDATE...INNER JOIN; use a compatible approach
                DB::table('tenant_kycs')
                    ->whereNotNull('profile_image_path')
                    ->orderBy('id')
                    ->each(function ($kyc) {
                        DB::table('tenants')
                            ->where('id', $kyc->tenant_id)
                            ->where(function ($q) {
                                $q->whereNull('logo')->orWhere('logo', '');
                            })
                            ->update(['logo' => $kyc->profile_image_path]);
                    });
            } else {
                DB::statement("
                    UPDATE tenants t
                    INNER JOIN tenant_kycs k ON k.tenant_id = t.id
                    SET t.logo = k.profile_image_path
                    WHERE k.profile_image_path IS NOT NULL
                      AND (t.logo IS NULL OR t.logo = '')
                ");
            }

            Schema::table('tenant_kycs', function (Blueprint $table) {
                $table->dropColumn('profile_image_path');
            });
        }

        // 2. Drop profile_image_path from customer_kycs
        if (Schema::hasColumn('customer_kycs', 'profile_image_path')) {
            Schema::table('customer_kycs', function (Blueprint $table) {
                $table->dropColumn('profile_image_path');
            });
        }
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::table('tenant_kycs', function (Blueprint $table) {
            $table->string('profile_image_path')->nullable()->after('tenant_id');
        });

        Schema::table('customer_kycs', function (Blueprint $table) {
            $table->string('profile_image_path')->nullable()->after('customer_id');
        });
    }
};
