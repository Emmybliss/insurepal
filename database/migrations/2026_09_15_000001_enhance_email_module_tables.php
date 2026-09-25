<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Enhance email_accounts table
        if (Schema::hasTable('email_accounts')) {
            Schema::table('email_accounts', function (Blueprint $table) {
                if (! Schema::hasColumn('email_accounts', 'sync_status')) {
                    $table->string('sync_status')->default('idle')->after('is_active');
                }
                if (! Schema::hasColumn('email_accounts', 'sync_error')) {
                    $table->text('sync_error')->nullable()->after('sync_status');
                }
                if (! Schema::hasColumn('email_accounts', 'delta_token')) {
                    $table->text('delta_token')->nullable()->after('sync_error');
                }
                if (! Schema::hasColumn('email_accounts', 'imap_encryption')) {
                    $table->string('imap_encryption')->nullable()->default('ssl')->after('imap_port');
                }
                if (! Schema::hasColumn('email_accounts', 'smtp_encryption')) {
                    $table->string('smtp_encryption')->nullable()->default('tls')->after('smtp_port');
                }
                if (! Schema::hasColumn('email_accounts', 'test_status')) {
                    $table->string('test_status')->nullable()->after('delta_token');
                }
                if (! Schema::hasColumn('email_accounts', 'test_error')) {
                    $table->text('test_error')->nullable()->after('test_status');
                }
            });
        }

        // 2. Create email_threads table if it doesn't exist
        if (! Schema::hasTable('email_threads')) {
            Schema::create('email_threads', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
                $table->foreignId('account_id')->nullable()->constrained('email_accounts')->nullOnDelete();
                $table->string('subject')->nullable();
                $table->string('subject_normalized')->nullable()->index();
                $table->timestamp('first_message_at')->nullable();
                $table->timestamp('last_message_at')->nullable()->index();
                $table->json('participant_addresses')->nullable();
                $table->string('status')->default('open')->index(); // open, archived, trash
                $table->boolean('is_unread')->default(true);
                $table->string('related_type')->nullable();
                $table->unsignedBigInteger('related_id')->nullable();

                // Direct entity foreign keys for fast querying
                $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
                $table->foreignId('policy_id')->nullable()->constrained('policies')->nullOnDelete();
                $table->foreignId('claim_id')->nullable()->constrained('claims')->nullOnDelete();
                $table->foreignId('quote_id')->nullable()->constrained('quotes')->nullOnDelete();
                $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();

                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'status']);
                $table->index(['tenant_id', 'last_message_at']);
                $table->index(['related_type', 'related_id']);
            });
        }

        // 3. Enhance email_messages table
        if (Schema::hasTable('email_messages')) {
            Schema::table('email_messages', function (Blueprint $table) {
                if (! Schema::hasColumn('email_messages', 'email_thread_id')) {
                    $table->foreignId('email_thread_id')->nullable()->after('folder_id')->constrained('email_threads')->nullOnDelete();
                }
                if (! Schema::hasColumn('email_messages', 'message_id_header')) {
                    $table->string('message_id_header')->nullable()->index()->after('message_id_remote');
                }
                if (! Schema::hasColumn('email_messages', 'references')) {
                    $table->json('references')->nullable()->after('in_reply_to');
                }
                if (! Schema::hasColumn('email_messages', 'raw_headers')) {
                    $table->json('raw_headers')->nullable()->after('references');
                }
                if (! Schema::hasColumn('email_messages', 'uid')) {
                    $table->unsignedBigInteger('uid')->nullable()->index()->after('message_id_header');
                }
                if (! Schema::hasColumn('email_messages', 'customer_id')) {
                    $table->foreignId('customer_id')->nullable()->after('email_thread_id')->constrained('customers')->nullOnDelete();
                }
                if (! Schema::hasColumn('email_messages', 'policy_id')) {
                    $table->foreignId('policy_id')->nullable()->after('customer_id')->constrained('policies')->nullOnDelete();
                }
                if (! Schema::hasColumn('email_messages', 'claim_id')) {
                    $table->foreignId('claim_id')->nullable()->after('policy_id')->constrained('claims')->nullOnDelete();
                }
                if (! Schema::hasColumn('email_messages', 'quote_id')) {
                    $table->foreignId('quote_id')->nullable()->after('claim_id')->constrained('quotes')->nullOnDelete();
                }
                if (! Schema::hasColumn('email_messages', 'invoice_id')) {
                    $table->foreignId('invoice_id')->nullable()->after('quote_id')->constrained('invoices')->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('email_messages')) {
            Schema::table('email_messages', function (Blueprint $table) {
                if (Schema::hasColumn('email_messages', 'email_thread_id')) {
                    $table->dropForeign(['email_thread_id']);
                    $table->dropColumn('email_thread_id');
                }
                if (Schema::hasColumn('email_messages', 'customer_id')) {
                    $table->dropForeign(['customer_id']);
                    $table->dropColumn('customer_id');
                }
                if (Schema::hasColumn('email_messages', 'policy_id')) {
                    $table->dropForeign(['policy_id']);
                    $table->dropColumn('policy_id');
                }
                if (Schema::hasColumn('email_messages', 'claim_id')) {
                    $table->dropForeign(['claim_id']);
                    $table->dropColumn('claim_id');
                }
                if (Schema::hasColumn('email_messages', 'quote_id')) {
                    $table->dropForeign(['quote_id']);
                    $table->dropColumn('quote_id');
                }
                if (Schema::hasColumn('email_messages', 'invoice_id')) {
                    $table->dropForeign(['invoice_id']);
                    $table->dropColumn('invoice_id');
                }
                $columnsToDrop = array_filter(['message_id_header', 'references', 'raw_headers', 'uid'], function ($col) {
                    return Schema::hasColumn('email_messages', $col);
                });
                if (! empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }

        Schema::dropIfExists('email_threads');

        if (Schema::hasTable('email_accounts')) {
            Schema::table('email_accounts', function (Blueprint $table) {
                $columnsToDrop = array_filter(['sync_status', 'sync_error', 'delta_token', 'imap_encryption', 'smtp_encryption', 'test_status', 'test_error'], function ($col) {
                    return Schema::hasColumn('email_accounts', $col);
                });
                if (! empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }
};
