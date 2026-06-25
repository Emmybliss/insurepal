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
            $table->string('header_image')->nullable()->after('custom_content');
            $table->string('footer_image')->nullable()->after('header_image');
            $table->string('signature')->nullable()->after('footer_image');
            $table->string('stamp')->nullable()->after('signature');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_template_overrides', function (Blueprint $table) {
            $table->dropColumn(['header_image', 'footer_image', 'signature', 'stamp']);
        });
    }
};
