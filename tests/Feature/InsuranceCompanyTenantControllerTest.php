<?php

use App\Models\InsuranceCompany;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
});

test('index returns companies with valid pivot id', function () {
    $company = InsuranceCompany::factory()->create(['is_active' => true]);
    $this->tenant->insuranceCompanies()->attach($company->id, [
        'is_preferred' => false,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('settings.insurance-companies.index'));

    $response->assertOk();
    $data = $response->json();

    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->not->toBeEmpty();
    expect($data[0]['id'])->not->toBeNull();
});

test('can update company is_preferred status using pivot id', function () {
    $company = InsuranceCompany::factory()->create(['is_active' => true]);
    $this->tenant->insuranceCompanies()->attach($company->id, [
        'is_preferred' => false,
    ]);

    $pivot = DB::table('insurance_company_tenant')
        ->where('tenant_id', $this->tenant->id)
        ->where('insurance_company_id', $company->id)
        ->first();

    $response = $this->actingAs($this->user)
        ->put(route('settings.insurance-companies.update', ['pivot' => $pivot->id]), [
            'is_preferred' => true,
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('insurance_company_tenant', [
        'id' => $pivot->id,
        'is_preferred' => true,
    ]);
});

test('can remove company using pivot id', function () {
    $company = InsuranceCompany::factory()->create(['is_active' => true]);
    $this->tenant->insuranceCompanies()->attach($company->id, [
        'is_preferred' => false,
    ]);

    $pivot = DB::table('insurance_company_tenant')
        ->where('tenant_id', $this->tenant->id)
        ->where('insurance_company_id', $company->id)
        ->first();

    $response = $this->actingAs($this->user)
        ->delete(route('settings.insurance-companies.destroy', ['pivot' => $pivot->id]));

    $response->assertRedirect();

    $this->assertDatabaseMissing('insurance_company_tenant', [
        'id' => $pivot->id,
    ]);
});
