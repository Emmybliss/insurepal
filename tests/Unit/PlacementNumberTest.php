<?php

use App\Models\Customer;
use App\Models\Placement;
use App\Models\PolicyProduct;
use App\Models\Tenant;
use App\Models\User;
use Tests\TestCase;

uses(TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

it('generates unique placement numbers across different tenants', function () {
    $tenant1 = Tenant::factory()->create();
    $tenant2 = Tenant::factory()->create();

    $user1 = User::factory()->create(['tenant_id' => $tenant1->id]);
    $user2 = User::factory()->create(['tenant_id' => $tenant2->id]);

    $customer1 = Customer::factory()->create(['tenant_id' => $tenant1->id]);
    $customer2 = Customer::factory()->create(['tenant_id' => $tenant2->id]);

    $product1 = PolicyProduct::factory()->create(['tenant_id' => $tenant1->id]);
    $product2 = PolicyProduct::factory()->create(['tenant_id' => $tenant2->id]);

    $placement1 = Placement::create([
        'tenant_id' => $tenant1->id,
        'customer_id' => $customer1->id,
        'policy_product_id' => $product1->id,
        'currency' => 'NGN',
        'proposed_start_date' => now(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $user1->id,
    ]);

    $placement2 = Placement::create([
        'tenant_id' => $tenant2->id,
        'customer_id' => $customer2->id,
        'policy_product_id' => $product2->id,
        'currency' => 'NGN',
        'proposed_start_date' => now(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $user2->id,
    ]);

    expect($placement1->placement_number)->not->toBe($placement2->placement_number);
    expect(Placement::withTrashed()->where('placement_number', $placement1->placement_number)->count())->toBe(1);
    expect(Placement::withTrashed()->where('placement_number', $placement2->placement_number)->count())->toBe(1);
});

it('avoids collision with soft deleted placements', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
    $product = PolicyProduct::factory()->create(['tenant_id' => $tenant->id]);

    $placement1 = Placement::create([
        'tenant_id' => $tenant->id,
        'customer_id' => $customer->id,
        'policy_product_id' => $product->id,
        'currency' => 'NGN',
        'proposed_start_date' => now(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $user->id,
    ]);

    $firstNumber = $placement1->placement_number;
    $placement1->delete();

    $placement2 = Placement::create([
        'tenant_id' => $tenant->id,
        'customer_id' => $customer->id,
        'policy_product_id' => $product->id,
        'currency' => 'NGN',
        'proposed_start_date' => now(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $user->id,
    ]);

    expect($placement2->placement_number)->not->toBe($firstNumber);
});
