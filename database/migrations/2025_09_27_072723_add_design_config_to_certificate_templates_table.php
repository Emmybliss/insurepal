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
        Schema::table('certificate_templates', function (Blueprint $table) {
            $table->json('design_config')->nullable()->after('style_config');
            $table->boolean('use_drag_drop_design')->default(false)->after('design_config');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificate_templates', function (Blueprint $table) {
            if (Schema::hasColumn('certificate_templates', 'design_config')) {
                $table->dropColumn('design_config');
            }
            if (Schema::hasColumn('certificate_templates', 'use_drag_drop_design')) {
                $table->dropColumn('use_drag_drop_design');
            }
        });
    }
};
