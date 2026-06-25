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
        Schema::create('debit_notes', function (Blueprint $table) {
            $table->id();
            $table->string('note_number')->unique();
            $table->string('reference_number')->nullable();
            $table->decimal('amount', 12, 2);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->decimal('commission_amount', 12, 2)->default(0);
            $table->text('description');
            $table->text('internal_notes')->nullable();
            $table->enum('status', ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void'])->default('draft');
            $table->enum('payment_status', ['unpaid', 'partially_paid', 'paid'])->default('unpaid');
            $table->date('issue_date')->nullable();
            $table->date('due_date')->nullable();
            $table->datetime('paid_at')->nullable();
            $table->datetime('cancelled_at')->nullable();
            $table->string('cancellation_reason')->nullable();

            // Payment tracking
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('balance_due', 12, 2)->default(0);
            $table->integer('payment_terms_days')->nullable();
            $table->boolean('is_overdue')->default(false);

            // Relations
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('policy_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('broker_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by_id')->constrained('users');
            $table->foreignId('updated_by_id')->nullable()->constrained('users');
            $table->foreignId('cancelled_by_id')->nullable()->constrained('users');

            // Premium breakdown
            $table->json('premium_breakdown')->nullable();
            $table->boolean('is_installment')->default(false);
            $table->integer('installment_number')->nullable();
            $table->integer('total_installments')->nullable();

            // Metadata and tracking
            $table->json('metadata')->nullable();
            $table->json('items')->nullable(); // For itemized debit notes
            $table->string('currency_code', 3)->default('NGN');
            $table->decimal('exchange_rate', 10, 6)->default(1);

            // Reminders and notifications
            $table->json('reminder_history')->nullable();
            $table->datetime('last_reminder_sent_at')->nullable();
            $table->integer('reminders_sent_count')->default(0);

            // Auto-numbering sequence fields
            $table->unsignedBigInteger('sequence_number');
            $table->string('tenant_id')->nullable(); // For multi-tenant setups

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('debit_notes');
    }
};
