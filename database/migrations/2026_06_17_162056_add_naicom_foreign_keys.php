<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->foreign('client_bank_account_id')
                ->references('id')
                ->on('client_bank_accounts')
                ->nullOnDelete();
        });

        Schema::table('naicom_report_lines', function (Blueprint $table) {
            $table->foreign('adjustment_id')
                ->references('id')
                ->on('naicom_adjustments')
                ->nullOnDelete();
        });

        Schema::table('naicom_adjustments', function (Blueprint $table) {
            $table->foreign('report_line_id')
                ->references('id')
                ->on('naicom_report_lines')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropForeign(['client_bank_account_id']);
        });

        Schema::table('naicom_report_lines', function (Blueprint $table) {
            $table->dropForeign(['adjustment_id']);
        });

        Schema::table('naicom_adjustments', function (Blueprint $table) {
            $table->dropForeign(['report_line_id']);
        });
    }
};
