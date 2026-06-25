<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->string('document_type')->default('standard')->after('type');
            $table->json('header_config')->nullable()->after('design_json');
            $table->json('footer_config')->nullable()->after('header_config');
            $table->longText('body_html')->nullable()->after('footer_config');
            $table->json('body_css')->nullable()->after('body_html');
            $table->json('overlay_elements')->nullable()->after('body_css');
            $table->json('placeholder_definitions')->nullable()->after('overlay_elements');
            $table->json('page_settings')->nullable()->after('placeholder_definitions');
            $table->enum('status', ['draft', 'active', 'archived'])->default('draft')->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropColumn([
                'document_type',
                'header_config',
                'footer_config',
                'body_html',
                'body_css',
                'overlay_elements',
                'placeholder_definitions',
                'page_settings',
                'status',
            ]);
        });
    }
};
