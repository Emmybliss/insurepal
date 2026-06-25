<?php

namespace App\Http\Controllers;

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
        $query = Permission::with(['roles']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('name', 'like', '%-'.$request->category.'%');
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 20);
        $permissions = $query->paginate($perPage);

        // Group permissions by category for better organization
        $groupedPermissions = $permissions->getCollection()->groupBy(function ($permission) {
            $parts = explode('-', $permission->name);

            return count($parts) > 1 ? $parts[1] : 'general';
        });

        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,
            'grouped_permissions' => $groupedPermissions,
            'categories' => $this->getPermissionCategories(),
            'filters' => $request->only(['search', 'category', 'sort_by', 'sort_order', 'per_page']),
        ]);
    }

    /**
     * Store a newly created permission.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions,name',
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:100',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        // Format permission name
        $permissionName = strtolower(str_replace(' ', '-', $request->name));
        if ($request->category) {
            $permissionName = strtolower($request->category).'-'.$permissionName;
        }

        $permission = Permission::create([
            'name' => $permissionName,
            'description' => $request->description ?? '',
        ]);

        // Assign to roles if provided
        if ($request->has('roles')) {
            $roles = Role::whereIn('id', $request->roles)->get();
            $permission->assignRole($roles);
        }

        return redirect()->route('permissions.index')
            ->with('success', 'Permission created successfully');
    }

    /**
     * Display the specified permission.
     */
    public function show(Permission $permission): Response
    {
        $permission->load(['roles', 'users']);

        return Inertia::render('Permissions/Show', [
            'permission' => $permission,
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
            'description' => 'nullable|string|max:1000',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        $permission->update([
            'name' => strtolower(str_replace(' ', '-', $request->name)),
            'description' => $request->description ?? $permission->description,
        ]);

        // Update role assignments if provided
        if ($request->has('roles')) {
            $roles = Role::whereIn('id', $request->roles)->get();
            $permission->syncRoles($roles);
        }

        return redirect()->route('permissions.index')
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

        return redirect()->route('permissions.index')
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

        return redirect()->route('permissions.show', $permission)
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
     * Get permission categories.
     */
    private function getPermissionCategories(): array
    {
        $permissions = Permission::pluck('name');
        $categories = [];

        foreach ($permissions as $permission) {
            $parts = explode('-', $permission);
            if (count($parts) > 1) {
                $category = $parts[1];
                if (! in_array($category, $categories)) {
                    $categories[] = $category;
                }
            }
        }

        return array_unique($categories);
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

        return redirect()->route('permissions.index')
            ->with('success', $createdCount.' permissions created successfully');
    }
}
