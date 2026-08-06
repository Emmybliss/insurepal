<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            if (Schema::hasColumn('quotes', 'insurance_product_id')) {
                $table->foreignId('insurance_product_id')->nullable()->change();
            }
            if (Schema::hasColumn('quotes', 'coverage_details')) {
                $table->json('coverage_details')->nullable()->change();
            }
            if (Schema::hasColumn('quotes', 'status')) {
                $table->string('status')->default('draft')->change();
            }

            if (! Schema::hasColumn('quotes', 'placement_id')) {
                $table->foreignId('placement_id')->nullable()->constrained()->nullOnDelete();
            }
            if (! Schema::hasColumn('quotes', 'policy_class_id')) {
                $table->foreignId('policy_class_id')->nullable()->constrained()->nullOnDelete();
            }
            if (! Schema::hasColumn('quotes', 'policy_type_id')) {
                $table->foreignId('policy_type_id')->nullable()->constrained()->nullOnDelete();
            }
            if (! Schema::hasColumn('quotes', 'version')) {
                $table->integer('version')->default(1);
            }
            if (! Schema::hasColumn('quotes', 'currency')) {
                $table->string('currency', 3)->default('NGN');
            }
            if (! Schema::hasColumn('quotes', 'sum_insured')) {
                $table->decimal('sum_insured', 18, 2)->default(0);
            }
            if (! Schema::hasColumn('quotes', 'rate')) {
                $table->decimal('rate', 10, 4)->nullable();
            }
            if (! Schema::hasColumn('quotes', 'rate_basis')) {
                $table->string('rate_basis')->nullable();
            }
            if (! Schema::hasColumn('quotes', 'gross_premium')) {
                $table->decimal('gross_premium', 18, 2)->default(0);
            }
            if (! Schema::hasColumn('quotes', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)->nullable();
            }
            if (! Schema::hasColumn('quotes', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->nullable();
            }
            if (! Schema::hasColumn('quotes', 'taxes')) {
                $table->decimal('taxes', 18, 2)->nullable();
            }
            if (! Schema::hasColumn('quotes', 'fees')) {
                $table->decimal('fees', 18, 2)->nullable();
            }
            if (! Schema::hasColumn('quotes', 'discount')) {
                $table->decimal('discount', 18, 2)->nullable();
            }
            if (! Schema::hasColumn('quotes', 'net_premium')) {
                $table->decimal('net_premium', 18, 2)->default(0);
            }
            if (! Schema::hasColumn('quotes', 'period_start')) {
                $table->date('period_start')->nullable();
            }
            if (! Schema::hasColumn('quotes', 'period_end')) {
                $table->date('period_end')->nullable();
            }
            if (! Schema::hasColumn('quotes', 'claim_payment_condition')) {
                $table->text('claim_payment_condition')->nullable();
            }
            if (! Schema::hasColumn('quotes', 'issued_at')) {
                $table->timestamp('issued_at')->nullable();
            }
            if (! Schema::hasColumn('quotes', 'issued_by')) {
                $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('quotes', 'reviewed_by')) {
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('quotes', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('quotes', 'signed_by')) {
                $table->foreignId('signed_by')->nullable()->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('quotes', 'pdf_path')) {
                $table->string('pdf_path')->nullable();
            }
            if (! Schema::hasColumn('quotes', 'checksum')) {
                $table->string('checksum', 64)->nullable();
            }
            if (! Schema::hasColumn('quotes', 'snapshot_json')) {
                $table->json('snapshot_json')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            // Soft reverse
        });
    }
};
