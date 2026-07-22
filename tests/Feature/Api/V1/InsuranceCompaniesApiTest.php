<?php

use App\Models\InsuranceCompany;
use App\Models\InsuranceCompanyBranch;
use App\Models\InsuranceCompanyContact;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Role;

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
});

// ─── List ───

test('can list insurance companies via API', function () {
    InsuranceCompany::factory()->count(3)->create();

    $response = $this->getJson('/api/v1/insurance-companies');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'company_type', 'email', 'is_active'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
    expect($response->json('meta.total'))->toBe(3);
});

test('can search insurance companies via API', function () {
    InsuranceCompany::factory()->create(['name' => 'Acme Insurance Ltd']);
    InsuranceCompany::factory()->create(['name' => 'Zenith Insurance']);

    $response = $this->getJson('/api/v1/insurance-companies?search=Acme');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter insurance companies by type via API', function () {
    InsuranceCompany::factory()->create(['company_type' => 'underwriter']);
    InsuranceCompany::factory()->create(['company_type' => 'broker']);
    InsuranceCompany::factory()->create(['company_type' => 'both']);

    $response = $this->getJson('/api/v1/insurance-companies?type=underwriter');

    $response->assertOk();
    // underwriter + both matches
    expect($response->json('meta.total'))->toBe(2);
});

test('can filter insurance companies by active status via API', function () {
    InsuranceCompany::factory()->create(['name' => 'Active Co', 'is_active' => true]);
    InsuranceCompany::factory()->create(['name' => 'Inactive Co', 'is_active' => false]);

    $response = $this->getJson('/api/v1/insurance-companies?is_active=true');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create ───

test('can create an insurance company via API', function () {
    $response = $this->postJson('/api/v1/insurance-companies', [
        'name' => 'New Insurance Ltd',
        'company_type' => 'underwriter',
        'email' => 'contact@newinsurance.com',
        'phone' => '+234-800-123-4567',
        'naicom_reg_number' => 'NAICOM-001',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'name', 'company_type', 'email']]);

    expect($response->json('data.name'))->toBe('New Insurance Ltd');
    expect($response->json('data.company_type'))->toBe('underwriter');
});

test('cannot create company without required fields via API', function () {
    $response = $this->postJson('/api/v1/insurance-companies', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'company_type']);
});

// ─── Show ───

test('can show an insurance company via API', function () {
    $company = InsuranceCompany::factory()->create();

    $response = $this->getJson("/api/v1/insurance-companies/{$company->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $company->id)
        ->assertJsonPath('data.name', $company->name);
});

test('show includes branches and contacts when loaded via API', function () {
    $company = InsuranceCompany::factory()->create();
    $company->branches()->create(['name' => 'Lagos Branch']);
    $company->contacts()->create(['first_name' => 'John', 'last_name' => 'Doe']);

    $response = $this->getJson("/api/v1/insurance-companies/{$company->id}");

    $response->assertOk();
    expect($response->json('data.branches.data'))->toHaveCount(1);
    expect($response->json('data.contacts.data'))->toHaveCount(1);
});

// ─── Update ───

test('can update an insurance company via API', function () {
    $company = InsuranceCompany::factory()->create();

    $response = $this->putJson("/api/v1/insurance-companies/{$company->id}", [
        'name' => 'Updated Insurance Ltd',
        'notes' => 'Updated notes.',
    ]);

    $response->assertOk();
    expect($company->fresh()->name)->toBe('Updated Insurance Ltd');
    expect($company->fresh()->notes)->toBe('Updated notes.');
});

// ─── Delete ───

test('can delete an insurance company via API', function () {
    $company = InsuranceCompany::factory()->create();

    $response = $this->deleteJson("/api/v1/insurance-companies/{$company->id}");

    $response->assertOk();
    expect(InsuranceCompany::find($company->id))->toBeNull();
    expect(InsuranceCompany::withTrashed()->find($company->id))->not->toBeNull();
});

// ─── Branches ───

test('can list branches via API', function () {
    $company = InsuranceCompany::factory()->create();
    $company->branches()->create(['name' => 'Main Branch']);
    $company->branches()->create(['name' => 'Secondary Branch']);

    $response = $this->getJson("/api/v1/insurance-companies/{$company->id}/branches");

    $response->assertOk();
    expect($response->json('data.data'))->toHaveCount(2);
});

test('can create a branch via API', function () {
    $company = InsuranceCompany::factory()->create();

    $response = $this->postJson("/api/v1/insurance-companies/{$company->id}/branches", [
        'name' => 'Abuja Branch',
        'code' => 'ABJ-01',
        'city' => 'Abuja',
        'state' => 'FCT',
    ]);

    $response->assertCreated();
    expect($response->json('data.name'))->toBe('Abuja Branch');
});

test('cannot create branch without name via API', function () {
    $company = InsuranceCompany::factory()->create();

    $response = $this->postJson("/api/v1/insurance-companies/{$company->id}/branches", []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('can update a branch via API', function () {
    $company = InsuranceCompany::factory()->create();
    $branch = $company->branches()->create(['name' => 'Old Name']);

    $response = $this->putJson("/api/v1/insurance-companies/{$company->id}/branches/{$branch->id}", [
        'name' => 'New Name',
    ]);

    $response->assertOk();
    expect($branch->fresh()->name)->toBe('New Name');
});

test('cannot update branch from wrong company via API', function () {
    $companyA = InsuranceCompany::factory()->create();
    $companyB = InsuranceCompany::factory()->create();
    $branch = $companyA->branches()->create(['name' => 'Branch A']);

    $response = $this->putJson("/api/v1/insurance-companies/{$companyB->id}/branches/{$branch->id}", [
        'name' => 'Should not update',
    ]);

    $response->assertNotFound();
});

test('can delete a branch via API', function () {
    $company = InsuranceCompany::factory()->create();
    $branch = $company->branches()->create(['name' => 'To Delete']);

    $response = $this->deleteJson("/api/v1/insurance-companies/{$company->id}/branches/{$branch->id}");

    $response->assertOk();
    expect(InsuranceCompanyBranch::find($branch->id))->toBeNull();
});

// ─── Contacts ───

test('can list contacts via API', function () {
    $company = InsuranceCompany::factory()->create();
    $company->contacts()->create(['first_name' => 'John', 'last_name' => 'Doe']);
    $company->contacts()->create(['first_name' => 'Jane', 'last_name' => 'Smith']);

    $response = $this->getJson("/api/v1/insurance-companies/{$company->id}/contacts");

    $response->assertOk();
    expect($response->json('data.data'))->toHaveCount(2);
});

test('can create a contact via API', function () {
    $company = InsuranceCompany::factory()->create();

    $response = $this->postJson("/api/v1/insurance-companies/{$company->id}/contacts", [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john.doe@insurer.com',
        'position' => 'Claims Manager',
        'is_primary' => true,
    ]);

    $response->assertCreated();
    expect($response->json('data.first_name'))->toBe('John');
    expect($response->json('data.is_primary'))->toBeTrue();
});

test('cannot create contact without first and last name via API', function () {
    $company = InsuranceCompany::factory()->create();

    $response = $this->postJson("/api/v1/insurance-companies/{$company->id}/contacts", []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['first_name', 'last_name']);
});

test('can update a contact via API', function () {
    $company = InsuranceCompany::factory()->create();
    $contact = $company->contacts()->create(['first_name' => 'Old', 'last_name' => 'Name']);

    $response = $this->putJson("/api/v1/insurance-companies/{$company->id}/contacts/{$contact->id}", [
        'first_name' => 'New',
        'position' => 'Updated Position',
    ]);

    $response->assertOk();
    expect($contact->fresh()->first_name)->toBe('New');
});

test('cannot update contact from wrong company via API', function () {
    $companyA = InsuranceCompany::factory()->create();
    $companyB = InsuranceCompany::factory()->create();
    $contact = $companyA->contacts()->create(['first_name' => 'John', 'last_name' => 'Doe']);

    $response = $this->putJson("/api/v1/insurance-companies/{$companyB->id}/contacts/{$contact->id}", [
        'first_name' => 'Should not update',
    ]);

    $response->assertNotFound();
});

test('can delete a contact via API', function () {
    $company = InsuranceCompany::factory()->create();
    $contact = $company->contacts()->create(['first_name' => 'Delete', 'last_name' => 'Me']);

    $response = $this->deleteJson("/api/v1/insurance-companies/{$company->id}/contacts/{$contact->id}");

    $response->assertOk();
    expect(InsuranceCompanyContact::find($contact->id))->toBeNull();
});
