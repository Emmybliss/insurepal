<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of roles.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Super admin can see all roles, others only see non-super admin roles
        $query = Role::with(['permissions']);

        if (! $user->hasRole('super_admin')) {
            $query->where('name', '!=', 'super_admin');
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $roles = $query->paginate($perPage);

        // Debug logging
        Log::info('Roles data being passed to Inertia:', [
            'roles_count' => $roles->count(),
            'total' => $roles->total(),
            'current_page' => $roles->currentPage(),
            'user_role' => $user->getRoleNames()->toArray(),
            'user_id' => $user->id,
            'query_sql' => $query->toSql(),
            'all_roles_count' => Role::count(),
        ]);

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'filters' => $request->only(['search', 'sort_by', 'sort_order', 'per_page']),
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = Auth::user();

        // Prevent non-super-admin from creating super_admin role
        if (! $user->hasRole('super_admin') && $validated['name'] === 'super_admin') {
            return back()->withErrors([
                'name' => 'Unauthorized to create super admin role',
            ]);
        }

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
        ]);

        // Assign permissions if provided
        if ($request->has('permissions')) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        return redirect()->route('roles.index')
            ->with('success', 'Role created successfully');
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response
    {
        $user = Auth::user();

        // Prevent non-super-admin from viewing super_admin role
        if (! $user->hasRole('super_admin') && $role->name === 'super_admin') {
            abort(403, 'Unauthorized to view this role');
        }

        $role->load(['permissions', 'users']);

        return Inertia::render('Roles/Show', [
            'role' => $role,
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $validated = $request->validated();

        $user = Auth::user();

        // Prevent non-super-admin from updating super_admin role
        if (! $user->hasRole('super_admin') && $role->name === 'super_admin') {
            return back()->withErrors([
                'error' => 'Unauthorized to update this role',
            ]);
        }

        // Prevent renaming super_admin role
        if ($role->name === 'super_admin' && $validated['name'] !== 'super_admin') {
            return back()->withErrors([
                'name' => 'Cannot rename super admin role',
            ]);
        }

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? $role->description,
        ]);

        // Update permissions if provided
        if ($request->has('permissions')) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        return redirect()->route('roles.index')
            ->with('success', 'Role updated successfully');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): RedirectResponse
    {
        $user = Auth::user();

        // Prevent deletion of super_admin role
        if ($role->name === 'super_admin') {
            return back()->withErrors([
                'error' => 'Cannot delete super admin role',
            ]);
        }

        // Prevent non-super-admin from deleting certain roles
        $protectedRoles = ['underwriter', 'broker'];
        if (! $user->hasRole('super_admin') && in_array($role->name, $protectedRoles)) {
            return back()->withErrors([
                'error' => 'Unauthorized to delete this role',
            ]);
        }

        // Check if role has users assigned
        if ($role->users()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete role that has users assigned to it',
            ]);
        }

        $role->delete();

        return redirect()->route('roles.index')
            ->with('success', 'Role deleted successfully');
    }

    /**
     * Get all available permissions.
     */
    public function getPermissions(): Response
    {
        $permissions = Permission::orderBy('name')->get();

        // Group permissions by category
        $groupedPermissions = $permissions->groupBy(function ($permission) {
            $parts = explode('-', $permission->name);

            return count($parts) > 1 ? $parts[1] : 'general';
        });

        return Inertia::render('Roles/Permissions', [
            'permissions' => $permissions,
            'grouped_permissions' => $groupedPermissions,
        ]);
    }

    /**
     * Assign permissions to a role.
     */
    public function assignPermissions(Request $request, Role $role): RedirectResponse
    {
        $user = Auth::user();

        // Prevent non-super-admin from modifying super_admin role
        if (! $user->hasRole('super_admin') && $role->name === 'super_admin') {
            return back()->withErrors([
                'error' => 'Unauthorized to modify this role',
            ]);
        }

        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $permissions = Permission::whereIn('id', $request->permissions)->get();
        $role->syncPermissions($permissions);

        return redirect()->route('roles.show', $role)
            ->with('success', 'Permissions assigned successfully');
    }

    /**
     * Get role statistics.
     */
    public function statistics(): Response
    {
        $user = Auth::user();

        $query = Role::query();

        if (! $user->hasRole('super_admin')) {
            $query->where('name', '!=', 'super_admin');
        }

        $totalRoles = $query->count();
        $activeRoles = $query->whereHas('users')->count();
        $inactiveRoles = $totalRoles - $activeRoles;

        // Role distribution
        $roleDistribution = $query->withCount('users')->get()->map(function ($role) {
            return [
                'name' => $role->name,
                'users_count' => $role->users_count,
            ];
        });

        return Inertia::render('Roles/Statistics', [
            'total_roles' => $totalRoles,
            'active_roles' => $activeRoles,
            'inactive_roles' => $inactiveRoles,
            'role_distribution' => $roleDistribution,
        ]);
    }
}
