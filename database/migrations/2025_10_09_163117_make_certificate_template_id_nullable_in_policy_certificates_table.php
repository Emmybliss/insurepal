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
            $table->foreignId('certificate_template_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Delete rows with NULL values that would prevent making the column NOT NULL
        \Illuminate\Support\Facades\DB::table('policy_certificates')->whereNull('certificate_template_id')->delete();

        Schema::table('policy_certificates', function (Blueprint $table) {
            // Check if foreign key exists before dropping
            $foreignKeys = Schema::getForeignKeys('policy_certificates');
            $fkName = 'policy_certificates_certificate_template_id_foreign';

            $fkExists = collect($foreignKeys)->contains(function ($fk) use ($fkName) {
                return $fk['name'] === $fkName;
            });

            if ($fkExists) {
                $table->dropForeign(['certificate_template_id']);
            }

            $table->foreignId('certificate_template_id')->nullable(false)->change();

            if ($fkExists) {
                $table->foreign('certificate_template_id')->references('id')->on('certificate_templates')->onDelete('restrict');
            }
        });
    }
};
