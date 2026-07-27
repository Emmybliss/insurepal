<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\RoleService;

beforeEach(function () {
    $this->adminRole = Role::firstOrCreate(
        ['name' => 'broker_admin', 'guard_name' => 'web'],
        ['display_name' => 'Broker Admin', 'is_system_role' => true, 'is_active' => true]
    );

    $this->tenant = Tenant::factory()->create([
        'name' => 'Test Brokerage',
        'type' => 'broker',
    ]);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $this->user->assignRole('broker_admin');

    // Create system permissions
    $this->permission = Permission::firstOrCreate(
        ['name' => 'view_policies'],
        ['guard_name' => 'web', 'tenant_id' => null, 'is_system_permission' => true, 'category' => 'Policy Management']
    );
});

test('tenant admin can view role management page', function () {
    $response = $this->actingAs($this->user)->get(route('role-management.index'));
    $response->assertStatus(200);
});

test('tenant admin can create a custom role', function () {
    $roleService = app(RoleService::class);

    $role = $roleService->createRole(
        tenant: $this->tenant,
        data: [
            'name' => 'claims_inspector',
            'display_name' => 'Claims Inspector',
            'description' => 'Handles claim inspections',
            'permissions' => [$this->permission->id],
        ],
        actor: $this->user
    );

    expect($role)->not->toBeNull();
    expect($role->tenant_id)->toBe($this->tenant->id);
    expect($role->display_name)->toBe('Claims Inspector');
    expect($role->permissions->pluck('id'))->toContain($this->permission->id);
});

test('tenant admin can duplicate a custom role', function () {
    $roleService = app(RoleService::class);

    $original = $roleService->createRole(
        tenant: $this->tenant,
        data: [
            'name' => 'senior_underwriter',
            'display_name' => 'Senior Underwriter',
            'permissions' => [$this->permission->id],
        ],
        actor: $this->user
    );

    $duplicate = $roleService->duplicateRole($original, 'Copy of Senior Underwriter', $this->user);

    expect($duplicate->id)->not->toBe($original->id);
    expect($duplicate->display_name)->toBe('Copy of Senior Underwriter');
    expect($duplicate->tenant_id)->toBe($this->tenant->id);
    expect($duplicate->permissions->pluck('id'))->toContain($this->permission->id);
});

test('tenant admin cannot delete a protected system role', function () {
    $systemRole = Role::where('name', 'broker_admin')->first();

    $this->expectException(\InvalidArgumentException::class);

    $roleService = app(RoleService::class);
    $roleService->deleteRole($systemRole, $this->user);
});

test('tenant isolation prevents accessing roles from another tenant', function () {
    $otherTenant = Tenant::factory()->create(['type' => 'broker']);
    $roleService = app(RoleService::class);

    $otherRole = $roleService->createRole(
        tenant: $otherTenant,
        data: ['name' => 'other_role', 'display_name' => 'Other Role'],
        actor: null
    );

    $response = $this->actingAs($this->user)->get(route('role-management.show', $otherRole->id));
    $response->assertStatus(403);
});
