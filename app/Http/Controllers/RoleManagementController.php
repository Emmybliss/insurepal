<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RoleManagementController extends Controller
{
    public function __construct()
    {
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
            ->withCount(['permissions']);

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

        $permissions = Permission::forTenant($tenant->id)
            ->active()
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        return Inertia::render('RoleManagement/Create', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant associated');
        }

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles')->where('tenant_id', $tenant->id),
            ],
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
            'is_active' => 'boolean',
        ]);

        DB::transaction(function () use ($request, $tenant) {
            $role = Role::create([
                'name' => $request->name,
                'display_name' => $request->display_name,
                'description' => $request->description,
                'guard_name' => 'web',
                'tenant_id' => $tenant->id,
                'is_system_role' => false,
                'is_active' => $request->boolean('is_active', true),
            ]);

            if ($request->permissions) {
                $permissions = Permission::whereIn('id', $request->permissions)
                    ->forTenant($tenant->id)
                    ->get();
                $role->syncPermissions($permissions);
            }
        });

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

        if ($role->isSystemRole()) {
            abort(403, 'Cannot edit system roles');
        }

        $tenant = Auth::user()->tenant;

        $permissions = Permission::forTenant($tenant->id)
            ->active()
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        $role->load('permissions');

        return Inertia::render('RoleManagement/Edit', [
            'role' => $role,
            'permissions' => $permissions,
            'rolePermissions' => $role->permissions->pluck('id')->toArray(),
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $this->authorizeRoleAccess($role);

        if ($role->isSystemRole()) {
            abort(403, 'Cannot edit system roles');
        }

        $tenant = Auth::user()->tenant;

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles')->where('tenant_id', $tenant->id)->ignore($role->id),
            ],
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
            'is_active' => 'boolean',
        ]);

        DB::transaction(function () use ($request, $role, $tenant) {
            $role->update([
                'name' => $request->name,
                'display_name' => $request->display_name,
                'description' => $request->description,
                'is_active' => $request->boolean('is_active', true),
            ]);

            if ($request->has('permissions')) {
                $permissions = Permission::whereIn('id', $request->permissions ?? [])
                    ->forTenant($tenant->id)
                    ->get();
                $role->syncPermissions($permissions);
            }
        });

        return redirect()->route('role-management.index')
            ->with('success', 'Role updated successfully');
    }

    public function destroy(Role $role)
    {
        $this->authorizeRoleAccess($role);

        if ($role->isSystemRole()) {
            abort(403, 'Cannot delete system roles');
        }

        if ($role->users()->exists()) {
            return redirect()->back()
                ->withErrors(['role' => 'Cannot delete role that is assigned to users']);
        }

        $role->delete();

        return redirect()->route('role-management.index')
            ->with('success', 'Role deleted successfully');
    }

    public function toggleStatus(Role $role)
    {
        $this->authorizeRoleAccess($role);

        if ($role->isSystemRole()) {
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

        if ($role->tenant_id !== $tenant->id) {
            abort(403, 'Unauthorized access: Role belongs to different tenant');
        }
    }
}
