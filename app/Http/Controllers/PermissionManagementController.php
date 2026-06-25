<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PermissionManagementController extends Controller
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

        $query = Permission::forTenant($tenant->id)
            ->with(['roles'])
            ->withCount(['roles']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('display_name', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%")
                    ->orWhere('category', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->byCategory($request->category);
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

        $permissions = $query->orderBy('category')->orderBy('name')->paginate(15);

        $categories = Permission::forTenant($tenant->id)
            ->select('category')
            ->distinct()
            ->whereNotNull('category')
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('PermissionManagement/Index', [
            'permissions' => $permissions,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'system', 'status']),
            'stats' => [
                'total' => Permission::forTenant($tenant->id)->count(),
                'active' => Permission::forTenant($tenant->id)->active()->count(),
                'system' => Permission::forTenant($tenant->id)->system()->count(),
                'custom' => Permission::forTenant($tenant->id)->nonSystem()->count(),
                'categories' => Permission::forTenant($tenant->id)->distinct('category')->count('category'),
            ],
        ]);
    }

    public function create()
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant associated');
        }

        $categories = Permission::forTenant($tenant->id)
            ->select('category')
            ->distinct()
            ->whereNotNull('category')
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('PermissionManagement/Create', [
            'categories' => $categories,
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
                Rule::unique('permissions')->where('tenant_id', $tenant->id),
            ],
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        Permission::create([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'category' => $request->category,
            'guard_name' => 'web',
            'tenant_id' => $tenant->id,
            'is_system_permission' => false,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('permission-management.index')
            ->with('success', 'Permission created successfully');
    }

    public function show(Permission $permission)
    {
        $this->authorizePermissionAccess($permission);

        $permission->load(['roles']);

        return Inertia::render('PermissionManagement/Show', [
            'permission' => $permission,
        ]);
    }

    public function edit(Permission $permission)
    {
        $this->authorizePermissionAccess($permission);

        if ($permission->isSystemPermission()) {
            abort(403, 'Cannot edit system permissions');
        }

        $tenant = Auth::user()->tenant;

        $categories = Permission::forTenant($tenant->id)
            ->select('category')
            ->distinct()
            ->whereNotNull('category')
            ->orderBy('category')
            ->pluck('category');

        return Inertia::render('PermissionManagement/Edit', [
            'permission' => $permission,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, Permission $permission)
    {
        $this->authorizePermissionAccess($permission);

        if ($permission->isSystemPermission()) {
            abort(403, 'Cannot edit system permissions');
        }

        $tenant = Auth::user()->tenant;

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permissions')->where('tenant_id', $tenant->id)->ignore($permission->id),
            ],
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $permission->update([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'category' => $request->category,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('permission-management.index')
            ->with('success', 'Permission updated successfully');
    }

    public function destroy(Permission $permission)
    {
        $this->authorizePermissionAccess($permission);

        if ($permission->isSystemPermission()) {
            abort(403, 'Cannot delete system permissions');
        }

        if ($permission->roles()->exists()) {
            return redirect()->back()
                ->withErrors(['permission' => 'Cannot delete permission that is assigned to roles']);
        }

        $permission->delete();

        return redirect()->route('permission-management.index')
            ->with('success', 'Permission deleted successfully');
    }

    public function toggleStatus(Permission $permission)
    {
        $this->authorizePermissionAccess($permission);

        if ($permission->isSystemPermission()) {
            abort(403, 'Cannot modify system permission status');
        }

        $permission->update(['is_active' => ! $permission->is_active]);

        $status = $permission->is_active ? 'activated' : 'deactivated';

        return redirect()->back()
            ->with('success', "Permission {$status} successfully");
    }

    private function authorizePermissionAccess(Permission $permission): void
    {
        $tenant = Auth::user()->tenant;

        if (! $tenant) {
            abort(403, 'Access denied: No tenant associated');
        }

        if ($permission->tenant_id !== $tenant->id) {
            abort(403, 'Unauthorized access: Permission belongs to different tenant');
        }
    }
}
