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
            // Add new columns
            $table->string('naicom_reg_number')->nullable()->after('country');
            $table->string('rc_number')->nullable()->after('naicom_reg_number');
            $table->string('website')->nullable()->after('rc_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['naicom_reg_number', 'rc_number', 'website']);
        });
    }
};
