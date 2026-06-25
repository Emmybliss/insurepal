<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['document_template_id']);
            $table->dropColumn('document_template_id');
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->dropForeign(['document_template_id']);
            $table->dropColumn('document_template_id');
        });

        Schema::table('debit_notes', function (Blueprint $table) {
            $table->dropForeign(['document_template_id']);
            $table->dropColumn('document_template_id');
        });

        Schema::table('credit_notes', function (Blueprint $table) {
            $table->dropForeign(['document_template_id']);
            $table->dropColumn('document_template_id');
        });

        Schema::table('policy_certificates', function (Blueprint $table) {
            $table->dropForeign(['document_template_id']);
            $table->dropColumn('document_template_id');
        });

        Schema::table('broker_slips', function (Blueprint $table) {
            $table->dropForeign(['document_template_id']);
            $table->dropColumn('document_template_id');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained('document_templates')->nullOnDelete();
        });

        Schema::table('receipts', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained('document_templates')->nullOnDelete();
        });

        Schema::table('debit_notes', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained('document_templates')->nullOnDelete();
        });

        Schema::table('credit_notes', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained('document_templates')->nullOnDelete();
        });

        Schema::table('policy_certificates', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained('document_templates')->nullOnDelete();
        });

        Schema::table('broker_slips', function (Blueprint $table) {
            $table->foreignId('document_template_id')->nullable()->constrained('document_templates')->nullOnDelete();
        });
    }
};
