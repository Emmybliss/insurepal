<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoleManagementRequest;
use App\Http\Requests\UpdateRoleManagementRequest;
use App\Models\Role;
use App\Services\PermissionService;
use App\Services\RoleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use InvalidArgumentException;

class RoleManagementController extends Controller
{
    public function __construct(
        protected RoleService $roleService,
        protected PermissionService $permissionService,
    ) {
        $this->middleware('auth');
        $this->middleware('tenant.access');
    }

    public function index(Request $request)
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant associated');
        }

        $query = Role::forTenant($tenant->id)
            ->with(['permissions'])
            ->withCount(['permissions', 'users']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('display_name', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('system')) {
            if ($request->boolean('system')) {
                $query->system();
            } else {
                $query->nonSystem();
            }
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->active();
            } else {
                $query->where('is_active', false);
            }
        }

        $roles = $query->orderBy('name')->paginate(15);

        return Inertia::render('RoleManagement/Index', [
            'roles' => $roles,
            'filters' => $request->only(['search', 'system', 'status']),
            'stats' => [
                'total' => Role::forTenant($tenant->id)->count(),
                'active' => Role::forTenant($tenant->id)->active()->count(),
                'system' => Role::forTenant($tenant->id)->system()->count(),
                'custom' => Role::forTenant($tenant->id)->nonSystem()->count(),
            ],
        ]);
    }

    public function create()
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant associated');
        }

        $permissions = $this->permissionService->getGroupedPermissions($tenant);

        return Inertia::render('RoleManagement/Create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(StoreRoleManagementRequest $request)
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant associated');
        }

        $this->roleService->createRole($tenant, $request->validated(), Auth::user());

        return redirect()->route('role-management.index')
            ->with('success', 'Role created successfully');
    }

    public function show(Role $role)
    {
        $this->authorizeRoleAccess($role);

        $role->load(['permissions', 'users']);

        return Inertia::render('RoleManagement/Show', [
            'role' => $role,
        ]);
    }

    public function edit(Role $role)
    {
        $this->authorizeRoleAccess($role);

        if ($role->isProtectedSystemRole()) {
            abort(403, 'Cannot edit system roles');
        }

        $tenant = Auth::user()->tenant;
        $permissions = $this->permissionService->getGroupedPermissions($tenant);
        $role->load('permissions');

        return Inertia::render('RoleManagement/Edit', [
            'role' => $role,
            'permissions' => $permissions,
            'rolePermissions' => $role->permissions->pluck('id')->toArray(),
        ]);
    }

    public function update(UpdateRoleManagementRequest $request, Role $role)
    {
        $this->authorizeRoleAccess($role);

        try {
            $this->roleService->updateRole($role, $request->validated(), Auth::user());
        } catch (InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['role' => $e->getMessage()]);
        }

        return redirect()->route('role-management.index')
            ->with('success', 'Role updated successfully');
    }

    public function destroy(Role $role)
    {
        $this->authorizeRoleAccess($role);

        try {
            $this->roleService->deleteRole($role, Auth::user());
        } catch (InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['role' => $e->getMessage()]);
        }

        return redirect()->route('role-management.index')
            ->with('success', 'Role deleted successfully');
    }

    public function duplicate(Request $request, Role $role)
    {
        $this->authorizeRoleAccess($role);

        $validated = $request->validate([
            'display_name' => 'nullable|string|max:255',
        ]);

        try {
            $duplicatedRole = $this->roleService->duplicateRole(
                role: $role,
                newDisplayName: $validated['display_name'] ?? null,
                actor: Auth::user()
            );
        } catch (InvalidArgumentException $e) {
            return redirect()->back()->withErrors(['role' => $e->getMessage()]);
        }

        return redirect()->route('role-management.edit', $duplicatedRole->id)
            ->with('success', "Role '{$duplicatedRole->display_name}' duplicated successfully.");
    }

    public function toggleStatus(Role $role)
    {
        $this->authorizeRoleAccess($role);

        if ($role->isProtectedSystemRole()) {
            abort(403, 'Cannot modify system role status');
        }

        $role->update(['is_active' => ! $role->is_active]);
        $status = $role->is_active ? 'activated' : 'deactivated';

        return redirect()->back()
            ->with('success', "Role {$status} successfully");
    }

    private function authorizeRoleAccess(Role $role): void
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant associated');
        }

        if ($role->tenant_id && $role->tenant_id !== $tenant->id) {
            abort(403, 'Unauthorized access: Role belongs to different tenant');
        }
    }
}
