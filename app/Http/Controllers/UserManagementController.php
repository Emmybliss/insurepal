<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('tenant.scope');
    }

    /**
     * Display a listing of users for the current tenant.
     */
    public function index(Request $request): Response
    {
        $currentUser = Auth::user();
        $currentTenant = $currentUser->tenant;
        $isSuperAdmin = $currentUser->hasRole('super_admin');

        if (! $currentTenant && ! $isSuperAdmin) {
            abort(403, 'User is not associated with any tenant');
        }

        $query = User::query()
            ->when($currentTenant, fn ($q) => $q->where('tenant_id', $currentTenant->id))
            ->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'customer');
            })
            ->with(['roles', 'permissions', 'tenant']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Sort functionality
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        // Validate sort fields to prevent SQL injection
        $allowedSortFields = ['name', 'email', 'created_at', 'updated_at', 'is_active'];
        if (! in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'created_at';
        }

        $query->orderBy($sortBy, $sortOrder);

        $users = $query->paginate(15)->withQueryString();

        // Get available roles for filtering (tenant-specific roles)
        $availableRoles = Role::when(! $isSuperAdmin, fn ($q) => $q->whereIn('name', ['underwriter', 'broker', 'staff']))
            ->when($isSuperAdmin, fn ($q) => $q->whereIn('name', ['super_admin', 'underwriter', 'broker', 'staff']))
            ->get();

        return Inertia::render('UserManagement/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'sort_by', 'sort_order']),
            'availableRoles' => $availableRoles,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        $roles = Role::whereIn('name', ['underwriter', 'broker', 'staff'])->get();

        return Inertia::render('UserManagement/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $currentTenant = Auth::user()->tenant;

        if (! $currentTenant) {
            abort(403, 'Unauthorized access');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', Rules\Password::defaults()],
            'password_confirmation' => 'required|same:password',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
            'is_active' => 'boolean',
            'send_invitation' => 'boolean',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'tenant_id' => $currentTenant->id,
            'is_active' => $request->boolean('is_active', true),
        ]);

        // Assign roles
        if ($request->roles) {
            $validRoles = Role::whereIn('id', $request->roles)
                ->whereIn('name', ['underwriter', 'broker', 'staff'])
                ->get();
            $user->syncRoles($validRoles);
        }

        // Send invitation email if requested
        if ($request->boolean('send_invitation')) {
            // TODO: Implement invitation email logic
        }

        return redirect()->route('user-management.index')
            ->with('success', 'User created successfully');
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): Response
    {
        $this->authorizeUserAccess($user);

        $user->load(['roles', 'permissions', 'tenant']);

        return Inertia::render('UserManagement/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $this->authorizeUserAccess($user);

        $roles = Role::whereIn('name', ['underwriter', 'broker', 'staff'])->get();
        $user->load(['roles', 'permissions']);

        return Inertia::render('UserManagement/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorizeUserAccess($user);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'password' => ['nullable', Rules\Password::defaults()],
            'password_confirmation' => 'nullable|same:password',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
            'is_active' => 'boolean',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'is_active' => $request->boolean('is_active', true),
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        // Update roles
        if ($request->has('roles')) {
            $validRoles = Role::whereIn('id', $request->roles)
                ->forTenant($tenant->id)
                ->active()
                ->get();
            $user->syncRoles($validRoles);
        }

        return redirect()->route('user-management.index')
            ->with('success', 'User updated successfully');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->authorizeUserAccess($user);

        // Prevent users from deleting themselves
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages([
                'user' => 'You cannot delete your own account.',
            ]);
        }

        // Check if user has associated data that would prevent deletion
        if ($user->customers()->exists() || $user->quotes()->exists() || $user->policies()->exists()) {
            throw ValidationException::withMessages([
                'user' => 'Cannot delete user with associated customer data, quotes, or policies.',
            ]);
        }

        $user->delete();

        return redirect()->route('user-management.index')
            ->with('success', 'User deleted successfully');
    }

    /**
     * Toggle user status (active/inactive).
     */
    public function toggleStatus(User $user): RedirectResponse
    {
        $this->authorizeUserAccess($user);

        // Prevent users from deactivating themselves
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages([
                'user' => 'You cannot change your own status.',
            ]);
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return redirect()->back()
            ->with('success', "User has been {$status} successfully");
    }

    /**
     * Send password reset email to user.
     */
    public function sendPasswordReset(User $user): RedirectResponse
    {
        $this->authorizeUserAccess($user);

        $status = Password::sendResetLink(['email' => $user->email]);

        if ($status === Password::RESET_LINK_SENT) {
            return redirect()->back()
                ->with('success', 'Password reset email sent successfully');
        } else {
            throw ValidationException::withMessages([
                'email' => 'Failed to send password reset email. Please try again.',
            ]);
        }
    }

    /**
     * Show role editing page for user.
     */
    public function editRoles(User $user): Response
    {
        $this->authorizeUserAccess($user);

        $tenant = Auth::user()->tenant;
        $roles = Role::forTenant($tenant->id)->active()->get();
        $user->load(['roles', 'permissions']);

        return Inertia::render('UserManagement/EditRoles', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update user roles.
     */
    public function updateRoles(Request $request, User $user): RedirectResponse
    {
        $this->authorizeUserAccess($user);

        $tenant = Auth::user()->tenant;

        $request->validate([
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ]);

        // Only allow tenant-specific roles
        $validRoles = Role::whereIn('id', $request->roles ?? [])
            ->forTenant($tenant->id)
            ->active()
            ->get();

        $user->syncRoles($validRoles);

        return redirect()->route('user-management.show', $user)
            ->with('success', 'User roles updated successfully');
    }

    /**
     * Authorize user access for tenant scope.
     */
    private function authorizeUserAccess(User $user): void
    {
        $currentUser = Auth::user();

        if (! $currentUser) {
            abort(401, 'User not authenticated');
        }

        $currentTenant = $currentUser->tenant;

        if (! $currentTenant) {
            abort(403, 'User is not associated with any tenant');
        }

        if ($user->tenant_id !== $currentTenant->id) {
            abort(403, 'Unauthorized access: User belongs to different tenant');
        }
    }
}
