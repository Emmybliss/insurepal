<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_template_overrides', function (Blueprint $table) {
            $table->json('element_toggles')->nullable()->after('stamp');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_template_overrides', function (Blueprint $table) {
            $table->dropColumn('element_toggles');
        });
    }
};
