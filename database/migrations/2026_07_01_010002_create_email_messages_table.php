<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('email_messages')) {
            return;
        }

        Schema::create('email_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('email_accounts')->cascadeOnDelete();
            $table->foreignId('folder_id')->constrained('email_folders')->cascadeOnDelete();
            $table->string('message_id_remote')->nullable()->index();
            $table->string('thread_id')->nullable()->index();
            $table->string('subject')->nullable();
            $table->longText('body_html')->nullable();
            $table->longText('body_text')->nullable();
            $table->string('from_address');
            $table->string('from_name')->nullable();
            $table->json('to_recipients');
            $table->json('cc_recipients')->nullable();
            $table->json('bcc_recipients')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->boolean('is_read')->default(false);
            $table->boolean('is_flagged')->default(false);
            $table->boolean('is_draft')->default(false);
            $table->unsignedInteger('size')->default(0);
            $table->string('in_reply_to')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'folder_id', 'received_at']);

            if (Schema::getConnection()->getDriverName() !== 'sqlite') {
                $table->fullText(['subject', 'body_text', 'from_address'], 'email_messages_ft');
            }
        });
    }
};
