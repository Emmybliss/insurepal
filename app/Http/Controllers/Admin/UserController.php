<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('super.admin');
    }

    public function index(Request $request)
    {
        $stats = [
            'total_tenants' => Tenant::count(),
            'active_tenants' => Tenant::active()->count(),
            'total_users' => User::count(),
            'total_tenant_users' => User::tenantUsers()->count(),
            'total_customers' => Customer::count(),
            'underwriters' => Tenant::byType('underwriter')->count(),
            'brokers' => Tenant::byType('broker')->count(),
            'super_admins' => User::SuperAdmins()->count(),
        ];
        $query = User::query()
            ->with(['tenant', 'roles']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        $users = $query->latest()->paginate(20)->withQueryString();

        $tenants = Tenant::select('id', 'name')->get();

        return Inertia::render('Admin/Users/Index', [
            'stats' => $stats,
            'users' => $users,
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'tenant_id']),
        ]);
    }

    public function create(): Response
    {
        $tenants = Tenant::select('id', 'name', 'type')->orderBy('name')->get();
        $roles = Role::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Admin/Users/Create', [
            'tenants' => $tenants,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'tenant_id' => 'nullable|exists:tenants,id',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
            'is_active' => 'boolean',
            'send_welcome_email' => 'boolean',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'tenant_id' => $validated['tenant_id'],
            'is_active' => $validated['is_active'] ?? true,
            'email_verified_at' => now(),
        ]);

        if (! empty($validated['roles'])) {
            $roles = Role::whereIn('id', $validated['roles'])->get();
            $user->assignRole($roles);
        }

        if ($validated['send_welcome_email'] ?? false) {
            // TODO: Implement welcome email notification
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully.');
    }

    public function show(User $user): Response
    {
        $user->load(['tenant', 'roles.permissions']);

        $stats = [
            'login_count' => 0, // implement later
            'last_login' => $user->last_login_at,
            'account_age' => $user->created_at->diffForHumans(),
            'roles_count' => $user->roles->count(),
            'permissions_count' => $user->getAllPermissions()->count(),
            'total_customers' => $user->customers()->count(), // adjust depending on relation
            'active_policies' => $user->policies()->where('status', 'active')->count(),
            'total_quotes' => $user->quotes()->count(),
        ];

        $recentActivity = []; // implement later

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'stats' => $stats,
            'recentActivity' => $recentActivity,
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load(['roles']);

        $tenants = Tenant::select('id', 'name', 'type')->orderBy('name')->get();
        $roles = Role::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'tenants' => $tenants,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'tenant_id' => 'nullable|exists:tenants,id',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
            'is_active' => 'boolean',
        ]);

        if ($user->hasRole('super_admin') && $validated['tenant_id']) {
            return back()->withErrors([
                'tenant_id' => 'Super admin users cannot be assigned to a tenant.',
            ]);
        }

        if ($user->hasRole('super_admin') && ! empty($validated['roles'])) {
            $superAdminRole = Role::where('name', 'super_admin')->first();
            if ($superAdminRole && ! in_array($superAdminRole->id, $validated['roles'])) {
                return back()->withErrors([
                    'roles' => 'Cannot remove super admin role from this user.',
                ]);
            }
        }

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'tenant_id' => $validated['tenant_id'],
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        if (isset($validated['roles'])) {
            $roles = Role::whereIn('id', $validated['roles'])->get();
            $user->syncRoles($roles);
        }

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $authUser = Auth::user();

        if ($user->id === $authUser->id) {
            return back()->withErrors([
                'error' => 'You cannot delete your own account.',
            ]);
        }

        if ($user->hasRole('super_admin')) {
            $superAdminCount = User::role('super_admin')->count();
            if ($superAdminCount <= 1) {
                return back()->withErrors([
                    'error' => 'Cannot delete the last super admin user.',
                ]);
            }
        }

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        $authUser = Auth::user();

        if ($user->id === $authUser->id) {
            return back()->withErrors([
                'error' => 'You cannot deactivate your own account.',
            ]);
        }

        if ($user->hasRole('super_admin') && $user->is_active) {
            $activeSuperAdminCount = User::role('super_admin')->where('is_active', true)->count();
            if ($activeSuperAdminCount <= 1) {
                return back()->withErrors([
                    'error' => 'Cannot deactivate the last active super admin user.',
                ]);
            }
        }

        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "User {$status} successfully.");
    }

    public function resendVerification(User $user): RedirectResponse
    {
        if ($user->hasVerifiedEmail()) {
            return back()->withErrors([
                'error' => 'User email is already verified.',
            ]);
        }

        $user->sendEmailVerificationNotification();

        return back()->with('success', 'Verification email sent successfully.');
    }

    public function forceVerifyEmail(User $user): RedirectResponse
    {
        if ($user->hasVerifiedEmail()) {
            return back()->withErrors([
                'error' => 'User email is already verified.',
            ]);
        }

        $user->markEmailAsVerified();

        return back()->with('success', 'User email verified successfully.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:activate,deactivate,delete,verify_email',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        $users = User::whereIn('id', $validated['user_ids'])->get();
        $authUser = Auth::user();

        if ($users->contains('id', $authUser->id)) {
            return back()->withErrors([
                'error' => 'You cannot perform bulk actions on your own account.',
            ]);
        }

        $actionCount = 0;

        foreach ($users as $user) {
            switch ($validated['action']) {
                case 'activate':
                    if (! $user->is_active) {
                        $user->update(['is_active' => true]);
                        $actionCount++;
                    }
                    break;

                case 'deactivate':
                    if (! $user->hasRole('super_admin') && $user->is_active) {
                        $user->update(['is_active' => false]);
                        $actionCount++;
                    }
                    break;

                case 'delete':
                    if (! $user->hasRole('super_admin')) {
                        $user->delete();
                        $actionCount++;
                    }
                    break;

                case 'verify_email':
                    if (! $user->hasVerifiedEmail()) {
                        $user->markEmailAsVerified();
                        $actionCount++;
                    }
                    break;
            }
        }

        $actionName = match ($validated['action']) {
            'activate' => 'activated',
            'deactivate' => 'deactivated',
            'delete' => 'deleted',
            'verify_email' => 'verified',
        };

        return back()->with('success', "{$actionCount} users {$actionName} successfully.");
    }
}
