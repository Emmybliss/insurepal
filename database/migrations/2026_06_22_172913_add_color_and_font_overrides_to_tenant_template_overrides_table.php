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
        Schema::table('tenant_template_overrides', function (Blueprint $table) {
            $table->json('color_overrides')->nullable()->after('css_overrides');
            $table->json('font_overrides')->nullable()->after('color_overrides');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_template_overrides', function (Blueprint $table) {
            $table->dropColumn(['color_overrides', 'font_overrides']);
        });
    }
};
