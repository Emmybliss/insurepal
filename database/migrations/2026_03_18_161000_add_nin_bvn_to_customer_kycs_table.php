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
        Schema::table('customer_kycs', function (Blueprint $table) {
            $table->string('nin')->nullable()->after('identity_number');
            $table->string('bvn')->nullable()->after('nin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_kycs', function (Blueprint $table) {
            $table->dropColumn(['nin', 'bvn']);
        });
    }
};
