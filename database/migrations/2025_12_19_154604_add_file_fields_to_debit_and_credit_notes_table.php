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
        Schema::table('debit_notes', function (Blueprint $table) {
            if (! Schema::hasColumn('debit_notes', 'file_path')) {
                $table->string('file_path')->nullable()->after('status');
            }
            if (! Schema::hasColumn('debit_notes', 'file_name')) {
                $table->string('file_name')->nullable()->after('file_path');
            }
            if (! Schema::hasColumn('debit_notes', 'file_size')) {
                $table->integer('file_size')->nullable()->after('file_name');
            }
            if (! Schema::hasColumn('debit_notes', 'file_hash')) {
                $table->string('file_hash')->nullable()->after('file_size');
            }
            if (! Schema::hasColumn('debit_notes', 'generated_at')) {
                $table->timestamp('generated_at')->nullable()->after('file_hash');
            }
        });

        Schema::table('credit_notes', function (Blueprint $table) {
            if (! Schema::hasColumn('credit_notes', 'file_path')) {
                $table->string('file_path')->nullable()->after('status');
            }
            if (! Schema::hasColumn('credit_notes', 'file_name')) {
                $table->string('file_name')->nullable()->after('file_path');
            }
            if (! Schema::hasColumn('credit_notes', 'file_size')) {
                $table->integer('file_size')->nullable()->after('file_name');
            }
            if (! Schema::hasColumn('credit_notes', 'file_hash')) {
                $table->string('file_hash')->nullable()->after('file_size');
            }
            if (! Schema::hasColumn('credit_notes', 'generated_at')) {
                $table->timestamp('generated_at')->nullable()->after('file_hash');
            }
            // Adding other missing fields spotted in DebitNote migration
            if (! Schema::hasColumn('credit_notes', 'type')) {
                $table->string('type')->default('standard')->after('status');
            }
            if (! Schema::hasColumn('credit_notes', 'document_template_id')) {
                $table->foreignId('document_template_id')->nullable()->constrained('document_templates')->nullOnDelete()->after('policy_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('debit_notes', function (Blueprint $table) {
            $columns = ['file_path', 'file_name', 'file_size', 'file_hash', 'generated_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('debit_notes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('credit_notes', function (Blueprint $table) {
            // Check if foreign key exists before dropping
            $foreignKeys = Schema::getForeignKeys('credit_notes');
            $fkExists = collect($foreignKeys)->contains(function ($fk) {
                return $fk['name'] === 'credit_notes_document_template_id_foreign';
            });

            if ($fkExists) {
                $table->dropForeign(['document_template_id']);
            }

            $columns = ['file_path', 'file_name', 'file_size', 'file_hash', 'generated_at', 'type', 'document_template_id'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('credit_notes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
