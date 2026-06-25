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
            // Certificate-specific fields
            $table->string('certificate_type')->nullable()->after('type');
            $table->string('page_size')->default('A4')->after('certificate_type');
            $table->string('orientation')->default('portrait')->after('page_size');
            $table->boolean('include_watermark')->default(false)->after('orientation');
            $table->string('watermark_text')->nullable()->after('include_watermark');
            $table->boolean('include_barcode')->default(true)->after('watermark_text');
            $table->boolean('include_qr_code')->default(true)->after('include_barcode');
            $table->boolean('include_seal')->default(true)->after('include_qr_code');
            $table->boolean('include_signatures')->default(true)->after('include_seal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_templates', function (Blueprint $table) {
            $table->dropColumn([
                'certificate_type',
                'page_size',
                'orientation',
                'include_watermark',
                'watermark_text',
                'include_barcode',
                'include_qr_code',
                'include_seal',
                'include_signatures',
            ]);
        });
    }
};
