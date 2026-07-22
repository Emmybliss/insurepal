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
            $table->foreignId('document_template_id')->nullable()->after('certificate_template_id')->constrained('document_templates')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('policy_certificates', 'document_template_id')) {
            return;
        }

        Schema::table('policy_certificates', function (Blueprint $table) {
            $table->dropColumn('document_template_id');
        });
    }
};
