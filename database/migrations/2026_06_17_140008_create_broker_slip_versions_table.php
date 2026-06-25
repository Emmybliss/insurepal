<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('broker_slip_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('broker_slip_id')->constrained()->cascadeOnDelete();
            $table->integer('version');
            $table->json('snapshot_json');
            $table->string('pdf_path')->nullable();
            $table->string('checksum', 64);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['broker_slip_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broker_slip_versions');
    }
};
