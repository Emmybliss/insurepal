<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policy_products', function (Blueprint $table) {
            $table->boolean('supports_multiple_risks')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('policy_products', function (Blueprint $table) {
            $table->dropColumn('supports_multiple_risks');
        });
    }
};
