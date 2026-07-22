<?php

namespace Tests\Feature;

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use App\Models\EmailMessage;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmailInboxTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        SubscriptionPlan::create([
            'name' => 'Starter', 'slug' => 'starter', 'price' => 10, 'currency' => 'USD', 'billing_cycle' => 'monthly',
        ]);

        $plan = SubscriptionPlan::where('slug', 'starter')->first();
        $tenant = Tenant::factory()->create([
            'subscription_plan_id' => $plan->id,
            'onboarding_completed' => true,
        ]);
        $this->user = User::factory()->create(['tenant_id' => $tenant->id]);
    }

    public function test_email_inbox_page_is_accessible(): void
    {
        $response = $this->actingAs($this->user)->get(route('email.inbox'));

        $response->assertOk();
    }

    public function test_email_inbox_page_returns_accounts_and_folders(): void
    {
        $account = EmailAccount::create([
            'tenant_id' => $this->user->tenant_id,
            'provider' => 'imap',
            'email' => 'test@broker.com',
            'account_name' => 'Test Broker Email',
            'is_active' => true,
        ]);

        EmailFolder::create([
            'account_id' => $account->id,
            'name' => 'Inbox',
            'remote_id' => 'INBOX',
            'type' => 'inbox',
        ]);

        $response = $this->actingAs($this->user)->get(route('email.inbox'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('email/inbox')
                ->has('accounts', 1)
                ->has('folders', 1)
                ->has('messages')
                ->where('selectedFolderId', null)
                ->where('selectedAccountId', null)
            );
    }

    public function test_email_inbox_page_filters_by_account_and_folder(): void
    {
        $account = EmailAccount::create([
            'tenant_id' => $this->user->tenant_id,
            'provider' => 'imap',
            'email' => 'test@broker.com',
            'is_active' => true,
        ]);

        $folder = EmailFolder::create([
            'account_id' => $account->id,
            'name' => 'Inbox',
            'remote_id' => 'INBOX',
            'type' => 'inbox',
        ]);

        EmailMessage::create([
            'account_id' => $account->id,
            'folder_id' => $folder->id,
            'subject' => 'Test Email',
            'from_address' => 'sender@test.com',
            'to_recipients' => ['test@broker.com'],
            'received_at' => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('email.inbox', ['account_id' => $account->id, 'folder_id' => $folder->id]));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('email/inbox')
                ->where('selectedAccountId', $account->id)
                ->where('selectedFolderId', $folder->id)
                ->has('messages', 1)
            );
    }

    public function test_email_inbox_page_searches_messages(): void
    {
        $account = EmailAccount::create([
            'tenant_id' => $this->user->tenant_id,
            'provider' => 'imap',
            'email' => 'test@broker.com',
            'is_active' => true,
        ]);

        $folder = EmailFolder::create([
            'account_id' => $account->id,
            'name' => 'Inbox',
            'remote_id' => 'INBOX',
            'type' => 'inbox',
        ]);

        EmailMessage::create([
            'account_id' => $account->id,
            'folder_id' => $folder->id,
            'subject' => 'Policy Renewal',
            'from_address' => 'client@test.com',
            'to_recipients' => ['test@broker.com'],
            'received_at' => now(),
        ]);

        EmailMessage::create([
            'account_id' => $account->id,
            'folder_id' => $folder->id,
            'subject' => 'Meeting Reminder',
            'from_address' => 'info@test.com',
            'to_recipients' => ['test@broker.com'],
            'received_at' => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('email.inbox', ['search' => 'Renewal']));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page->has('messages', 1));
    }

    public function test_email_inbox_page_redirects_unauthenticated_users(): void
    {
        $this->get(route('email.inbox'))->assertRedirect(route('login'));
    }
}
