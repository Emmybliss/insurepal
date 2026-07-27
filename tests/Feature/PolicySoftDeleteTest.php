<?php

use App\Models\Claim;
use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Policies\PolicyDependencyService;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create(['type' => 'broker']);
    $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

    Permission::firstOrCreate(['name' => 'delete_policies', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'recycle_bin_view', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'recycle_bin_restore', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'recycle_bin_force_delete', 'guard_name' => 'web']);

    $this->user->givePermissionTo(['delete_policies', 'recycle_bin_view', 'recycle_bin_restore', 'recycle_bin_force_delete']);

    $this->dependencyService = app(PolicyDependencyService::class);
});

test('policy without dependencies can be soft deleted', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    expect($this->dependencyService->hasDependencies($policy))->toBeFalse();

    $response = $this->actingAs($this->user)
        ->from(route('policy-management.index'))
        ->delete(route('policy-management.destroy', $policy->id));

    $response->assertRedirect(route('policy-management.index'));
    expect(Policy::find($policy->id))->toBeNull();
    expect(Policy::withTrashed()->find($policy->id))->not->toBeNull();
    expect(Policy::withTrashed()->find($policy->id)->trashed())->toBeTrue();
});

test('policy soft delete is blocked when debit notes exist', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    DebitNote::create([
        'note_number' => 'DN-2026-000001',
        'reference_number' => 'DN-2026-000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $policy->id,
        'amount' => 1000,
        'total_amount' => 1000,
        'description' => 'Debit Note for Policy',
        'issue_date' => now()->format('Y-m-d'),
        'created_by_id' => $this->user->id,
        'status' => 'draft',
    ]);

    expect($this->dependencyService->hasDependencies($policy))->toBeTrue();

    $response = $this->actingAs($this->user)
        ->delete(route('policy-management.destroy', $policy->id));

    $response->assertSessionHas('error');
    expect(Policy::find($policy->id))->not->toBeNull();
});

test('policy soft delete is blocked when claims exist', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    Claim::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $policy->id,
    ]);

    expect($this->dependencyService->hasDependencies($policy))->toBeTrue();

    $response = $this->actingAs($this->user)
        ->delete(route('policy-management.destroy', $policy->id));

    $response->assertSessionHas('error');
    expect(Policy::find($policy->id))->not->toBeNull();
});

test('soft deleted policy is excluded from standard queries and report calculations', function () {
    $policy1 = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'status' => 'active',
        'effective_date' => now()->subDays(5),
        'premium_amount' => 1000,
    ]);

    $policy2 = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'status' => 'active',
        'effective_date' => now()->subDays(5),
        'premium_amount' => 2000,
    ]);

    $policy2->delete();

    expect(Policy::count())->toBe(1);
    expect(Policy::active()->count())->toBe(1);

    $reportService = app(ReportService::class);
    $metrics = $reportService->getBusinessMetrics(now()->subMonth(), now()->addMonth());

    expect($metrics['total_premium'])->toEqual(1000);
});

test('soft deleted policy appears in recycle bin', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_number' => 'POL-REC-001',
    ]);

    $policy->delete();

    $response = $this->actingAs($this->user)
        ->get(route('recycle-bin.index', ['type' => 'policies']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('recycle-bin/index')
        ->has('items', 1)
        ->where('items.0.id', $policy->id)
    );
});

test('restoring soft deleted policy restores it to active policies', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    $policy->delete();

    $response = $this->actingAs($this->user)
        ->post(route('recycle-bin.restore', ['type' => 'policies', 'id' => $policy->id]));

    $response->assertSessionHas('success');
    expect(Policy::find($policy->id))->not->toBeNull();
    expect(Policy::find($policy->id)->trashed())->toBeFalse();
});

test('restoring soft deleted policy fails if linked customer is trashed', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    $policy->delete();
    $this->customer->delete();

    $response = $this->actingAs($this->user)
        ->post(route('recycle-bin.restore', ['type' => 'policies', 'id' => $policy->id]));

    $response->assertSessionHas('error');
    expect(Policy::find($policy->id))->toBeNull();
});

test('permanently deleting policy purges database record when authorized and no dependencies exist', function () {
    $superAdminRole = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
    $this->user->assignRole($superAdminRole);

    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    $policy->delete();

    $response = $this->actingAs($this->user)
        ->delete(route('recycle-bin.force-delete', ['type' => 'policies', 'id' => $policy->id]));

    $response->assertSessionHas('success');
    expect(Policy::withTrashed()->find($policy->id))->toBeNull();
});

test('policy can be soft deleted once all linked financial documents are moved to recycle bin', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    $debitNote = DebitNote::create([
        'note_number' => 'DN-2026-000002',
        'reference_number' => 'DN-2026-000002',
        'sequence_number' => 2,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $policy->id,
        'amount' => 1000,
        'total_amount' => 1000,
        'description' => 'Debit Note for Policy',
        'issue_date' => now()->format('Y-m-d'),
        'created_by_id' => $this->user->id,
        'status' => 'draft',
    ]);

    // Active debit note blocks soft deletion
    expect($this->dependencyService->hasDependencies($policy))->toBeTrue();

    // Soft delete the debit note
    $debitNote->delete();

    // Now policy soft deletion is no longer blocked
    expect($this->dependencyService->hasDependencies($policy))->toBeFalse();

    $response = $this->actingAs($this->user)
        ->from(route('policy-management.index'))
        ->delete(route('policy-management.destroy', $policy->id));

    $response->assertRedirect(route('policy-management.index'));
    expect(Policy::find($policy->id))->toBeNull();
    expect(Policy::withTrashed()->find($policy->id)->trashed())->toBeTrue();
});

test('restoring financial document fails when linked policy was permanently deleted', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    $debitNote = DebitNote::create([
        'note_number' => 'DN-2026-000003',
        'reference_number' => 'DN-2026-000003',
        'sequence_number' => 3,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $policy->id,
        'amount' => 1000,
        'total_amount' => 1000,
        'description' => 'Debit Note',
        'issue_date' => now()->format('Y-m-d'),
        'created_by_id' => $this->user->id,
        'status' => 'draft',
    ]);

    $debitNote->delete();
    $debitNote->policy_id = 999999;

    $error = $this->dependencyService->getRestoreError($debitNote, 'debit-notes');

    expect($error)->not->toBeNull();
    expect(str_contains($error, 'permanently deleted'))->toBeTrue();
});

test('restoring financial document with restore_policy flag restores both policy and document', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
    ]);

    $debitNote = DebitNote::create([
        'note_number' => 'DN-2026-000004',
        'reference_number' => 'DN-2026-000004',
        'sequence_number' => 4,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_id' => $policy->id,
        'amount' => 1000,
        'total_amount' => 1000,
        'description' => 'Debit Note',
        'issue_date' => now()->format('Y-m-d'),
        'created_by_id' => $this->user->id,
        'status' => 'draft',
    ]);

    $debitNote->delete();
    $policy->delete();

    // Restoring without restore_policy flag returns prompt error
    $response1 = $this->actingAs($this->user)
        ->post(route('recycle-bin.restore', ['type' => 'debit-notes', 'id' => $debitNote->id]));

    $response1->assertSessionHas('error', fn ($val) => str_contains($val, 'Restore with Policy'));

    // Restoring with restore_policy=true restores both together
    $response2 = $this->actingAs($this->user)
        ->post(route('recycle-bin.restore', ['type' => 'debit-notes', 'id' => $debitNote->id]), [
            'restore_policy' => true,
        ]);

    $response2->assertSessionHas('success');
    expect(Policy::find($policy->id)->trashed())->toBeFalse();
    expect(DebitNote::find($debitNote->id)->trashed())->toBeFalse();
});
