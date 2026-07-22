<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('email_accounts')) {
            return;
        }

        Schema::create('email_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('provider');
            $table->string('email');
            $table->string('account_name')->nullable();
            $table->text('credentials_encrypted')->nullable();
            $table->text('oauth_token_encrypted')->nullable();
            $table->text('refresh_token_encrypted')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->string('imap_host')->nullable();
            $table->string('imap_port')->nullable();
            $table->string('smtp_host')->nullable();
            $table->string('smtp_port')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
        });
    }
};
