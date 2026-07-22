<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_entry_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commission_entry_id')->constrained()->cascadeOnDelete();
            $table->string('action');
            $table->decimal('original_amount', 15, 2)->nullable();
            $table->decimal('new_amount', 15, 2)->nullable();
            $table->string('original_transaction_type')->nullable();
            $table->string('new_transaction_type')->nullable();
            $table->foreignId('changed_by')->constrained('users');
            $table->text('reason');
            $table->timestamps();

            $table->index('commission_entry_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_entry_audits');
    }
};
