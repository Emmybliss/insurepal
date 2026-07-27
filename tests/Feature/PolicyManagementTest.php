<?php

use App\Models\Customer;
use App\Models\Policy;
use App\Models\PolicyProduct;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    Role::create(['name' => 'underwriter']);
    Role::create(['name' => 'broker']);
    Role::create(['name' => 'customer']);

    Permission::create(['name' => 'create_policies']);
    Permission::create(['name' => 'view_policies']);
    Permission::create(['name' => 'edit_policies']);

    // ─── Underwriter tenant setup ───
    $this->underwriterTenant = Tenant::factory()->create([
        'type' => 'underwriter',
        'name' => 'Main Underwriter Ltd',
    ]);

    $this->underwriter = User::factory()->create([
        'tenant_id' => $this->underwriterTenant->id,
        'email' => 'underwriter@test.com',
        'is_active' => true,
    ]);
    $underwriterRole = Role::where('name', 'underwriter')->first();
    $underwriterRole->givePermissionTo(['create_policies', 'view_policies', 'edit_policies']);
    $this->underwriter->assignRole($underwriterRole);

    // ─── Broker tenant setup ───
    $this->brokerTenant = Tenant::factory()->create([
        'type' => 'broker',
        'name' => 'Test Broker Co',
    ]);

    $this->broker = User::factory()->create([
        'tenant_id' => $this->brokerTenant->id,
        'email' => 'broker@test.com',
        'is_active' => true,
    ]);
    $brokerRole = Role::where('name', 'broker')->first();
    $brokerRole->givePermissionTo(['create_policies', 'view_policies', 'edit_policies']);
    $this->broker->assignRole($brokerRole);

    // ─── Shared data ───
    $this->customer = Customer::factory()->create([
        'tenant_id' => $this->underwriterTenant->id,
        'type' => 'individual',
    ]);

    $this->brokerCustomer = Customer::factory()->create([
        'tenant_id' => $this->brokerTenant->id,
        'type' => 'individual',
    ]);

    $this->policyProduct = PolicyProduct::factory()->create([
        'tenant_id' => $this->underwriterTenant->id,
        'name' => 'Test Auto Insurance',
    ]);

    $this->brokerPolicyProduct = PolicyProduct::factory()->create([
        'tenant_id' => $this->brokerTenant->id,
        'name' => 'Test Broker Product',
    ]);
});

// ═════════════════════════════════════════════
//  UNDERWRITER: Direct Policy Issuance
// ═════════════════════════════════════════════

it('underwriter can access direct policy creation form', function () {
    $this->actingAs($this->underwriter)
        ->get(route('policy-management.create-direct'))
        ->assertSuccessful();
});

it('underwriter can store a direct policy', function () {
    $response = $this->actingAs($this->underwriter)
        ->post(route('policy-management.store-direct'), [
            'customer_id' => $this->customer->id,
            'policy_product_id' => $this->policyProduct->id,
            'effective_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'premium_amount' => 100000,
            'commission_amount' => 10000,
            'coverage_details' => ['sum_assured' => 500000, 'coverage_type' => 'comprehensive'],
            'payment_frequency' => 'annual',
        ]);

    $response->assertRedirect();

    $policy = Policy::where('customer_id', $this->customer->id)->first();

    expect($policy)->not->toBeNull();
    expect($policy->source_type)->toBe(Policy::SOURCE_DIRECT_ISSUANCE);
    expect($policy->issued_by_id)->toBe($this->underwriter->id);
    expect($policy->policy_number)->not->toBeEmpty();
});

it('underwriter direct policy has correct default status', function () {
    $this->actingAs($this->underwriter)
        ->post(route('policy-management.store-direct'), [
            'customer_id' => $this->customer->id,
            'policy_product_id' => $this->policyProduct->id,
            'effective_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'premium_amount' => 50000,
            'commission_amount' => 5000,
            'coverage_details' => ['sum_assured' => 200000],
            'payment_frequency' => 'annual',
        ]);

    $policy = Policy::where('customer_id', $this->customer->id)->first();

    // Amount is below approval threshold → auto-active
    expect($policy->status)->toBe(Policy::STATUS_ACTIVE);
    expect($policy->approval_status)->toBe(Policy::APPROVAL_NOT_REQUIRED);
});

it('validates required fields for direct policy', function () {
    $this->actingAs($this->underwriter)
        ->post(route('policy-management.store-direct'), [])
        ->assertSessionHasErrors(['customer_id', 'policy_product_id', 'effective_date', 'expiry_date', 'premium_amount', 'coverage_details', 'payment_frequency']);
});

it('underwriter cannot access broker record-placed form', function () {
    $this->actingAs($this->underwriter)
        ->get(route('policy-management.record-placed'))
        ->assertForbidden();
});

it('underwriter cannot post to broker store-placed', function () {
    $this->actingAs($this->underwriter)
        ->post(route('policy-management.store-placed'), [])
        ->assertForbidden();
});

// ═════════════════════════════════════════════
//  BROKER: Record Placed Policy
// ═════════════════════════════════════════════

it('broker can access record-placed policy form', function () {
    $this->actingAs($this->broker)
        ->get(route('policy-management.record-placed'))
        ->assertSuccessful();
});

it('broker can store a placed policy with schedule file', function () {
    $scheduleFile = UploadedFile::fake()->create('schedule.pdf', 100);

    $response = $this->actingAs($this->broker)
        ->post(route('policy-management.store-placed'), [
            'customer_id' => $this->brokerCustomer->id,
            'policy_product_id' => $this->brokerPolicyProduct->id,
            'policy_number' => 'BROKER-POL-001',
            'broker_slip_number' => 'SLIP-001',
            'placement_date' => now()->format('Y-m-d'),
            'insurer_id' => 1,
            'insurer_name' => 'Test Insurer Ltd',
            'effective_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'premium_amount' => 250000,
            'commission_amount' => 25000,
            'commission_rate' => 10,
            'coverage_details' => ['sum_assured' => 1000000],
            'payment_frequency' => 'annual',
            'schedule_file' => $scheduleFile,
        ]);

    $response->assertRedirect();

    $policy = Policy::where('customer_id', $this->brokerCustomer->id)->first();

    expect($policy)->not->toBeNull();
    expect($policy->source_type)->toBe(Policy::SOURCE_BROKER_RECORDED);
    expect($policy->broker_id)->toBe($this->brokerTenant->id);
    expect($policy->status)->toBe(Policy::STATUS_RECORDED);
    expect($policy->is_policy_issued)->toBeTrue();
    expect($policy->broker_slip_number)->toBe('SLIP-001');
    expect($policy->schedule_file_path)->not->toBeEmpty();

    Storage::disk('public')->assertExists($policy->schedule_file_path);
});

it('broker can store a placed policy with schedule and broker slip', function () {
    $scheduleFile = UploadedFile::fake()->create('schedule.pdf', 100);
    $brokerSlipFile = UploadedFile::fake()->create('broker-slip.pdf', 50);

    $response = $this->actingAs($this->broker)
        ->post(route('policy-management.store-placed'), [
            'customer_id' => $this->brokerCustomer->id,
            'policy_product_id' => $this->brokerPolicyProduct->id,
            'policy_number' => 'BROKER-POL-002',
            'broker_slip_number' => 'SLIP-002',
            'placement_date' => now()->format('Y-m-d'),
            'insurer_id' => 1,
            'insurer_name' => 'Test Insurer Ltd',
            'effective_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'premium_amount' => 300000,
            'commission_amount' => 30000,
            'commission_rate' => 10,
            'coverage_details' => ['sum_assured' => 2000000],
            'payment_frequency' => 'annual',
            'schedule_file' => $scheduleFile,
            'broker_slip_file' => $brokerSlipFile,
        ]);

    $response->assertRedirect();

    $policy = Policy::where('policy_number', 'BROKER-POL-002')->first();

    expect($policy)->not->toBeNull();
    expect($policy->broker_slip_file_path)->not->toBeEmpty();

    Storage::disk('public')->assertExists($policy->schedule_file_path);
    Storage::disk('public')->assertExists($policy->broker_slip_file_path);
});

it('validates required fields for placed policy', function () {
    $this->actingAs($this->broker)
        ->post(route('policy-management.store-placed'), [])
        ->assertSessionHasErrors(['customer_id', 'policy_product_id', 'placement_date', 'effective_date', 'expiry_date', 'premium_amount']);
});

it('can store placed policy without insurer and without sum_insured', function () {
    $response = $this->actingAs($this->broker)
        ->post(route('policy-management.store-placed'), [
            'customer_id' => $this->brokerCustomer->id,
            'policy_product_id' => $this->brokerPolicyProduct->id,
            'placement_date' => now()->format('Y-m-d'),
            'effective_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'premium_amount' => 150000,
        ]);

    $response->assertRedirect();

    $policy = Policy::where('customer_id', $this->brokerCustomer->id)->latest()->first();

    expect($policy)->not->toBeNull();
    expect($policy->insurer_name)->toBeNull();
    expect($policy->insurer_id)->toBeNull();
    expect($policy->sum_insured)->toBeNull();
    expect($policy->policy_number_display)->toBe($policy->internal_reference);
});

it('can store placed policy without broker_slip_number and schedule_file', function () {
    $response = $this->actingAs($this->broker)
        ->post(route('policy-management.store-placed'), [
            'customer_id' => $this->brokerCustomer->id,
            'policy_product_id' => $this->brokerPolicyProduct->id,
            'policy_number' => 'BROKER-POL-OPTIONAL',
            'placement_date' => now()->format('Y-m-d'),
            'insurer_id' => 1,
            'insurer_name' => 'Test Insurer Ltd',
            'effective_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'premium_amount' => 100000,
        ]);

    $response->assertRedirect();

    $policy = Policy::where('policy_number', 'BROKER-POL-OPTIONAL')->first();

    expect($policy)->not->toBeNull();
    expect($policy->broker_slip_number)->toBeNull();
    expect($policy->schedule_file_path)->toBeNull();
});

it('validates policy_number uniqueness per tenant for placed policy', function () {
    Policy::factory()->create([
        'tenant_id' => $this->brokerTenant->id,
        'policy_number' => 'BROKER-POL-DUP',
        'source_type' => Policy::SOURCE_BROKER_RECORDED,
    ]);

    $scheduleFile = UploadedFile::fake()->create('schedule.pdf', 100);

    $this->actingAs($this->broker)
        ->post(route('policy-management.store-placed'), [
            'customer_id' => $this->brokerCustomer->id,
            'policy_product_id' => $this->brokerPolicyProduct->id,
            'policy_number' => 'BROKER-POL-DUP',
            'broker_slip_number' => 'SLIP-DUP',
            'placement_date' => now()->format('Y-m-d'),
            'insurer_id' => 1,
            'insurer_name' => 'Test Insurer Ltd',
            'effective_date' => now()->format('Y-m-d'),
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'premium_amount' => 100000,
            'commission_rate' => 10,
            'schedule_file' => $scheduleFile,
        ])
        ->assertSessionHasErrors(['policy_number']);
});

it('broker cannot access underwriter create-direct form', function () {
    $this->actingAs($this->broker)
        ->get(route('policy-management.create-direct'))
        ->assertForbidden();
});

it('broker cannot post to underwriter store-direct', function () {
    $this->actingAs($this->broker)
        ->post(route('policy-management.store-direct'), [])
        ->assertForbidden();
});

// ═════════════════════════════════════════════
//  EDIT / UPDATE POLICY
// ═════════════════════════════════════════════

it('can update broker slip details for recorded policy', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->brokerTenant->id,
        'customer_id' => $this->brokerCustomer->id,
        'policy_product_id' => $this->brokerPolicyProduct->id,
        'source_type' => Policy::SOURCE_BROKER_RECORDED,
        'status' => Policy::STATUS_RECORDED,
        'created_by' => $this->broker->id,
    ]);

    $this->actingAs($this->broker)
        ->put(route('policy-management.update', $policy), [
            'status' => Policy::STATUS_RECORDED,
            'effective_date' => $policy->effective_date->format('Y-m-d'),
            'expiry_date' => $policy->expiry_date->format('Y-m-d'),
            'broker_slip_number' => 'UPDATED-SLIP-001',
            'placement_date' => now()->format('Y-m-d'),
            'insurer_name' => 'Updated Insurer Ltd',
        ])
        ->assertRedirect(route('policy-management.show', $policy));

    $policy->refresh();

    expect($policy->broker_slip_number)->toBe('UPDATED-SLIP-001');
    expect($policy->insurer_name)->toBe('Updated Insurer Ltd');
    expect($policy->placement_date->format('Y-m-d'))->toBe(now()->format('Y-m-d'));
});

it('can update commission rate for recorded policy', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->brokerTenant->id,
        'customer_id' => $this->brokerCustomer->id,
        'policy_product_id' => $this->brokerPolicyProduct->id,
        'source_type' => Policy::SOURCE_BROKER_RECORDED,
        'status' => Policy::STATUS_RECORDED,
        'premium_amount' => 100000,
        'commission_amount' => 10000,
        'commission_rate' => 10,
        'created_by' => $this->broker->id,
    ]);

    $this->actingAs($this->broker)
        ->put(route('policy-management.update', $policy), [
            'status' => Policy::STATUS_RECORDED,
            'effective_date' => $policy->effective_date->format('Y-m-d'),
            'expiry_date' => $policy->expiry_date->format('Y-m-d'),
            'premium_amount' => 200000,
            'commission_amount' => 30000,
            'commission_rate' => 15,
        ])
        ->assertRedirect();

    $policy->refresh();

    expect((float) $policy->commission_rate)->toBe(15.0);
    expect((float) $policy->commission_amount)->toBe(30000.0);
    expect((float) $policy->premium_amount)->toBe(200000.0);
});

it('can update status to recorded', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->underwriterTenant->id,
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'source_type' => Policy::SOURCE_DIRECT_ISSUANCE,
        'status' => Policy::STATUS_ACTIVE,
        'created_by' => $this->underwriter->id,
    ]);

    $this->actingAs($this->underwriter)
        ->put(route('policy-management.update', $policy), [
            'status' => Policy::STATUS_RECORDED,
            'effective_date' => $policy->effective_date->format('Y-m-d'),
            'expiry_date' => $policy->expiry_date->format('Y-m-d'),
        ])
        ->assertRedirect();

    $policy->refresh();

    expect($policy->status)->toBe(Policy::STATUS_RECORDED);
});

it('can replace schedule file during policy update', function () {
    Storage::fake('public');

    $policy = Policy::factory()->create([
        'tenant_id' => $this->brokerTenant->id,
        'customer_id' => $this->brokerCustomer->id,
        'policy_product_id' => $this->brokerPolicyProduct->id,
        'source_type' => Policy::SOURCE_BROKER_RECORDED,
        'status' => Policy::STATUS_RECORDED,
        'schedule_file_path' => 'old/schedule.pdf',
        'created_by' => $this->broker->id,
    ]);

    Storage::disk('public')->put('old/schedule.pdf', 'old content');

    $newSchedule = UploadedFile::fake()->create('new-schedule.pdf', 200);

    $this->actingAs($this->broker)
        ->put(route('policy-management.update', $policy), [
            'status' => Policy::STATUS_RECORDED,
            'effective_date' => $policy->effective_date->format('Y-m-d'),
            'expiry_date' => $policy->expiry_date->format('Y-m-d'),
            'schedule_file' => $newSchedule,
        ])
        ->assertRedirect();

    $policy->refresh();

    expect($policy->schedule_file_path)->not->toBe('old/schedule.pdf');
    Storage::disk('public')->assertExists($policy->schedule_file_path);
    Storage::disk('public')->assertMissing('old/schedule.pdf');
});

it('prevents unauthorized tenant from updating policy', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->underwriterTenant->id,
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'created_by' => $this->underwriter->id,
    ]);

    $this->actingAs($this->broker)
        ->put(route('policy-management.update', $policy), [
            'status' => Policy::STATUS_ACTIVE,
            'effective_date' => $policy->effective_date->format('Y-m-d'),
            'expiry_date' => $policy->expiry_date->format('Y-m-d'),
        ])
        ->assertForbidden();
});
