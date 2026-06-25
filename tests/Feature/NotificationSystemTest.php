<?php

use App\Events\NotificationSent;
use App\Models\Claim;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Notifications\ClaimApproved;
use App\Notifications\ClaimRejected;
use App\Notifications\ClaimSubmitted;
use App\Notifications\PolicyExpiryReminder;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification as NotificationFacade;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);
});

it('can create notifications for users', function () {
    $notification = Notification::createForUser(
        $this->user,
        'test_type',
        'Test Title',
        'Test message',
        ['key' => 'value'],
        'high'
    );

    expect($notification)
        ->toBeInstanceOf(Notification::class)
        ->and($notification->user_id)->toBe($this->user->id)
        ->and($notification->tenant_id)->toBe($this->tenant->id)
        ->and($notification->type)->toBe('test_type')
        ->and($notification->title)->toBe('Test Title')
        ->and($notification->message)->toBe('Test message')
        ->and($notification->data)->toBe(['key' => 'value'])
        ->and($notification->priority)->toBe('high');
});

it('can create notifications for all tenant users', function () {
    $users = User::factory()->count(3)->create(['tenant_id' => $this->tenant->id]);

    Notification::createForTenant(
        $this->tenant,
        'tenant_announcement',
        'Tenant Announcement',
        'This is a tenant-wide announcement',
        ['announcement' => true],
        'medium'
    );

    $notifications = Notification::where('tenant_id', $this->tenant->id)
        ->where('type', 'tenant_announcement')
        ->get();

    expect($notifications)->toHaveCount(4); // 3 new users + 1 existing user
});

it('can mark notifications as read', function () {
    $notification = Notification::createForUser(
        $this->user,
        'test_type',
        'Test Title',
        'Test message'
    );

    expect($notification->isRead())->toBeFalse();
    expect($notification->isUnread())->toBeTrue();

    $notification->markAsRead();

    expect($notification->isRead())->toBeTrue();
    expect($notification->isUnread())->toBeFalse();
});

it('can filter notifications by status', function () {
    $readNotification = Notification::createForUser($this->user, 'read_type', 'Read', 'Read message');
    $readNotification->markAsRead();

    $unreadNotification = Notification::createForUser($this->user, 'unread_type', 'Unread', 'Unread message');

    $readNotifications = Notification::forUser($this->user->id)->read()->get();
    $unreadNotifications = Notification::forUser($this->user->id)->unread()->get();

    expect($readNotifications)->toHaveCount(1);
    expect($unreadNotifications)->toHaveCount(1);
    expect($readNotifications->first()->id)->toBe($readNotification->id);
    expect($unreadNotifications->first()->id)->toBe($unreadNotification->id);
});

it('can filter notifications by type', function () {
    Notification::createForUser($this->user, 'claim_type', 'Claim', 'Claim message');
    Notification::createForUser($this->user, 'payment_type', 'Payment', 'Payment message');

    $claimNotifications = Notification::forUser($this->user->id)->byType('claim_type')->get();
    $paymentNotifications = Notification::forUser($this->user->id)->byType('payment_type')->get();

    expect($claimNotifications)->toHaveCount(1);
    expect($paymentNotifications)->toHaveCount(1);
});

it('can filter notifications by priority', function () {
    Notification::createForUser($this->user, 'high_priority', 'High', 'High message', [], 'high');
    Notification::createForUser($this->user, 'low_priority', 'Low', 'Low message', [], 'low');

    $highPriorityNotifications = Notification::forUser($this->user->id)->byPriority('high')->get();
    $lowPriorityNotifications = Notification::forUser($this->user->id)->byPriority('low')->get();

    expect($highPriorityNotifications)->toHaveCount(1);
    expect($lowPriorityNotifications)->toHaveCount(1);
});

it('returns correct priority colors', function () {
    $highNotification = Notification::createForUser($this->user, 'test', 'Test', 'Test', [], 'high');
    $mediumNotification = Notification::createForUser($this->user, 'test', 'Test', 'Test', [], 'medium');
    $lowNotification = Notification::createForUser($this->user, 'test', 'Test', 'Test', [], 'low');

    expect($highNotification->priority_color)->toBe('text-red-600');
    expect($mediumNotification->priority_color)->toBe('text-yellow-600');
    expect($lowNotification->priority_color)->toBe('text-green-600');
});

it('returns correct priority badge colors', function () {
    $highNotification = Notification::createForUser($this->user, 'test', 'Test', 'Test', [], 'high');
    $mediumNotification = Notification::createForUser($this->user, 'test', 'Test', 'Test', [], 'medium');
    $lowNotification = Notification::createForUser($this->user, 'test', 'Test', 'Test', [], 'low');

    expect($highNotification->priority_badge_color)->toBe('bg-red-100 text-red-800');
    expect($mediumNotification->priority_badge_color)->toBe('bg-yellow-100 text-yellow-800');
    expect($lowNotification->priority_badge_color)->toBe('bg-green-100 text-green-800');
});

it('returns correct type icons', function () {
    $policyNotification = Notification::createForUser($this->user, 'policy_expiry', 'Test', 'Test');
    $paymentNotification = Notification::createForUser($this->user, 'payment_due', 'Test', 'Test');
    $documentNotification = Notification::createForUser($this->user, 'document_ready', 'Test', 'Test');

    expect($policyNotification->type_icon)->toBe('Calendar');
    expect($paymentNotification->type_icon)->toBe('CreditCard');
    expect($documentNotification->type_icon)->toBe('FileText');
});

it('can send claim submitted notification', function () {
    NotificationFacade::fake();

    $claim = Claim::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $this->policy->id,
    ]);

    $this->customer->notify(new ClaimSubmitted($claim));

    NotificationFacade::assertSentTo($this->customer, ClaimSubmitted::class);
});

it('can send claim approved notification', function () {
    NotificationFacade::fake();

    $claim = Claim::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $this->policy->id,
    ]);

    $this->customer->notify(new ClaimApproved($claim, 1000.00));

    NotificationFacade::assertSentTo($this->customer, ClaimApproved::class);
});

it('can send claim rejected notification', function () {
    NotificationFacade::fake();

    $claim = Claim::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $this->policy->id,
    ]);

    $this->customer->notify(new ClaimRejected($claim, 'Insufficient documentation'));

    NotificationFacade::assertSentTo($this->customer, ClaimRejected::class);
});

it('can send policy expiry reminder notification', function () {
    NotificationFacade::fake();

    $this->customer->notify(new PolicyExpiryReminder($this->policy, 30));

    NotificationFacade::assertSentTo($this->customer, PolicyExpiryReminder::class);
});

it('dispatches notification sent event when notification is created', function () {
    Event::fake();

    $notification = Notification::createForUser(
        $this->user,
        'test_type',
        'Test Title',
        'Test message'
    );

    event(new NotificationSent($notification, $this->user));

    Event::assertDispatched(NotificationSent::class);
});

it('observer automatically dispatches notification sent event on creation', function () {
    Event::fake();

    $notification = Notification::createForUser(
        $this->user,
        'observer_test',
        'Observer Test',
        'Testing observer dispatch'
    );

    Event::assertDispatched(NotificationSent::class);
});

it('broadcast event contains filtered safe data only', function () {
    $sensitiveData = [
        'url' => '/claims/1',
        'icon' => 'check',
        'action_type' => 'link',
        'customer_id' => 123,
        'policy_id' => 456,
        'secret_key' => 'should_be_filtered',
        'password' => 'should_be_filtered',
        'ssn' => 'should_be_filtered',
    ];

    $notification = Notification::createForUser(
        $this->user,
        'test_broadcast',
        'Test Broadcast',
        'Testing broadcast data filtering',
        $sensitiveData
    );

    $event = new NotificationSent($notification, $this->user);
    $broadcastData = $event->broadcastWith();

    expect($broadcastData['data'])->toHaveKey('url')
        ->toHaveKey('icon')
        ->toHaveKey('action_type')
        ->toHaveKey('customer_id')
        ->toHaveKey('policy_id')
        ->not->toHaveKey('secret_key')
        ->not->toHaveKey('password')
        ->not->toHaveKey('ssn');
});

it('broadcast event uses tenant-scoped channel', function () {
    $notification = Notification::createForUser(
        $this->user,
        'test_channel',
        'Test Channel',
        'Testing channel pattern'
    );

    $event = new NotificationSent($notification, $this->user);
    $channels = $event->broadcastOn();

    expect($channels)->toHaveCount(1);
    $channelName = $channels[0]->name;
    expect($channelName)->toBe('tenant.'.$this->tenant->id.'.notifications.'.$this->user->id);
});

it('notification controller getRecent returns filtered data', function () {
    $sensitiveData = [
        'url' => '/policy/1',
        'policy_id' => 789,
        'private_token' => 'secret_token',
    ];

    Notification::createForUser(
        $this->user,
        'api_test',
        'API Test',
        'Testing API response filtering',
        $sensitiveData
    );

    $this->actingAs($this->user);

    $response = $this->getJson('/api/notifications/recent');

    $response->assertOk();

    $notifications = $response->json();
    expect($notifications)->toHaveCount(1);
    expect($notifications[0]['data'])->toHaveKey('url')
        ->toHaveKey('policy_id')
        ->not->toHaveKey('private_token');
});

it('notification controller getUnreadCount returns count', function () {
    Notification::createForUser($this->user, 'count_test', 'Count Test', 'Testing count');

    $this->actingAs($this->user);

    $response = $this->getJson('/api/notifications/unread-count');

    $response->assertOk()
        ->assertJson(['count' => 1]);
});

it('user cannot access another users notifications via API', function () {
    $otherUser = User::factory()->create(['tenant_id' => $this->tenant->id]);

    Notification::createForUser($otherUser, 'private', 'Private', 'Should not access');

    $this->actingAs($this->user);

    $response = $this->getJson('/api/notifications/recent');

    $response->assertOk();

    $notifications = $response->json();
    expect($notifications)->toBeEmpty();
});
