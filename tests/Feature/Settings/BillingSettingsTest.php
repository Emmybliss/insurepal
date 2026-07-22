<?php

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PaymentReceiptService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create([
        'status' => 'active',
        'onboarding_completed' => true,
    ]);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $this->subscriptionPlan = SubscriptionPlan::create([
        'name' => 'Professional',
        'slug' => 'professional',
        'description' => 'Professional plan',
        'price' => 50000,
        'currency' => 'NGN',
        'billing_cycle' => 'monthly',
        'is_active' => true,
        'sort_order' => 1,
        'features' => ['feature_a', 'feature_b'],
        'max_users' => 10,
        'max_policies' => 100,
    ]);

    $this->subscription = Subscription::create([
        'tenant_id' => $this->tenant->id,
        'subscription_plan_id' => $this->subscriptionPlan->id,
        'status' => 'active',
        'billing_cycle' => 'monthly',
        'current_period_start' => now()->subMonth(),
        'current_period_end' => now()->addMonth(),
    ]);
});

// ─── Index ───

test('can view billing page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.billing'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/billing')
        ->has('tenant')
        ->has('currentPlan')
        ->has('availablePlans')
        ->has('paymentHistory')
        ->has('plans')
    );
});

test('shows current active subscription', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.billing'));

    $response->assertInertia(fn ($page) => $page
        ->where('currentPlan.id', $this->subscriptionPlan->id)
        ->where('currentPlan.name', 'Professional')
    );
});

test('shows available plans', function () {
    SubscriptionPlan::create([
        'name' => 'Basic',
        'slug' => 'basic',
        'price' => 10000,
        'currency' => 'NGN',
        'billing_cycle' => 'monthly',
        'is_active' => true,
        'sort_order' => 0,
        'features' => [],
    ]);

    $this->actingAs($this->user);

    $response = $this->get(route('settings.billing'));

    $response->assertInertia(fn ($page) => $page
        ->has('availablePlans', 2)
        ->has('plans', 2)
    );
});

test('shows payment history', function () {
    Payment::create([
        'tenant_id' => $this->tenant->id,
        'reference' => 'PAY-001',
        'amount' => 50000,
        'currency' => 'NGN',
        'type' => 'subscription',
        'status' => 'completed',
        'paid_at' => now(),
    ]);

    $this->actingAs($this->user);

    $response = $this->get(route('settings.billing'));

    $response->assertInertia(fn ($page) => $page
        ->has('paymentHistory', 1)
    );
});

test('shows null current plan when no active subscription', function () {
    $this->subscription->update(['status' => 'cancelled']);

    $this->actingAs($this->user);

    $response = $this->get(route('settings.billing'));

    $response->assertInertia(fn ($page) => $page
        ->where('currentPlan', null)
    );
});

// ─── Change Plan ───

test('can change plan with valid plan id', function () {
    Config::set('services.paystack.secret_key', 'sk_test_mock_key_for_testing');
    $this->tenant->update(['paystack_customer_code' => 'CUS_test123']);

    $newPlan = SubscriptionPlan::create([
        'name' => 'Enterprise',
        'slug' => 'enterprise',
        'price' => 150000,
        'currency' => 'NGN',
        'billing_cycle' => 'monthly',
        'is_active' => true,
        'sort_order' => 2,
        'features' => ['all'],
    ]);

    $this->actingAs($this->user);

    $response = $this->withHeader('X-Inertia', 'true')->post(route('settings.billing.change-plan'), [
        'plan_id' => $newPlan->id,
        'billing_cycle' => 'monthly',
    ]);

    // Should redirect to Paystack checkout (Inertia::location)
    $response->assertStatus(409);
    $response->assertHeader('X-Inertia-Location');

    $this->tenant->refresh();
    expect($this->tenant->subscription_plan_id)->toBe($newPlan->id);
});

test('validates plan id is required for change plan', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('settings.billing.change-plan'), []);

    $response->assertSessionHasErrors(['plan_id']);
});

test('validates plan id exists', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('settings.billing.change-plan'), [
        'plan_id' => 99999,
    ]);

    $response->assertSessionHasErrors(['plan_id']);
});

// ─── Cancel Subscription ───

test('can cancel active subscription', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('settings.billing.cancel'));

    $response->assertSessionHas('success');

    $this->subscription->refresh();
    expect($this->subscription->status)->toBe('cancelled');
    expect($this->subscription->cancelled_at)->not->toBeNull();

    $this->tenant->refresh();
    expect($this->tenant->status)->toBe('suspended');
});

test('cancel deletes old cancelled subscriptions before updating', function () {
    Subscription::create([
        'tenant_id' => $this->tenant->id,
        'subscription_plan_id' => $this->subscriptionPlan->id,
        'status' => 'cancelled',
        'billing_cycle' => 'monthly',
        'cancelled_at' => now()->subMonth(),
    ]);

    $this->actingAs($this->user);

    $this->post(route('settings.billing.cancel'));

    $cancelledCount = Subscription::where('tenant_id', $this->tenant->id)
        ->where('status', 'cancelled')
        ->count();

    expect($cancelledCount)->toBe(1);
});

test('cancel is idempotent when no active subscription', function () {
    $this->subscription->update(['status' => 'cancelled']);

    $this->actingAs($this->user);

    $response = $this->post(route('settings.billing.cancel'));

    $response->assertSessionHas('success');
});

// ─── Download Receipt ───

test('can download receipt for own subscription', function () {
    $mockService = Mockery::mock(PaymentReceiptService::class);
    $mockService->shouldReceive('generateReceipt')
        ->once()
        ->andReturn(response('fake-pdf-content', 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="receipt-test.pdf"',
        ]));

    $this->instance(PaymentReceiptService::class, $mockService);
    $this->actingAs($this->user);

    $response = $this->get(route('settings.billing.download-receipt', [
        'subscriptionId' => $this->subscription->id,
    ]));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('cannot download receipt for other tenants subscription', function () {
    $otherTenant = Tenant::factory()->create(['status' => 'active']);
    $otherSubscription = Subscription::create([
        'tenant_id' => $otherTenant->id,
        'subscription_plan_id' => $this->subscriptionPlan->id,
        'status' => 'active',
        'billing_cycle' => 'monthly',
    ]);

    $this->actingAs($this->user);

    $response = $this->get(route('settings.billing.download-receipt', [
        'subscriptionId' => $otherSubscription->id,
    ]));

    $response->assertNotFound();
});

test('can preview receipt as json', function () {
    $mockService = Mockery::mock(PaymentReceiptService::class);
    $mockService->shouldReceive('getReceiptData')
        ->once()
        ->andReturn([
            'receipt_number' => 'RCP-TEST',
            'plan_name' => 'Professional',
            'amount' => 50000,
        ]);

    $this->instance(PaymentReceiptService::class, $mockService);
    $this->actingAs($this->user);

    $response = $this->get(route('settings.billing.preview-receipt', [
        'subscriptionId' => $this->subscription->id,
    ]));

    $response->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('data.receipt_number', 'RCP-TEST');
});

test('cannot preview receipt for other tenants subscription', function () {
    $otherTenant = Tenant::factory()->create(['status' => 'active']);
    $otherSubscription = Subscription::create([
        'tenant_id' => $otherTenant->id,
        'subscription_plan_id' => $this->subscriptionPlan->id,
        'status' => 'active',
        'billing_cycle' => 'monthly',
    ]);

    $this->actingAs($this->user);

    $response = $this->get(route('settings.billing.preview-receipt', [
        'subscriptionId' => $otherSubscription->id,
    ]));

    $response->assertNotFound();
});

// ─── Auth & Tenant Checks ───

test('requires authentication for billing', function () {
    $response = $this->get(route('settings.billing'));

    $response->assertStatus(302);
    $response->assertRedirectToRoute('login');
});

test('rejects user without tenant', function () {
    $noTenantUser = User::factory()->create(['tenant_id' => null]);
    $this->actingAs($noTenantUser);

    $response = $this->get(route('settings.billing'));

    $response->assertStatus(403);
});
