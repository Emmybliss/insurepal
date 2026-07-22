<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->foreignId('insurance_product_id')->nullable()->after('id')->constrained('insurance_products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropForeign(['insurance_product_id']);
            $table->dropColumn('insurance_product_id');
        });
    }
};
