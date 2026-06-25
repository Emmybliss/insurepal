<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('remittances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('remittance_number')->unique();
            $table->foreignId('client_bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('insurer_id')->nullable()->constrained('insurance_companies')->nullOnDelete();
            $table->date('remittance_date');
            $table->decimal('total_amount', 18, 2);
            $table->string('currency', 3)->default('NGN');
            $table->string('payment_method');
            $table->string('reference')->nullable();
            $table->string('status')->default('draft');
            $table->text('reversal_reason')->nullable();
            $table->timestamp('reversed_at')->nullable();
            $table->foreignId('reversed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'remittance_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remittances');
    }
};
