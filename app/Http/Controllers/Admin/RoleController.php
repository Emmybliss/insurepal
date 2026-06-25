<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Super admin can see all roles, others only see non-super admin roles
        $query = Role::with(['permissions'])->withCount(['permissions', 'users']);

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
            // 'active_roles' => Role::where()->count(),
            'user_role' => $user->getRoleNames()->toArray(),
            'user_id' => $user->id,
            'query_sql' => $query->toSql(),
            'total_roles' => Role::count(),
        ]);

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'total_roles' => Role::count(),
            'filters' => $request->only(['search', 'sort_by', 'sort_order', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create()
    {
        $permissions = Permission::query()
            ->get()
            ->groupBy('module')
            ->map->values(); // reset keys for clean JSON arrays

        return Inertia::render('Admin/Roles/Create', [
            'grouped_permissions' => $permissions,
            'total_permissions' => $permissions->flatten(1)->count(),
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string',
            'guard_name' => 'string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        if (! empty($validated['permissions'])) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        return redirect()->route('admin.roles.index')->with('success', 'Role created successfully.');
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

        return Inertia::render('Admin/Roles/Show', [
            'role' => $role,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role)
    {
        $permissions = Permission::all();
        $permissionModules = $permissions->groupBy('module');

        return Inertia::render('Admin/Roles/Edit', [
            'role' => $role->load('permissions'),
            'permissions' => $permissions,
            'permissionModules' => $permissionModules, // ✅ matches TSX
        ]);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,'.$role->id,
            'description' => 'nullable|string',
            'guard_name' => 'string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'guard_name' => $validated['guard_name'] ?? $role->guard_name,
        ]);

        if (isset($validated['permissions'])) {
            $permissions = Permission::whereIn('id', $validated['permissions'])->get();
            $role->syncPermissions($permissions);
        }

        return redirect()->route('admin.roles.index')->with('success', 'Role updated successfully.');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role)
    {
        // Prevent deletion of essential roles
        $protectedRoles = ['super_admin', 'underwriter', 'broker', 'staff', 'customer'];

        if (in_array($role->name, $protectedRoles)) {
            return redirect()->route('admin.roles.index')->with('error', 'Cannot delete system role.');
        }

        $role->delete();

        return redirect()->route('admin.roles.index')->with('success', 'Role deleted successfully.');
    }
}
