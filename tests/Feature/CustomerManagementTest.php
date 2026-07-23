<?php

use App\Models\Customer;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

    $this->tenant = Tenant::create([
        'name' => 'Test Broker',
        'type' => 'broker',
        'status' => 'active',
        'onboarding_completed' => true,
        'email' => 'broker@test.com',
        'phone' => '+1234567890',
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

    $this->actingAs($this->user);
});

test('can create an individual customer without email', function () {
    $response = $this->post(route('customers.store'), [
        'type' => 'individual',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => '',
        'phone' => '',
        'is_active' => true,
    ]);

    $response->assertRedirect();

    $customer = Customer::where('first_name', 'John')->first();
    expect($customer)->not->toBeNull()
        ->and($customer->email)->toBeNull()
        ->and($customer->user_id)->toBeNull();
});

test('can create a corporate customer without email', function () {
    $response = $this->post(route('customers.store'), [
        'type' => 'corporate',
        'company_name' => 'Test Corp',
        'email' => '',
        'phone' => '',
        'is_active' => true,
    ]);

    $response->assertRedirect();

    $customer = Customer::where('company_name', 'Test Corp')->first();
    expect($customer)->not->toBeNull()
        ->and($customer->email)->toBeNull()
        ->and($customer->user_id)->toBeNull();
});

test('individual customer requires first_name and last_name', function () {
    $response = $this->post(route('customers.store'), [
        'type' => 'individual',
        'first_name' => '',
        'last_name' => '',
        'email' => '',
        'is_active' => true,
    ]);

    $response->assertSessionHasErrors(['first_name', 'last_name']);
});

test('corporate customer requires company_name', function () {
    $response = $this->post(route('customers.store'), [
        'type' => 'corporate',
        'company_name' => '',
        'email' => '',
        'is_active' => true,
    ]);

    $response->assertSessionHasErrors(['company_name']);
});

test('can update customer to remove email', function () {
    $customer = Customer::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => 'jane@test.com',
        'is_active' => true,
    ]);

    $response = $this->put(route('customers.update', $customer), [
        'type' => 'individual',
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'email' => '',
        'phone' => '',
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $customer->refresh();
    expect($customer->email)->toBeNull();
});

test('export template generates downloadable excel file', function () {
    $response = $this->get(route('customers.export.template'));

    $response->assertOk();
    expect($response->headers->get('Content-Disposition'))->toContain('customer_import_template.xlsx');
});

test('multiple individual customers can have identical names', function () {
    $response1 = $this->post(route('customers.store'), [
        'type' => 'individual',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john1@example.com',
        'is_active' => true,
    ]);
    $response1->assertRedirect();

    $response2 = $this->post(route('customers.store'), [
        'type' => 'individual',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john2@example.com',
        'is_active' => true,
    ]);
    $response2->assertRedirect();

    $count = Customer::where('first_name', 'John')->where('last_name', 'Doe')->count();
    expect($count)->toBe(2);
});

test('multiple corporate customers can have identical company names', function () {
    $response1 = $this->post(route('customers.store'), [
        'type' => 'corporate',
        'company_name' => 'Acme Holdings',
        'email' => 'acme1@example.com',
        'is_active' => true,
    ]);
    $response1->assertRedirect();

    $response2 = $this->post(route('customers.store'), [
        'type' => 'corporate',
        'company_name' => 'Acme Holdings',
        'email' => 'acme2@example.com',
        'is_active' => true,
    ]);
    $response2->assertRedirect();

    $count = Customer::where('company_name', 'Acme Holdings')->count();
    expect($count)->toBe(2);
});

test('multiple tenant users can have identical names', function () {
    $user1 = User::create([
        'name' => 'Alexander Smith',
        'email' => 'alex1@test.com',
        'password' => bcrypt('password'),
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $user2 = User::create([
        'name' => 'Alexander Smith',
        'email' => 'alex2@test.com',
        'password' => bcrypt('password'),
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    expect($user1->exists)->toBeTrue()
        ->and($user2->exists)->toBeTrue();

    $count = User::where('name', 'Alexander Smith')->count();
    expect($count)->toBe(2);
});
