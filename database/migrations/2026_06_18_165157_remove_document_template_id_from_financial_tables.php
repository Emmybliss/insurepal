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
            if (! Schema::hasColumn('invoices', 'document_template_id')) {
                $table->foreignId('document_template_id')->nullable();
                if (Schema::hasTable('document_templates')) {
                    $table->foreign('document_template_id')->references('id')->on('document_templates')->nullOnDelete();
                }
            }
        });

        Schema::table('receipts', function (Blueprint $table) {
            if (! Schema::hasColumn('receipts', 'document_template_id')) {
                $table->foreignId('document_template_id')->nullable();
                if (Schema::hasTable('document_templates')) {
                    $table->foreign('document_template_id')->references('id')->on('document_templates')->nullOnDelete();
                }
            }
        });

        Schema::table('debit_notes', function (Blueprint $table) {
            if (! Schema::hasColumn('debit_notes', 'document_template_id')) {
                $table->foreignId('document_template_id')->nullable();
                if (Schema::hasTable('document_templates')) {
                    $table->foreign('document_template_id')->references('id')->on('document_templates')->nullOnDelete();
                }
            }
        });

        Schema::table('credit_notes', function (Blueprint $table) {
            if (! Schema::hasColumn('credit_notes', 'document_template_id')) {
                $table->foreignId('document_template_id')->nullable();
                if (Schema::hasTable('document_templates')) {
                    $table->foreign('document_template_id')->references('id')->on('document_templates')->nullOnDelete();
                }
            }
        });

        Schema::table('policy_certificates', function (Blueprint $table) {
            if (! Schema::hasColumn('policy_certificates', 'document_template_id')) {
                $table->foreignId('document_template_id')->nullable();
                if (Schema::hasTable('document_templates')) {
                    $table->foreign('document_template_id')->references('id')->on('document_templates')->nullOnDelete();
                }
            }
        });

        Schema::table('broker_slips', function (Blueprint $table) {
            if (! Schema::hasColumn('broker_slips', 'document_template_id')) {
                $table->foreignId('document_template_id')->nullable();
                if (Schema::hasTable('document_templates')) {
                    $table->foreign('document_template_id')->references('id')->on('document_templates')->nullOnDelete();
                }
            }
        });
    }
};
