<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('placements', function (Blueprint $table) {
            $table->foreignId('policy_class_id')->nullable()->after('policy_product_id')->constrained('policy_classes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('placements', function (Blueprint $table) {
            $table->dropForeign(['policy_class_id']);
            $table->dropColumn('policy_class_id');
        });
    }
};
