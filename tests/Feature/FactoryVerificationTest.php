<?php

use App\Models\AiMessage;
use App\Models\Conversation;
use App\Models\EmailAccount;
use App\Models\EmailAttachment;
use App\Models\EmailFolder;
use App\Models\EmailMessage;
use App\Models\EmailSignature;
use App\Models\EmailTemplate;
use App\Models\Tenant;
use App\Models\ToolExecution;
use App\Models\User;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
});

it('creates a conversation', function () {
    $conversation = Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
    ]);

    expect($conversation)->toBeInstanceOf(Conversation::class)
        ->and($conversation->title)->not->toBeEmpty()
        ->and($conversation->tenant_id)->toBe($this->tenant->id);
});

it('creates an AI message', function () {
    $conversation = Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
    ]);
    $message = AiMessage::factory()->create([
        'conversation_id' => $conversation->id,
    ]);

    expect($message)->toBeInstanceOf(AiMessage::class)
        ->and($message->role)->toBeIn(['user', 'assistant', 'system'])
        ->and($message->content)->not->toBeEmpty();
});

it('creates a tool execution', function () {
    $conversation = Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
    ]);
    $toolExecution = ToolExecution::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'conversation_id' => $conversation->id,
    ]);

    expect($toolExecution)->toBeInstanceOf(ToolExecution::class)
        ->and($toolExecution->tool_name)->not->toBeEmpty()
        ->and($toolExecution->status)->toBe('completed');
});

it('creates an email account', function () {
    $account = EmailAccount::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    expect($account)->toBeInstanceOf(EmailAccount::class)
        ->and($account->email)->not->toBeEmpty()
        ->and($account->is_active)->toBeTrue();
});

it('creates an email folder', function () {
    $account = EmailAccount::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);
    $folder = EmailFolder::factory()->inbox()->create([
        'account_id' => $account->id,
    ]);

    expect($folder)->toBeInstanceOf(EmailFolder::class)
        ->and($folder->name)->toBe('Inbox')
        ->and($folder->type)->toBe('inbox');
});

it('creates an email message', function () {
    $account = EmailAccount::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);
    $folder = EmailFolder::factory()->inbox()->create([
        'account_id' => $account->id,
    ]);
    $message = EmailMessage::factory()->unread()->flagged()->create([
        'account_id' => $account->id,
        'folder_id' => $folder->id,
    ]);

    expect($message)->toBeInstanceOf(EmailMessage::class)
        ->and($message->subject)->not->toBeEmpty()
        ->and($message->is_read)->toBeFalse()
        ->and($message->is_flagged)->toBeTrue();
});

it('creates an email attachment', function () {
    $account = EmailAccount::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);
    $folder = EmailFolder::factory()->inbox()->create([
        'account_id' => $account->id,
    ]);
    $message = EmailMessage::factory()->create([
        'account_id' => $account->id,
        'folder_id' => $folder->id,
    ]);
    $attachment = EmailAttachment::factory()->inline()->create([
        'message_id' => $message->id,
    ]);

    expect($attachment)->toBeInstanceOf(EmailAttachment::class)
        ->and($attachment->filename)->not->toBeEmpty()
        ->and($attachment->content_id)->not->toBeNull();
});

it('creates an email signature', function () {
    $account = EmailAccount::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);
    $signature = EmailSignature::factory()->default()->create([
        'account_id' => $account->id,
    ]);

    expect($signature)->toBeInstanceOf(EmailSignature::class)
        ->and($signature->is_default)->toBeTrue();
});

it('creates an email template', function () {
    $template = EmailTemplate::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    expect($template)->toBeInstanceOf(EmailTemplate::class)
        ->and($template->name)->not->toBeEmpty()
        ->and($template->category)->not->toBeEmpty();
});

it('creates a conversation with full message chain', function () {
    $conversation = Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
    ]);

    AiMessage::factory()->system()->create(['conversation_id' => $conversation->id]);
    AiMessage::factory()->user()->create(['conversation_id' => $conversation->id]);
    AiMessage::factory()->assistant()->create(['conversation_id' => $conversation->id]);

    expect($conversation->messages)->toHaveCount(3)
        ->and($conversation->messages->pluck('role')->toArray())
        ->toBe(['system', 'user', 'assistant']);
});

it('creates an email account with full email chain', function () {
    $account = EmailAccount::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);
    $inbox = EmailFolder::factory()->inbox()->create(['account_id' => $account->id]);
    $sent = EmailFolder::factory()->sent()->create(['account_id' => $account->id]);

    $inboxMessage = EmailMessage::factory()->create([
        'account_id' => $account->id,
        'folder_id' => $inbox->id,
    ]);
    $sentMessage = EmailMessage::factory()->create([
        'account_id' => $account->id,
        'folder_id' => $sent->id,
    ]);

    EmailAttachment::factory()->count(2)->create(['message_id' => $inboxMessage->id]);
    EmailSignature::factory()->default()->create(['account_id' => $account->id]);

    expect($account->folders)->toHaveCount(2);
    expect($account->messages)->toHaveCount(2);
    expect($inboxMessage->attachments)->toHaveCount(2);
    expect($account->signatures)->toHaveCount(1);
});
