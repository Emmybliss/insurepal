<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TenantRequest;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('super.admin');
    }

    public function index(Request $request): Response
    {
        $stats = [
            'total_tenants' => Tenant::count(),
            'active_tenants' => Tenant::active()->count(),
            'underwriters' => Tenant::byType('underwriter')->count(),
            'brokers' => Tenant::byType('broker')->count(),
            'on_trial' => Tenant::whereNotNull('trial_ends_at')
                ->where('trial_ends_at', '>', now())
                ->count(),
            'with_subscription' => Tenant::whereHas('subscription')->count(),
        ];

        $query = Tenant::query()->with(['users', 'subscription']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $tenants = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('Admin/Tenants/Index', [
            'stats' => $stats,
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    public function create(): Response
    {
        $subscriptionPlans = SubscriptionPlan::active()
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'price', 'currency', 'billing_cycle', 'trial_days', 'features', 'is_popular']);

        return Inertia::render('Admin/Tenants/Create', [
            'subscriptionPlans' => $subscriptionPlans,
        ]);
    }

    public function store(TenantRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        unset($validated['logo_upload']);
        unset($validated['logo']);
        unset($validated['user']);

        $tenant = Tenant::create($validated);

        if ($tenant->subscription_plan_id) {
            $this->syncSubscription($tenant, $request->input('subscription_duration', 'monthly'));
        }

        // Upload company logo directly to tenants.logo
        if ($request->hasFile('logo_upload')) {
            $path = $request->file('logo_upload')->store('tenants/logos', 'public');
            $tenant->update(['logo' => $path]);
        }

        // If user details were provided, create the primary admin user
        if ($request->filled('user.name') && $request->filled('user.email') && $request->filled('user.password')) {
            $user = User::create([
                'name' => $request->input('user.name'),
                'email' => $request->input('user.email'),
                'password' => Hash::make($request->input('user.password')),
                'tenant_id' => $tenant->id,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            // Assign role based on tenant type
            $roleName = $tenant->type === 'underwriter' ? 'underwriter' : 'broker';
            $user->assignRole($roleName);
        }

        return redirect()->route('admin.tenants.index')
            ->with('success', 'Tenant created successfully.');
    }

    public function show(Tenant $tenant): Response
    {
        $tenant->load(['users', 'subscription', 'customers', 'policies']);

        $stats = [
            'total_users' => $tenant->users()->count(),
            'active_users' => $tenant->users()->where('is_active', true)->count(),
            'total_customers' => $tenant->customers()->count(),
            'total_policies' => $tenant->policies()->count(),
            'active_policies' => $tenant->policies()->where('status', 'active')->count(),
            'trial_days_remaining' => $tenant->isOnTrial() ?
                now()->diffInDays($tenant->trial_ends_at) : 0,
            'account_age' => $tenant->created_at->diffForHumans(),
            'subscription_status' => $tenant->subscription?->status ?? 'none',
        ];

        $transactions = \App\Models\Subscription::with('plan')
            ->where('tenant_id', $tenant->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($subscription) {
                return [
                    'id' => $subscription->id,
                    'description' => ($subscription->plan->name ?? 'Plan').' Subscription',
                    'amount' => $subscription->metadata['payment_amount'] ?? $subscription->plan->price ?? 0,
                    'currency' => $subscription->metadata['payment_currency'] ?? $subscription->plan->currency ?? 'NGN',
                    'status' => $subscription->status === 'active' ? 'paid' : $subscription->status,
                    'created_at' => $subscription->created_at->toISOString(),
                ];
            });

        return Inertia::render('Admin/Tenants/Show', [
            'tenant' => $tenant,
            'stats' => $stats,
            'transactions' => $transactions,
            'tenantUsers' => $tenant->users()->orderBy('id')->get(['id', 'name', 'email']),
        ]);
    }

    public function downloadReceipt(Tenant $tenant, int $subscriptionId, \App\Services\PaymentReceiptService $receiptService)
    {
        $subscription = \App\Models\Subscription::where('id', $subscriptionId)
            ->where('tenant_id', $tenant->id)
            ->with('plan')
            ->firstOrFail();

        return $receiptService->generateReceipt($subscription);
    }

    public function edit(Tenant $tenant): Response
    {
        $subscriptionPlans = SubscriptionPlan::active()
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'price', 'currency', 'billing_cycle', 'trial_days', 'features', 'is_popular']);

        $tenantUsers = $tenant->users()
            ->orderBy('id')
            ->get(['id', 'name', 'email']);

        $activeSubscription = $tenant->subscriptions()
            ->where('status', 'active')
            ->first();

        return Inertia::render('Admin/Tenants/Edit', [
            'tenant' => $tenant,
            'subscriptionPlans' => $subscriptionPlans,
            'tenantUsers' => $tenantUsers,
            'subscription_duration' => $activeSubscription?->billing_cycle ?? 'monthly',
        ]);
    }

    public function update(TenantRequest $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validated();
        unset($validated['logo_upload']);
        unset($validated['logo']);
        unset($validated['user']);

        $oldPlanId = $tenant->subscription_plan_id;
        $tenant->update($validated);

        if ($tenant->subscription_plan_id && $tenant->subscription_plan_id !== $oldPlanId) {
            $duration = $request->input('subscription_duration') ?: 'monthly';
            $this->syncSubscription($tenant, $duration);
        }

        // Upload company logo directly to tenants.logo
        if ($request->hasFile('logo_upload')) {
            if ($tenant->logo) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($tenant->logo);
            }
            $path = $request->file('logo_upload')->store('tenants/logos', 'public');
            $tenant->update(['logo' => $path]);
        }

        // Handle user update if provided
        if ($request->has('user.name') || $request->has('user.email') || $request->filled('user.password')) {
            $adminUser = User::where('tenant_id', $tenant->id)->orderBy('id')->first();
            if ($adminUser) {
                $userData = [];
                if ($request->filled('user.name')) {
                    $userData['name'] = $request->input('user.name');
                }
                if ($request->filled('user.email')) {
                    $userData['email'] = $request->input('user.email');
                }
                if ($request->filled('user.password')) {
                    $userData['password'] = Hash::make($request->input('user.password'));
                }

                if (! empty($userData)) {
                    $adminUser->update($userData);
                }
            }
        }

        return redirect()->route('admin.tenants.index')
            ->with('success', 'Tenant updated successfully.');
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        if ($tenant->users()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete tenant with existing users. Please reassign or delete users first.',
            ]);
        }

        if ($tenant->policies()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete tenant with existing policies.',
            ]);
        }

        $tenant->delete();

        return redirect()->route('admin.tenants.index')
            ->with('success', 'Tenant deleted successfully.');
    }

    public function toggleStatus(Tenant $tenant): RedirectResponse
    {
        $newStatus = $tenant->status === 'active' ? 'suspended' : 'active';

        $tenant->update(['status' => $newStatus]);

        return back()->with('success', "Tenant {$newStatus} successfully.");
    }

    public function resetPassword(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        if (! empty($validated['user_id'])) {
            // Update a specific user belonging to this tenant
            $user = User::where('id', $validated['user_id'])
                ->where('tenant_id', $tenant->id)
                ->firstOrFail();
        } else {
            // Fall back to the first admin / owner of the tenant
            $user = User::where('tenant_id', $tenant->id)
                ->orderBy('id')
                ->firstOrFail();
        }

        $user->update(['password' => Hash::make($validated['password'])]);

        return back()->with('success', "Password for {$user->name} has been updated successfully.");
    }

    public function extendTrial(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'days' => 'required|integer|min:1|max:365',
        ]);

        $newTrialEnd = $tenant->trial_ends_at
            ? $tenant->trial_ends_at->addDays($validated['days'])
            : now()->addDays($validated['days']);

        $tenant->update(['trial_ends_at' => $newTrialEnd]);

        return back()->with('success', "Trial extended by {$validated['days']} days.");
    }

    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:activate,deactivate,extend_trial',
            'tenant_ids' => 'required|array|min:1',
            'tenant_ids.*' => 'exists:tenants,id',
            'days' => 'required_if:action,extend_trial|integer|min:1|max:365',
        ]);

        $tenants = Tenant::whereIn('id', $validated['tenant_ids'])->get();
        $actionCount = 0;

        foreach ($tenants as $tenant) {
            switch ($validated['action']) {
                case 'activate':
                    if ($tenant->status !== 'active') {
                        $tenant->update(['status' => 'active']);
                        $actionCount++;
                    }
                    break;

                case 'deactivate':
                    if ($tenant->status !== 'inactive') {
                        $tenant->update(['status' => 'inactive']);
                        $actionCount++;
                    }
                    break;

                case 'extend_trial':
                    $newTrialEnd = $tenant->trial_ends_at
                        ? $tenant->trial_ends_at->addDays($validated['days'])
                        : now()->addDays($validated['days']);

                    $tenant->update(['trial_ends_at' => $newTrialEnd]);
                    $actionCount++;
                    break;
            }
        }

        $actionName = match ($validated['action']) {
            'activate' => 'activated',
            'deactivate' => 'deactivated',
            'extend_trial' => 'trial extended',
        };

        return back()->with('success', "{$actionCount} tenants {$actionName} successfully.");
    }

    private function syncSubscription(Tenant $tenant, string $duration): void
    {
        $plan = SubscriptionPlan::find($tenant->subscription_plan_id);
        if (! $plan) {
            return;
        }

        $months = match ($duration) {
            'quarterly' => 3,
            'semi_annually' => 6,
            'yearly' => 12,
            default => 1,
        };

        \Illuminate\Support\Facades\DB::transaction(function () use ($tenant, $plan, $duration, $months) {
            // Delete any existing cancelled subscriptions first to release the unique constraint
            \App\Models\Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'cancelled')
                ->delete();

            // Cancel existing active subscriptions
            \App\Models\Subscription::where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

            // Create new active subscription
            \App\Models\Subscription::create([
                'tenant_id' => $tenant->id,
                'subscription_plan_id' => $plan->id,
                'status' => 'active',
                'billing_cycle' => $duration,
                'current_period_start' => now(),
                'current_period_end' => now()->addMonths($months),
                'metadata' => [
                    'payment_amount' => $plan->price,
                    'payment_currency' => $plan->currency,
                    'assigned_by_admin' => true,
                ],
            ]);
        });

        $tenant->update([
            'subscription_started_at' => now(),
            'subscription_expires_at' => now()->addMonths($months),
            'status' => 'active',
        ]);
    }
}
