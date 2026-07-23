<?php

use App\Models\Customer;
use App\Models\Policy;
use App\Models\PolicyProduct;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('policy automatically generates immutable internal reference when policy number is null or placeholder', function () {
    $tenant = Tenant::factory()->create();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $product = PolicyProduct::factory()->create(['tenant_id' => $tenant->id]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $policy = Policy::create([
        'tenant_id' => $tenant->id,
        'customer_id' => $customer->id,
        'policy_product_id' => $product->id,
        'created_by' => $user->id,
        'policy_number' => 'TBA',
        'source_type' => 'BROKER_RECORDED',
        'status' => 'recorded',
        'approval_status' => 'not_required',
        'effective_date' => now()->format('Y-m-d'),
        'expiry_date' => now()->addYear()->format('Y-m-d'),
        'premium_amount' => 50000,
        'total_amount' => 50000,
        'payment_frequency' => 'annual',
        'coverage_details' => ['sum_assured' => 500000],
    ]);

    expect($policy->policy_number)->toBeNull()
        ->and($policy->internal_reference)->not()->toBeNull()
        ->and($policy->internal_reference)->toMatch('/^IP-BRK-\d{4}-\d{6}$/')
        ->and($policy->policy_number_display)->toBe($policy->internal_reference);
});

test('policy number display uses official policy number when available', function () {
    $tenant = Tenant::factory()->create();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $product = PolicyProduct::factory()->create(['tenant_id' => $tenant->id]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $policy = Policy::create([
        'tenant_id' => $tenant->id,
        'customer_id' => $customer->id,
        'policy_product_id' => $product->id,
        'created_by' => $user->id,
        'policy_number' => 'POL-2026-9999',
        'source_type' => 'DIRECT_ISSUANCE',
        'status' => 'active',
        'approval_status' => 'approved',
        'effective_date' => now()->format('Y-m-d'),
        'expiry_date' => now()->addYear()->format('Y-m-d'),
        'premium_amount' => 75000,
        'total_amount' => 75000,
        'payment_frequency' => 'annual',
        'coverage_details' => ['sum_assured' => 750000],
    ]);

    expect($policy->policy_number)->toBe('POL-2026-9999')
        ->and($policy->policy_number_display)->toBe('POL-2026-9999')
        ->and($policy->internal_reference)->not()->toBeNull();
});

test('updating policy number later preserves existing immutable internal reference', function () {
    $tenant = Tenant::factory()->create();
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $product = PolicyProduct::factory()->create(['tenant_id' => $tenant->id]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $policy = Policy::create([
        'tenant_id' => $tenant->id,
        'customer_id' => $customer->id,
        'policy_product_id' => $product->id,
        'created_by' => $user->id,
        'policy_number' => null,
        'source_type' => 'BROKER_RECORDED',
        'status' => 'recorded',
        'approval_status' => 'not_required',
        'effective_date' => now()->format('Y-m-d'),
        'expiry_date' => now()->addYear()->format('Y-m-d'),
        'premium_amount' => 60000,
        'total_amount' => 60000,
        'payment_frequency' => 'annual',
        'coverage_details' => ['sum_assured' => 600000],
    ]);

    $initialRef = $policy->internal_reference;

    $policy->update([
        'policy_number' => 'INS-OFFICIAL-12345',
        'internal_reference' => 'IP-BRK-9999-999999', // Attempt to mutate internal ref
    ]);

    $policy->refresh();

    expect($policy->policy_number)->toBe('INS-OFFICIAL-12345')
        ->and($policy->internal_reference)->toBe($initialRef)
        ->and($policy->policy_number_display)->toBe('INS-OFFICIAL-12345');
});
