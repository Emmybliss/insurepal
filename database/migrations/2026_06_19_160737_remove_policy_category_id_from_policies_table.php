<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if (! Schema::hasColumn('policies', 'policy_category_id')) {
            return;
        }

        if ($driver === 'sqlite') {
            return;
        }

        Schema::table('policies', function (Blueprint $table) {
            $table->dropForeign(['policy_category_id']);
            $table->dropColumn('policy_category_id');
        });
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('policies', function (Blueprint $table) {
            $table->unsignedBigInteger('policy_category_id')->nullable();
            $table->foreign('policy_category_id')->references('id')->on('policy_categories')->onDelete('set null');
        });
    }
};
