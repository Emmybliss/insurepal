<?php

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Models\EmailMessage;
use App\Models\EmailSignature;
use App\Models\EmailTemplate;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::create(['name' => 'customer', 'guard_name' => 'web']);

    $this->tenant = Tenant::create([
        'name' => 'Test Broker',
        'type' => 'broker',
        'status' => 'active',
        'onboarding_completed' => true,
        'email' => 'broker@test.com',
    ]);

    app()->instance('tenant', $this->tenant);

    $this->user = User::create([
        'name' => 'Staff User',
        'email' => 'staff@test.com',
        'email_verified_at' => now(),
        'password' => bcrypt('password'),
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $this->token = $this->user->createToken('test-token')->plainTextToken;
    $this->withHeaders(['Authorization' => 'Bearer '.$this->token]);

    $this->account = EmailAccount::create([
        'tenant_id' => $this->tenant->id,
        'provider' => 'imap',
        'email' => 'test@broker.com',
        'account_name' => 'Test Broker Email',
        'is_active' => true,
        'smtp_host' => 'smtp.test.com',
        'smtp_port' => 587,
        'credentials_encrypted' => encrypt(json_encode(['password' => 'secret'])),
    ]);
});

// ─── Authentication ───

test('unauthenticated users cannot access email endpoints', function () {
    $this->withHeaders(['Authorization' => 'Bearer invalid']);

    $this->getJson('/api/v1/email/accounts')->assertStatus(401);
    $this->getJson('/api/v1/email/messages')->assertStatus(401);
    $this->postJson('/api/v1/email/compose', [])->assertStatus(401);
});

// ─── Account CRUD ───

test('can list email accounts', function () {
    EmailAccount::create([
        'tenant_id' => $this->tenant->id,
        'provider' => 'gmail',
        'email' => 'gmail@broker.com',
        'account_name' => 'Gmail',
        'is_active' => true,
    ]);

    $response = $this->getJson('/api/v1/email/accounts');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['id', 'email', 'account_name', 'provider'],
            ],
        ]);

    expect($response->json('data'))->toHaveCount(2);
});

test('can create an email account', function () {
    $response = $this->postJson('/api/v1/email/accounts', [
        'provider' => 'gmail',
        'email' => 'new@broker.com',
        'account_name' => 'New Account',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    expect(EmailAccount::where('email', 'new@broker.com')->exists())->toBeTrue();
});

test('create account validates provider', function () {
    $response = $this->postJson('/api/v1/email/accounts', [
        'provider' => 'invalid',
        'email' => 'test@test.com',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['provider']);
});

test('can show an email account', function () {
    $response = $this->getJson("/api/v1/email/accounts/{$this->account->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $this->account->id);
});

test('cannot show account from another tenant', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherAccount = EmailAccount::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'provider' => 'imap',
        'email' => 'other@broker.com',
        'is_active' => true,
    ]);

    $this->getJson("/api/v1/email/accounts/{$otherAccount->id}")->assertNotFound();
});

test('can delete an email account', function () {
    $response = $this->deleteJson("/api/v1/email/accounts/{$this->account->id}");

    $response->assertOk()
        ->assertJsonPath('message', 'Account disconnected');

    expect(EmailAccount::find($this->account->id))->toBeNull();
});

test('cannot delete account from another tenant', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherAccount = EmailAccount::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'provider' => 'imap',
        'email' => 'other@broker.com',
        'is_active' => true,
    ]);

    $this->deleteJson("/api/v1/email/accounts/{$otherAccount->id}")->assertNotFound();
});

test('can sync an email account', function () {
    $response = $this->postJson("/api/v1/email/accounts/{$this->account->id}/sync");

    $response->assertOk()
        ->assertJsonPath('message', 'Sync queued');
});

test('sync account creates folders for imap', function () {
    $service = app(\App\Services\Email\EmailSyncService::class);
    $service->syncAccount($this->account);

    expect($this->account->folders()->count())->toBe(3);
    expect($this->account->folders()->where('type', 'inbox')->exists())->toBeTrue();
    expect($this->account->folders()->where('type', 'sent')->exists())->toBeTrue();
});

test('sync gmail account fetches messages from api', function () {
    Http::fake([
        '*gmail.googleapis.com/gmail/v1/users/me/messages/msg1*' => Http::response([
            'id' => 'msg1',
            'threadId' => 'thread1',
            'labelIds' => ['INBOX', 'IMPORTANT'],
            'sizeEstimate' => 1024,
            'payload' => [
                'headers' => [
                    ['name' => 'Subject', 'value' => 'Hello World'],
                    ['name' => 'From', 'value' => 'Alice <alice@test.com>'],
                    ['name' => 'To', 'value' => 'bob@test.com'],
                    ['name' => 'Date', 'value' => 'Mon, 01 Jul 2024 10:00:00 +0000'],
                ],
                'mimeType' => 'text/plain',
                'body' => [
                    'data' => 'SGVsbG8gV29ybGQ=',
                ],
            ],
        ]),
        '*gmail.googleapis.com/gmail/v1/users/me/messages*' => Http::response([
            'messages' => [['id' => 'msg1']],
        ]),
    ]);

    $gmailAccount = EmailAccount::create([
        'tenant_id' => $this->tenant->id,
        'provider' => 'gmail',
        'email' => 'test@gmail.com',
        'account_name' => 'Gmail Account',
        'is_active' => true,
        'oauth_token_encrypted' => encrypt('mock-token'),
        'token_expires_at' => now()->addHour(),
    ]);

    $inbox = EmailFolder::create([
        'account_id' => $gmailAccount->id,
        'name' => 'Inbox',
        'remote_id' => 'INBOX',
        'type' => 'inbox',
    ]);

    $service = app(\App\Services\Email\EmailSyncService::class);
    $service->syncFolder($inbox);

    $message = $gmailAccount->messages()->first();
    expect($message->subject)->toBe('Hello World');
    expect($message->from_address)->toBe('alice@test.com');
    expect($message->from_name)->toBe('Alice');
    expect($message->is_read)->toBeTrue();
    expect($message->body_text)->toBe('Hello World');
});

test('sync microsoft365 account fetches messages from graph api', function () {
    Http::fake([
        '*graph.microsoft.com/v1.0/me/mailFolders/inbox/messages*' => Http::response([
            'value' => [
                [
                    'id' => 'ms-msg-1',
                    'conversationId' => 'conv-1',
                    'subject' => 'Meeting',
                    'from' => ['emailAddress' => ['name' => 'Manager', 'address' => 'manager@company.com']],
                    'toRecipients' => [['emailAddress' => ['address' => 'user@company.com']]],
                    'ccRecipients' => [],
                    'body' => ['contentType' => 'text', 'content' => 'Meeting at 3pm'],
                    'receivedDateTime' => '2024-07-01T10:00:00Z',
                    'isRead' => false,
                    'flag' => ['flagStatus' => 'notFlagged'],
                    'size' => 512,
                    'hasAttachments' => false,
                ],
            ],
        ]),
    ]);

    $msAccount = EmailAccount::create([
        'tenant_id' => $this->tenant->id,
        'provider' => 'microsoft365',
        'email' => 'user@company.com',
        'account_name' => 'Work Account',
        'is_active' => true,
        'oauth_token_encrypted' => encrypt('mock-ms-token'),
        'token_expires_at' => now()->addHour(),
    ]);

    $inbox = EmailFolder::create([
        'account_id' => $msAccount->id,
        'name' => 'Inbox',
        'remote_id' => 'inbox',
        'type' => 'inbox',
    ]);

    $service = app(\App\Services\Email\EmailSyncService::class);
    $service->syncFolder($inbox);

    $message = $msAccount->messages()->first();
    expect($message->subject)->toBe('Meeting');
    expect($message->from_address)->toBe('manager@company.com');
    expect($message->from_name)->toBe('Manager');
    expect($message->body_text)->toBe('Meeting at 3pm');
    expect($message->is_read)->toBeFalse();
});

test('sync skips duplicate messages', function () {
    Http::fake([
        '*gmail.googleapis.com/gmail/v1/users/me/messages/dup-1*' => Http::response([
            'id' => 'dup-1',
            'threadId' => 'thread-1',
            'labelIds' => ['INBOX'],
            'sizeEstimate' => 100,
            'payload' => [
                'headers' => [
                    ['name' => 'Subject', 'value' => 'Duplicate'],
                    ['name' => 'From', 'value' => 'test@test.com'],
                    ['name' => 'To', 'value' => 'me@test.com'],
                    ['name' => 'Date', 'value' => 'Mon, 01 Jul 2024 10:00:00 +0000'],
                ],
                'mimeType' => 'text/plain',
                'body' => ['data' => ''],
            ],
        ]),
        '*gmail.googleapis.com/gmail/v1/users/me/messages*' => Http::response([
            'messages' => [['id' => 'dup-1']],
        ]),
    ]);

    $gmailAccount = EmailAccount::create([
        'tenant_id' => $this->tenant->id,
        'provider' => 'gmail',
        'email' => 'dup@test.com',
        'account_name' => 'Dup',
        'is_active' => true,
        'oauth_token_encrypted' => encrypt('token'),
        'token_expires_at' => now()->addHour(),
    ]);

    $inbox = EmailFolder::create([
        'account_id' => $gmailAccount->id,
        'name' => 'Inbox',
        'remote_id' => 'INBOX',
        'type' => 'inbox',
    ]);

    $service = app(\App\Services\Email\EmailSyncService::class);
    $service->syncFolder($inbox);
    $firstCount = $gmailAccount->messages()->count();

    $service->syncFolder($inbox);
    $secondCount = $gmailAccount->messages()->count();

    expect($firstCount)->toBe(1);
    expect($secondCount)->toBe(1);
});

// ─── Folders ───

test('can list folders for an account', function () {
    EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);
    EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Sent', 'remote_id' => 'SENT', 'type' => 'sent']);

    $response = $this->getJson("/api/v1/email/accounts/{$this->account->id}/folders");

    $response->assertOk()
        ->assertJsonStructure(['success', 'data']);
    expect($response->json('data'))->toHaveCount(2);
});

// ─── Messages ───

test('can list messages', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Test Email',
        'from_address' => 'sender@test.com',
        'to_recipients' => ['test@broker.com'],
        'received_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/email/messages');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['id', 'subject', 'from_address', 'received_at'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter messages by account', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Visible',
        'from_address' => 'a@test.com',
        'to_recipients' => ['test@broker.com'],
        'received_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/email/messages?account_id='.$this->account->id);

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter messages by folder', function () {
    $inbox = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);
    $sent = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Sent', 'remote_id' => 'SENT', 'type' => 'sent']);

    EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $inbox->id,
        'subject' => 'Inbox Email',
        'from_address' => 'a@test.com',
        'to_recipients' => ['test@broker.com'],
        'received_at' => now(),
    ]);

    EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $sent->id,
        'subject' => 'Sent Email',
        'from_address' => 'test@broker.com',
        'to_recipients' => ['client@test.com'],
        'received_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/email/messages?folder_id='.$inbox->id);

    expect($response->json('meta.total'))->toBe(1);
});

test('can search messages', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Policy Renewal',
        'from_address' => 'client@test.com',
        'to_recipients' => ['test@broker.com'],
        'body_text' => 'Please renew my policy',
        'received_at' => now(),
    ]);

    EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Meeting Reminder',
        'from_address' => 'info@test.com',
        'to_recipients' => ['test@broker.com'],
        'body_text' => 'Reminder for meeting',
        'received_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/email/messages?search=Renewal');

    expect($response->json('meta.total'))->toBe(1);
});

test('can filter unread messages', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Unread',
        'from_address' => 'a@test.com',
        'to_recipients' => ['test@broker.com'],
        'is_read' => false,
        'received_at' => now(),
    ]);

    EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Read',
        'from_address' => 'b@test.com',
        'to_recipients' => ['test@broker.com'],
        'is_read' => true,
        'received_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/email/messages?unread=1');

    expect($response->json('meta.total'))->toBe(1);
});

test('can show a message and marks it as read', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    $message = EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Test',
        'from_address' => 'a@test.com',
        'to_recipients' => ['test@broker.com'],
        'is_read' => false,
        'received_at' => now(),
    ]);

    $response = $this->getJson("/api/v1/email/messages/{$message->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $message->id);

    expect($message->fresh()->is_read)->toBeTrue();
});

test('cannot show message from another tenant', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherAccount = EmailAccount::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'provider' => 'imap',
        'email' => 'other@broker.com',
        'is_active' => true,
    ]);

    $folder = EmailFolder::create(['account_id' => $otherAccount->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);
    $message = EmailMessage::create([
        'account_id' => $otherAccount->id,
        'folder_id' => $folder->id,
        'subject' => 'Hidden',
        'from_address' => 'a@test.com',
        'to_recipients' => ['other@broker.com'],
        'received_at' => now(),
    ]);

    $this->getJson("/api/v1/email/messages/{$message->id}")->assertForbidden();
});

test('can mark message as read/unread', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    $message = EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Test',
        'from_address' => 'a@test.com',
        'to_recipients' => ['test@broker.com'],
        'is_read' => false,
        'received_at' => now(),
    ]);

    $this->postJson("/api/v1/email/messages/{$message->id}/read", ['read' => true]);
    expect($message->fresh()->is_read)->toBeTrue();

    $this->postJson("/api/v1/email/messages/{$message->id}/read", ['read' => false]);
    expect($message->fresh()->is_read)->toBeFalse();
});

test('can toggle message flag', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    $message = EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Test',
        'from_address' => 'a@test.com',
        'to_recipients' => ['test@broker.com'],
        'is_flagged' => false,
        'received_at' => now(),
    ]);

    $this->postJson("/api/v1/email/messages/{$message->id}/flag");
    expect($message->fresh()->is_flagged)->toBeTrue();

    $this->postJson("/api/v1/email/messages/{$message->id}/flag");
    expect($message->fresh()->is_flagged)->toBeFalse();
});

test('can move a message to a different folder', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);
    $archive = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Archive', 'remote_id' => 'ARCHIVE', 'type' => 'custom']);

    $message = EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Test',
        'from_address' => 'a@test.com',
        'to_recipients' => ['test@broker.com'],
        'received_at' => now(),
    ]);

    $this->postJson("/api/v1/email/messages/{$message->id}/move", [
        'folder_id' => $archive->id,
    ]);

    expect($message->fresh()->folder_id)->toBe($archive->id);
});

test('can batch delete messages', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    $msg1 = EmailMessage::create(['account_id' => $this->account->id, 'folder_id' => $folder->id, 'subject' => 'A', 'from_address' => 'a@test.com', 'to_recipients' => ['t@t.com'], 'received_at' => now()]);
    $msg2 = EmailMessage::create(['account_id' => $this->account->id, 'folder_id' => $folder->id, 'subject' => 'B', 'from_address' => 'b@test.com', 'to_recipients' => ['t@t.com'], 'received_at' => now()]);

    $response = $this->postJson('/api/v1/email/messages/batch', [
        'message_ids' => [$msg1->id, $msg2->id],
        'action' => 'delete',
    ]);

    $response->assertOk();
    expect(EmailMessage::find($msg1->id))->toBeNull();
    expect(EmailMessage::find($msg2->id))->toBeNull();
});

test('can batch mark messages as read', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    $msg1 = EmailMessage::create(['account_id' => $this->account->id, 'folder_id' => $folder->id, 'subject' => 'A', 'from_address' => 'a@test.com', 'to_recipients' => ['t@t.com'], 'is_read' => false, 'received_at' => now()]);
    $msg2 = EmailMessage::create(['account_id' => $this->account->id, 'folder_id' => $folder->id, 'subject' => 'B', 'from_address' => 'b@test.com', 'to_recipients' => ['t@t.com'], 'is_read' => false, 'received_at' => now()]);

    $this->postJson('/api/v1/email/messages/batch', [
        'message_ids' => [$msg1->id, $msg2->id],
        'action' => 'mark_read',
    ]);

    expect($msg1->fresh()->is_read)->toBeTrue();
    expect($msg2->fresh()->is_read)->toBeTrue();
});

test('batch validates action', function () {
    $response = $this->postJson('/api/v1/email/messages/batch', [
        'message_ids' => [1],
        'action' => 'invalid',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['action']);
});

// ─── Compose / Send ───

test('can compose and send an email', function () {
    Mail::fake();
    EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Sent', 'remote_id' => 'SENT', 'type' => 'sent']);

    $response = $this->postJson('/api/v1/email/compose', [
        'account_id' => $this->account->id,
        'to' => 'client@test.com',
        'subject' => 'Test Subject',
        'body_html' => '<p>Test body</p>',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);
});

test('compose requires required fields', function () {
    $response = $this->postJson('/api/v1/email/compose', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['account_id', 'to', 'subject', 'body_html']);
});

test('can reply to a message', function () {
    Mail::fake();
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);
    EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Sent', 'remote_id' => 'SENT', 'type' => 'sent']);

    $message = EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Original',
        'from_address' => 'client@test.com',
        'to_recipients' => ['test@broker.com'],
        'body_html' => '<p>Original message</p>',
        'received_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/email/compose/reply/{$message->id}", [
        'body' => 'Thanks for your email',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);
});

test('can forward a message', function () {
    Mail::fake();
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);
    EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Sent', 'remote_id' => 'SENT', 'type' => 'sent']);

    $message = EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Original',
        'from_address' => 'client@test.com',
        'to_recipients' => ['test@broker.com'],
        'body_html' => '<p>Important document</p>',
        'received_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/email/compose/forward/{$message->id}", [
        'to' => 'other@test.com',
        'body' => 'See attached',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);
});

// ─── Signatures ───

test('can list signatures', function () {
    EmailSignature::create([
        'account_id' => $this->account->id,
        'name' => 'Default',
        'body_html' => '<p>Best regards</p>',
        'is_default' => true,
    ]);

    $response = $this->getJson('/api/v1/email/signatures');

    $response->assertOk()
        ->assertJsonStructure(['success', 'data']);
    expect($response->json('data'))->toHaveCount(1);
});

test('can create a signature', function () {
    $response = $this->postJson('/api/v1/email/signatures', [
        'account_id' => $this->account->id,
        'name' => 'Professional',
        'body_html' => '<p>Best, John</p>',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);
    expect($response->json('data.name'))->toBe('Professional');
});

test('can delete a signature', function () {
    $sig = EmailSignature::create([
        'account_id' => $this->account->id,
        'name' => 'Temp',
        'body_html' => '<p>Temp</p>',
    ]);

    $this->deleteJson("/api/v1/email/signatures/{$sig->id}")->assertOk();
    expect(EmailSignature::find($sig->id))->toBeNull();
});

// ─── Templates ───

test('can list templates', function () {
    EmailTemplate::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Welcome',
        'subject' => 'Welcome to our service',
        'body_html' => '<p>Welcome!</p>',
    ]);

    $response = $this->getJson('/api/v1/email/templates');

    $response->assertOk()
        ->assertJsonStructure(['success', 'data']);
    expect($response->json('data'))->toHaveCount(1);
});

test('can create a template', function () {
    $response = $this->postJson('/api/v1/email/templates', [
        'name' => 'Follow Up',
        'subject' => 'Following up on your quote',
        'body_html' => '<p>Just checking in...</p>',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true);
    expect($response->json('data.name'))->toBe('Follow Up');
});

test('can update a template', function () {
    $template = EmailTemplate::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Old',
        'subject' => 'Old subject',
        'body_html' => '<p>Old</p>',
    ]);

    $response = $this->putJson("/api/v1/email/templates/{$template->id}", [
        'name' => 'Updated',
        'subject' => 'Updated subject',
        'body_html' => '<p>Updated</p>',
    ]);

    $response->assertOk();
    expect($template->fresh()->name)->toBe('Updated');
});

test('can delete a template', function () {
    $template = EmailTemplate::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Temp',
        'subject' => 'Temp',
        'body_html' => '<p>Temp</p>',
    ]);

    $this->deleteJson("/api/v1/email/templates/{$template->id}")->assertOk();
    expect(EmailTemplate::find($template->id))->toBeNull();
});

// ─── Search Endpoint ───

test('can search emails via dedicated search endpoint', function () {
    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    EmailMessage::create([
        'account_id' => $this->account->id,
        'folder_id' => $folder->id,
        'subject' => 'Policy Document',
        'from_address' => 'client@test.com',
        'from_name' => 'John Client',
        'body_text' => 'Find this text',
        'to_recipients' => ['test@broker.com'],
        'received_at' => now(),
    ]);

    $response = $this->getJson('/api/v1/email/search?query=Policy');

    $response->assertOk()
        ->assertJsonStructure(['success', 'data', 'meta']);
    expect($response->json('meta.total'))->toBe(1);
});

test('search validates minimum query length', function () {
    $response = $this->getJson('/api/v1/email/search?query=a');

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['query']);
});

// ─── Tenant Isolation for Messages ───

test('list messages respects tenant isolation', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherAccount = EmailAccount::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'provider' => 'imap',
        'email' => 'other@broker.com',
        'is_active' => true,
    ]);

    $folder = EmailFolder::create(['account_id' => $this->account->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);
    $otherFolder = EmailFolder::create(['account_id' => $otherAccount->id, 'name' => 'Inbox', 'remote_id' => 'INBOX', 'type' => 'inbox']);

    EmailMessage::create(['account_id' => $this->account->id, 'folder_id' => $folder->id, 'subject' => 'Mine', 'from_address' => 'a@t.com', 'to_recipients' => ['t@t.com'], 'received_at' => now()]);
    EmailMessage::create(['account_id' => $otherAccount->id, 'folder_id' => $otherFolder->id, 'subject' => 'Theirs', 'from_address' => 'b@t.com', 'to_recipients' => ['t@t.com'], 'received_at' => now()]);

    $response = $this->getJson('/api/v1/email/messages');

    expect($response->json('meta.total'))->toBe(1);
});
