<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class UserRoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display users with their roles and permissions.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        $query = User::with(['roles.permissions']);

        // Tenant-based filtering
        if (! $user->hasRole('super_admin') && $user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('email', 'like', '%'.$request->search.'%');
            });
        }

        // Filter by role
        if ($request->has('role') && $request->role) {
            $query->role($request->role);
        }

        // Filter by tenant (super admin only)
        if ($request->has('tenant_id') && $request->tenant_id && $user->hasRole('super_admin')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $users = $query->paginate($perPage);

        // Stats
        $totalUsers = $user->hasRole('super_admin') ? User::count() : User::where('tenant_id', $user->tenant_id)->count();
        $usersWithRoles = $user->hasRole('super_admin')
            ? User::whereHas('roles')->count()
            : User::where('tenant_id', $user->tenant_id)->whereHas('roles')->count();
        $activeRoles = Role::where('is_active', true)->count();

        // Available roles for filtering
        $rolesQuery = Role::where('is_active', true);
        if (! $user->hasRole('super_admin')) {
            $rolesQuery->where('name', '!=', 'super_admin');
        }
        $roles = $rolesQuery->get();

        return Inertia::render('Admin/UserRoles/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role', 'tenant_id', 'sort_by', 'sort_order', 'per_page']),
            'stats' => [
                'total_users' => $totalUsers,
                'users_with_roles' => $usersWithRoles,
                'active_roles' => $activeRoles,
            ],
        ]);
    }

    /**
     * Show the form for creating a new user role assignment.
     */
    public function create()
    {
        $user = Auth::user();

        // Get available users
        $usersQuery = User::query();
        if (! $user->hasRole('super_admin') && $user->tenant_id) {
            $usersQuery->where('tenant_id', $user->tenant_id);
        }
        $users = $usersQuery->orderBy('name')->get();

        // Get available roles
        $rolesQuery = Role::where('is_active', true)->withCount('permissions');
        if (! $user->hasRole('super_admin')) {
            $rolesQuery->where('name', '!=', 'super_admin');
        }
        $roles = $rolesQuery->get();

        return Inertia::render('Admin/UserRoles/Create', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user role assignment.
     */
    public function store(Request $request)
    {
        $authUser = Auth::user();

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,id',
        ]);

        $user = User::findOrFail($validated['user_id']);

        // Authorization check
        if (! $authUser->hasRole('super_admin') && $authUser->tenant_id !== $user->tenant_id) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify this user',
            ]);
        }

        $roles = Role::whereIn('id', $validated['roles'])->get();

        // Prevent non-super-admin from assigning super_admin role
        if (! $authUser->hasRole('super_admin')) {
            $superAdminRole = $roles->where('name', 'super_admin')->first();
            if ($superAdminRole) {
                return back()->withErrors([
                    'error' => 'Unauthorized to assign super admin role',
                ]);
            }
        }

        // Add roles to user (not replacing existing ones)
        foreach ($roles as $role) {
            $user->assignRole($role);
        }

        return redirect()->route('admin.user-roles.index')
            ->with('success', 'Roles assigned successfully.');
    }

    /**
     * Display the specified user with roles and permissions.
     */
    public function show(User $user): Response
    {
        $authUser = Auth::user();

        // Authorization check
        if (! $authUser->hasRole('super_admin') && $authUser->tenant_id !== $user->tenant_id) {
            abort(403, 'Unauthorized to view this user');
        }

        $user->load(['roles.permissions']);

        return Inertia::render('Admin/UserRoles/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing user roles.
     */
    public function edit(User $user)
    {
        $authUser = Auth::user();

        // Authorization check
        if (! $authUser->hasRole('super_admin') && $authUser->tenant_id !== $user->tenant_id) {
            abort(403, 'Unauthorized to edit this user');
        }

        $user->load(['roles']);

        // Get available roles
        $rolesQuery = Role::where('is_active', true)->withCount('permissions');
        if (! $authUser->hasRole('super_admin')) {
            $rolesQuery->where('name', '!=', 'super_admin');
        }
        $roles = $rolesQuery->get();

        return Inertia::render('Admin/UserRoles/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update user roles.
     */
    public function update(Request $request, User $user)
    {
        $authUser = Auth::user();

        // Authorization check
        if (! $authUser->hasRole('super_admin') && $authUser->tenant_id !== $user->tenant_id) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify this user',
            ]);
        }

        $validated = $request->validate([
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        $roles = Role::whereIn('id', $validated['roles'] ?? [])->get();

        // Prevent non-super-admin from assigning super_admin role
        if (! $authUser->hasRole('super_admin')) {
            $superAdminRole = $roles->where('name', 'super_admin')->first();
            if ($superAdminRole) {
                return back()->withErrors([
                    'error' => 'Unauthorized to assign super admin role',
                ]);
            }
        }

        // Prevent modifying super admin user (except by super admin)
        if ($user->hasRole('super_admin') && ! $authUser->hasRole('super_admin')) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify super admin user',
            ]);
        }

        $user->syncRoles($roles);

        return redirect()->route('admin.user-roles.index')
            ->with('success', 'User roles updated successfully.');
    }

    /**
     * Assign roles to a user.
     */
    public function assignRoles(Request $request, User $user): RedirectResponse
    {
        $authUser = Auth::user();

        // Authorization check
        if (! $authUser->hasRole('super_admin') && $authUser->tenant_id !== $user->tenant_id) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify this user',
            ]);
        }

        $request->validate([
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,id',
        ]);

        $roles = Role::whereIn('id', $request->roles)->get();

        // Prevent non-super-admin from assigning super_admin role
        if (! $authUser->hasRole('super_admin')) {
            $superAdminRole = $roles->where('name', 'super_admin')->first();
            if ($superAdminRole) {
                return back()->withErrors([
                    'error' => 'Unauthorized to assign super admin role',
                ]);
            }
        }

        // Prevent assigning roles to super admin user (except by super admin)
        if ($user->hasRole('super_admin') && ! $authUser->hasRole('super_admin')) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify super admin user',
            ]);
        }

        $user->syncRoles($roles);

        return redirect()->route('admin.user-roles.show', $user)
            ->with('success', 'Roles assigned successfully');
    }

    /**
     * Assign permissions directly to a user.
     */
    public function assignPermissions(Request $request, User $user): RedirectResponse
    {
        $authUser = Auth::user();

        // Authorization check
        if (! $authUser->hasRole('super_admin') && $authUser->tenant_id !== $user->tenant_id) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify this user',
            ]);
        }

        $request->validate([
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'exists:permissions,id',
        ]);

        // Prevent assigning permissions to super admin user (except by super admin)
        if ($user->hasRole('super_admin') && ! $authUser->hasRole('super_admin')) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify super admin user',
            ]);
        }

        $permissions = Permission::whereIn('id', $request->permissions)->get();
        $user->syncPermissions($permissions);

        return redirect()->route('admin.user-roles.show', $user)
            ->with('success', 'Permissions assigned successfully');
    }

    /**
     * Remove a role from a user.
     */
    public function removeRole(Request $request, User $user): RedirectResponse
    {
        $authUser = Auth::user();

        // Authorization check
        if (! $authUser->hasRole('super_admin') && $authUser->tenant_id !== $user->tenant_id) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify this user',
            ]);
        }

        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $role = Role::findOrFail($request->role_id);

        // Prevent removing super_admin role by non-super-admin
        if ($role->name === 'super_admin' && ! $authUser->hasRole('super_admin')) {
            return back()->withErrors([
                'error' => 'Unauthorized to remove super admin role',
            ]);
        }

        $user->removeRole($role);

        return redirect()->route('admin.user-roles.show', $user)
            ->with('success', 'Role removed successfully');
    }

    /**
     * Remove a permission from a user.
     */
    public function removePermission(Request $request, User $user): RedirectResponse
    {
        $authUser = Auth::user();

        // Authorization check
        if (! $authUser->hasRole('super_admin') && $authUser->tenant_id !== $user->tenant_id) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify this user',
            ]);
        }

        $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);

        $permission = Permission::findOrFail($request->permission_id);

        // Prevent modifying super admin user (except by super admin)
        if ($user->hasRole('super_admin') && ! $authUser->hasRole('super_admin')) {
            return back()->withErrors([
                'error' => 'Unauthorized to modify super admin user',
            ]);
        }

        $user->revokePermissionTo($permission);

        return redirect()->route('admin.user-roles.show', $user)
            ->with('success', 'Permission removed successfully');
    }

    /**
     * Get available roles for assignment.
     */
    public function getAvailableRoles(Request $request): Response
    {
        $user = Auth::user();
        $query = Role::orderBy('name');

        // Non-super-admin users can't assign super_admin role
        if (! $user->hasRole('super_admin')) {
            $query->where('name', '!=', 'super_admin');
        }

        $roles = $query->get();

        return Inertia::render('Admin/UserRoles/AvailableRoles', [
            'roles' => $roles,
        ]);
    }

    /**
     * Get available permissions for assignment.
     */
    public function getAvailablePermissions(Request $request): Response
    {
        $permissions = Permission::orderBy('name')->get();

        // Group permissions by category
        $groupedPermissions = $permissions->groupBy(function ($permission) {
            $parts = explode('-', $permission->name);

            return count($parts) > 1 ? $parts[1] : 'general';
        });

        return Inertia::render('Admin/UserRoles/AvailablePermissions', [
            'permissions' => $permissions,
            'grouped_permissions' => $groupedPermissions,
        ]);
    }

    /**
     * Bulk assign roles to multiple users.
     */
    public function bulkAssignRoles(Request $request): RedirectResponse
    {
        $authUser = Auth::user();

        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $users = User::whereIn('id', $request->user_ids)->get();
        $roles = Role::whereIn('id', $request->role_ids)->get();

        // Authorization checks
        foreach ($users as $user) {
            if (! $authUser->hasRole('super_admin') && $authUser->tenant_id !== $user->tenant_id) {
                return back()->withErrors([
                    'error' => 'Unauthorized to modify some users',
                ]);
            }
        }

        // Prevent non-super-admin from assigning super_admin role
        if (! $authUser->hasRole('super_admin')) {
            $superAdminRole = $roles->where('name', 'super_admin')->first();
            if ($superAdminRole) {
                return back()->withErrors([
                    'error' => 'Unauthorized to assign super admin role',
                ]);
            }
        }

        foreach ($users as $user) {
            $user->syncRoles($roles);
        }

        return redirect()->route('admin.user-roles.index')
            ->with('success', 'Roles assigned to '.count($users).' users successfully');
    }

    /**
     * Get user role statistics.
     */
    public function statistics(): Response
    {
        $user = Auth::user();
        $query = User::query();

        // Tenant-based filtering
        if (! $user->hasRole('super_admin') && $user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }

        $totalUsers = $query->count();
        $usersWithRoles = $query->whereHas('roles')->count();
        $usersWithoutRoles = $totalUsers - $usersWithRoles;

        // Role distribution
        $roleDistribution = Role::withCount(['users' => function ($q) use ($user) {
            if (! $user->hasRole('super_admin') && $user->tenant_id) {
                $q->where('tenant_id', $user->tenant_id);
            }
        }])->get()->map(function ($role) {
            return [
                'name' => $role->name,
                'users_count' => $role->users_count,
            ];
        });

        return Inertia::render('Admin/UserRoles/Statistics', [
            'total_users' => $totalUsers,
            'users_with_roles' => $usersWithRoles,
            'users_without_roles' => $usersWithoutRoles,
            'role_distribution' => $roleDistribution,
        ]);
    }
}
