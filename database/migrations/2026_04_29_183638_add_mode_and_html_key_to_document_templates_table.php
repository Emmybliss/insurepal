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
        Schema::table('document_templates', function (Blueprint $table) {
            $table->string('mode')->default('designer')->after('type');
            $table->string('html_template_key')->nullable()->after('mode');
            $table->json('css_overrides')->nullable()->after('html_template_key');

            // Note: 'slug' is typically used for URL-friendly names, if needed.
            if (! Schema::hasColumn('document_templates', 'slug')) {
                $table->string('slug')->nullable()->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropColumn(['mode', 'html_template_key', 'css_overrides']);
            if (Schema::hasColumn('document_templates', 'slug')) {
                $table->dropColumn('slug');
            }
        });
    }
};
