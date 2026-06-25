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
        Schema::table('policy_certificates', function (Blueprint $table) {
            $table->string('certificate_image_path')->nullable()->after('file_hash');
            $table->string('certificate_image_name')->nullable()->after('certificate_image_path');
            $table->integer('certificate_image_size')->nullable()->after('certificate_image_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policy_certificates', function (Blueprint $table) {
            $table->dropColumn(['certificate_image_path', 'certificate_image_name', 'certificate_image_size']);
        });
    }
};
