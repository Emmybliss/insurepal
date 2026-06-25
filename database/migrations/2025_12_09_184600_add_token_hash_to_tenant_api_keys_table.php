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
        if (Schema::hasTable('tenant_api_keys')) {
            Schema::table('tenant_api_keys', function (Blueprint $table) {
                if (! Schema::hasColumn('tenant_api_keys', 'token_hash')) {
                    $table->string('token_hash', 64)->nullable()->after('token')->index(); // Hash for lookup
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_api_keys', function (Blueprint $table) {
            $table->dropColumn('token_hash');
        });
    }
};
