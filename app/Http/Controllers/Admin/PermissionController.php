<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('super.admin')->except(['index', 'show']);
    }

    /**
     * Display a listing of permissions.
     */
    public function index(Request $request): Response
    {
        $query = Permission::with(['roles'])->withCount(['roles']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('label', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%')
                    ->orWhere('module', 'like', '%'.$request->search.'%');
            });
        }

        // Filter by module
        if ($request->has('module') && $request->module) {
            $query->where('module', $request->module);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== '') {
            $query->where('is_active', $request->boolean('status'));
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 20);
        $permissions = $query->paginate($perPage);

        // Group permissions by module for better organization
        $groupedPermissions = $permissions->getCollection()->groupBy('module');

        return Inertia::render('Admin/Permissions/Index', [
            'permissions' => $permissions,
            'grouped_permissions' => $groupedPermissions,
            'modules' => $this->getPermissionModules(),
            'filters' => $request->only(['search', 'module', 'status', 'sort_by', 'sort_order', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new permission.
     */
    public function create(): Response
    {
        $roles = Role::orderBy('name')->get();
        $modules = $this->getPermissionModules();

        return Inertia::render('Admin/Permissions/Create', [
            'roles' => $roles,
            'modules' => $modules,
        ]);
    }

    /**
     * Store a newly created permission.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'module' => 'required|string|max:100',
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        // Format permission name (ensure it's lowercase with underscores)
        $permissionName = strtolower(str_replace([' ', '-'], '_', $request->name));

        $permission = Permission::create([
            'name' => $permissionName,
            'label' => $request->label,
            'description' => $request->description ?? '',
            'module' => $request->module,
            'is_active' => $request->boolean('is_active', true),
            'guard_name' => 'web',
        ]);

        // Assign to roles if provided
        if ($request->has('roles')) {
            $roles = Role::whereIn('id', $request->roles)->get();
            $permission->assignRole($roles);
        }

        return redirect()->route('admin.permissions.index')
            ->with('success', 'Permission created successfully');
    }

    /**
     * Display the specified permission.
     */
    public function show(Permission $permission): Response
    {
        $permission->load(['roles', 'users']);

        return Inertia::render('Admin/Permissions/Show', [
            'permission' => $permission,
        ]);
    }

    /**
     * Show the form for editing the specified permission.
     */
    public function edit(Permission $permission): Response
    {
        $roles = Role::orderBy('name')->get();
        $modules = $this->getPermissionModules();
        $permission->load(['roles']);

        return Inertia::render('Admin/Permissions/Edit', [
            'permission' => $permission,
            'roles' => $roles,
            'modules' => $modules,
        ]);
    }

    /**
     * Update the specified permission.
     */
    public function update(Request $request, Permission $permission): RedirectResponse
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permissions')->ignore($permission->id),
            ],
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'module' => 'required|string|max:100',
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        // Format permission name (ensure it's lowercase with underscores)
        $permissionName = strtolower(str_replace([' ', '-'], '_', $request->name));

        $permission->update([
            'name' => $permissionName,
            'label' => $request->label,
            'description' => $request->description ?? $permission->description,
            'module' => $request->module,
            'is_active' => $request->boolean('is_active', $permission->is_active),
        ]);

        // Update role assignments if provided
        if ($request->has('roles')) {
            $roles = Role::whereIn('id', $request->roles)->get();
            $permission->syncRoles($roles);
        }

        return redirect()->route('admin.permissions.index')
            ->with('success', 'Permission updated successfully');
    }

    /**
     * Remove the specified permission.
     */
    public function destroy(Permission $permission): RedirectResponse
    {
        // Check if permission is assigned to any roles
        if ($permission->roles()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete permission that is assigned to roles',
            ]);
        }

        $permission->delete();

        return redirect()->route('admin.permissions.index')
            ->with('success', 'Permission deleted successfully');
    }

    /**
     * Get all roles for assignment.
     */
    public function getRoles(): Response
    {
        $user = Auth::user();
        $query = Role::orderBy('name');

        // Non-super-admin users can't assign super_admin role
        if (! $user->hasRole('super_admin')) {
            $query->where('name', '!=', 'super_admin');
        }

        $roles = $query->get();

        return Inertia::render('Permissions/Roles', [
            'roles' => $roles,
        ]);
    }

    /**
     * Assign roles to a permission.
     */
    public function assignRoles(Request $request, Permission $permission): RedirectResponse
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,id',
        ]);

        $user = Auth::user();
        $roles = Role::whereIn('id', $request->roles)->get();

        // Prevent non-super-admin from assigning super_admin role
        if (! $user->hasRole('super_admin')) {
            $superAdminRole = $roles->where('name', 'super_admin')->first();
            if ($superAdminRole) {
                return back()->withErrors([
                    'error' => 'Unauthorized to assign super admin role',
                ]);
            }
        }

        $permission->syncRoles($roles);

        return redirect()->route('admin.permissions.show', $permission)
            ->with('success', 'Roles assigned successfully');
    }

    /**
     * Get permission statistics.
     */
    public function statistics(): Response
    {
        $totalPermissions = Permission::count();
        $assignedPermissions = Permission::whereHas('roles')->count();
        $unassignedPermissions = $totalPermissions - $assignedPermissions;

        // Permission categories
        $categories = $this->getPermissionCategories();
        $categoryStats = [];

        foreach ($categories as $category) {
            $categoryStats[$category] = Permission::where('name', 'like', '%-'.$category.'%')->count();
        }

        // Most used permissions
        $mostUsedPermissions = Permission::withCount('roles')
            ->orderBy('roles_count', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Permissions/Statistics', [
            'total_permissions' => $totalPermissions,
            'assigned_permissions' => $assignedPermissions,
            'unassigned_permissions' => $unassignedPermissions,
            'category_stats' => $categoryStats,
            'most_used_permissions' => $mostUsedPermissions,
        ]);
    }

    /**
     * Get permission modules.
     */
    private function getPermissionModules(): array
    {
        $modules = Permission::distinct()->pluck('module')->filter()->toArray();

        // Add default modules that are commonly used in the project
        $defaultModules = [
            'users',
            'roles',
            'permissions',
            'policies',
            'quotes',
            'customers',
            'reports',
            'settings',
            'dashboard',
            'billing',
            'notifications',
        ];

        return array_unique(array_merge($modules, $defaultModules));
    }

    /**
     * Get permission categories (legacy method, kept for compatibility).
     */
    private function getPermissionCategories(): array
    {
        return $this->getPermissionModules();
    }

    /**
     * Bulk create permissions.
     */
    public function bulkCreate(Request $request): RedirectResponse
    {
        $request->validate([
            'permissions' => 'required|array|min:1',
            'permissions.*.name' => 'required|string|max:255|unique:permissions,name',
            'permissions.*.description' => 'nullable|string|max:1000',
            'permissions.*.category' => 'nullable|string|max:100',
        ]);

        $createdCount = 0;

        foreach ($request->permissions as $permissionData) {
            $permissionName = strtolower(str_replace(' ', '-', $permissionData['name']));
            if (isset($permissionData['category'])) {
                $permissionName = strtolower($permissionData['category']).'-'.$permissionName;
            }

            Permission::create([
                'name' => $permissionName,
                'description' => $permissionData['description'] ?? '',
            ]);

            $createdCount++;
        }

        return redirect()->route('admin.permissions.index')
            ->with('success', $createdCount.' permissions created successfully');
    }
}
