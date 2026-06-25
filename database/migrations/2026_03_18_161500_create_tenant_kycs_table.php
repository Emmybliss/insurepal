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
        Schema::create('tenant_kycs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, verified, rejected
            $table->string('rc_number')->nullable();
            $table->string('naicom_reg_number')->nullable();
            $table->string('tin')->nullable();
            $table->string('incorporation_cert_path')->nullable();
            $table->string('naicom_license_path')->nullable();
            $table->string('prof_indemnity_path')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_kycs');
    }
};
