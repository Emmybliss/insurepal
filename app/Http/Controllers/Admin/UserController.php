<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Customer;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\UserVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        protected UserVerificationService $verificationService
    ) {
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
            'super_admins' => User::superAdmins()->count(),
            'pending_verification' => User::whereNull('email_verified_at')->orWhere('status', 'pending_verification')->count(),
            'manually_approved' => User::where('approval_method', 'manual')->count(),
            'email_verified' => User::where('approval_method', 'email')->whereNotNull('email_verified_at')->count(),
        ];

        $query = User::query()
            ->with(['tenant', 'roles', 'approvedBy']);

        // Search by name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by tenant
        if ($request->filled('tenant_id')) {
            if ($request->tenant_id === 'none') {
                $query->whereNull('tenant_id');
            } else {
                $query->where('tenant_id', $request->tenant_id);
            }
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Filter by user lifecycle status
        if ($request->filled('status')) {
            switch ($request->status) {
                case 'pending_verification':
                    $query->where(function ($q) {
                        $q->where('status', 'pending_verification')
                            ->orWhereNull('email_verified_at');
                    });
                    break;
                case 'active':
                    $query->where('status', 'active')->where('is_active', true);
                    break;
                case 'suspended':
                    $query->where('status', 'suspended')->orWhere(function ($q) {
                        $q->where('is_active', false)->where('status', '!=', 'disabled');
                    });
                    break;
                case 'disabled':
                    $query->where('status', 'disabled');
                    break;
            }
        }

        // Filter by email verification status
        if ($request->filled('verification_status')) {
            if ($request->verification_status === 'verified') {
                $query->whereNotNull('email_verified_at');
            } elseif ($request->verification_status === 'unverified') {
                $query->whereNull('email_verified_at');
            }
        }

        // Filter by approval method
        if ($request->filled('approval_method')) {
            $query->where('approval_method', $request->approval_method);
        }

        $users = $query->latest()->paginate(20)->withQueryString();

        $tenants = Tenant::select('id', 'name', 'type')->orderBy('name')->get();

        return Inertia::render('Admin/Users/Index', [
            'stats' => $stats,
            'users' => $users,
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'tenant_id', 'role', 'status', 'verification_status', 'approval_method']),
        ]);
    }

    public function create(): Response
    {
        $tenants = Tenant::select('id', 'name', 'type')->orderBy('name')->get();
        $roles = Role::where('is_active', true)->withCount('permissions')->orderBy('name')->get();

        return Inertia::render('Admin/Users/Create', [
            'tenants' => $tenants,
            'roles' => $roles,
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'tenant_id' => $validated['tenant_id'],
            'is_active' => $validated['is_active'] ?? true,
            'status' => 'pending_verification',
        ]);

        if (! empty($validated['roles'])) {
            $roles = Role::whereIn('id', $validated['roles'])->get();
            $user->assignRole($roles);
        }

        // Send verification notification
        $this->verificationService->sendVerificationNotification($user);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully and verification email sent.');
    }

    public function show(User $user): Response
    {
        $user->load(['tenant', 'roles.permissions', 'approvedBy', 'auditLogs.user']);

        $stats = [
            'login_count' => 0,
            'last_login' => $user->last_login_at,
            'account_age' => $user->created_at->diffForHumans(),
            'roles_count' => $user->roles->count(),
            'permissions_count' => $user->getAllPermissions()->count(),
            'total_customers' => $user->customers()->count(),
            'active_policies' => $user->policies()->where('status', 'active')->count(),
            'total_quotes' => $user->quotes()->count(),
        ];

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'stats' => $stats,
            'auditLogs' => $user->auditLogs()->with('user')->latest()->limit(50)->get(),
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load(['roles']);

        $tenants = Tenant::select('id', 'name', 'type')->orderBy('name')->get();
        $roles = Role::where('is_active', true)->withCount('permissions')->orderBy('name')->get();

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'tenants' => $tenants,
            'roles' => $roles,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

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

        $newActiveState = ! $user->is_active;
        $user->update([
            'is_active' => $newActiveState,
            'status' => $newActiveState ? ($user->hasVerifiedEmail() ? 'active' : 'pending_verification') : 'suspended',
        ]);

        $user->logActivity(
            action: $newActiveState ? 'account_activated' : 'account_suspended',
            description: "User account {$user->name} was ".($newActiveState ? 'activated' : 'suspended').' by Super Admin',
            user: $authUser
        );

        $status = $newActiveState ? 'activated' : 'deactivated';

        return back()->with('success', "User {$status} successfully.");
    }

    public function resendVerification(User $user): RedirectResponse
    {
        $this->verificationService->resendVerificationNotification($user, Auth::user());

        return back()->with('success', 'Verification email sent successfully.');
    }

    public function forceVerifyEmail(User $user): RedirectResponse
    {
        $this->verificationService->approveManually($user, Auth::user());

        return back()->with('success', 'User manually approved and email marked as verified.');
    }

    public function rejectUser(Request $request, User $user): RedirectResponse
    {
        $reason = $request->input('reason');
        $this->verificationService->rejectUser($user, Auth::user(), $reason);

        return back()->with('success', 'User registration request rejected.');
    }

    public function revokeVerification(User $user): RedirectResponse
    {
        $this->verificationService->revokeVerification($user, Auth::user());

        return back()->with('success', 'User verification revoked successfully.');
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:activate,deactivate,delete,verify_email,resend_verification,reject',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'reason' => 'nullable|string|max:500',
        ]);

        $users = User::whereIn('id', $validated['user_ids'])->get();
        $authUser = Auth::user();

        if ($users->contains('id', $authUser->id)) {
            return back()->withErrors([
                'error' => 'You cannot perform bulk actions on your own account.',
            ]);
        }

        $actionCount = 0;

        switch ($validated['action']) {
            case 'verify_email':
                $actionCount = $this->verificationService->bulkApprove($validated['user_ids'], $authUser);
                $actionName = 'manually approved';
                break;

            case 'resend_verification':
                $actionCount = $this->verificationService->bulkResendVerification($validated['user_ids'], $authUser);
                $actionName = 'verification emails sent';
                break;

            case 'reject':
                foreach ($users as $user) {
                    if (! $user->hasRole('super_admin')) {
                        $this->verificationService->rejectUser($user, $authUser, $validated['reason'] ?? null);
                        $actionCount++;
                    }
                }
                $actionName = 'rejected';
                break;

            case 'activate':
                foreach ($users as $user) {
                    if (! $user->is_active) {
                        $user->update([
                            'is_active' => true,
                            'status' => $user->hasVerifiedEmail() ? 'active' : 'pending_verification',
                        ]);
                        $actionCount++;
                    }
                }
                $actionName = 'activated';
                break;

            case 'deactivate':
                foreach ($users as $user) {
                    if (! $user->hasRole('super_admin') && $user->is_active) {
                        $user->update([
                            'is_active' => false,
                            'status' => 'suspended',
                        ]);
                        $actionCount++;
                    }
                }
                $actionName = 'deactivated';
                break;

            case 'delete':
                foreach ($users as $user) {
                    if (! $user->hasRole('super_admin')) {
                        $user->delete();
                        $actionCount++;
                    }
                }
                $actionName = 'deleted';
                break;
        }

        return back()->with('success', "{$actionCount} users {$actionName} successfully.");
    }
}
