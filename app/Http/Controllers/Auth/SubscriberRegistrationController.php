<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubscriberRegistrationRequest;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class SubscriberRegistrationController extends Controller
{
    public function __construct(
        private TenantService $tenantService
    ) {}

    /**
     * Display the subscriber registration form.
     */
    public function create(): Response
    {
        return Inertia::render('auth/RegisterSubscriber');
    }

    /**
     * Handle subscriber registration.
     */
    public function store(SubscriberRegistrationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            DB::beginTransaction();

            // Create tenant
            $tenant = Tenant::create([
                'name' => $validated['company_name'],
                'type' => $validated['type'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'known_company_id' => $validated['known_company_id'] ?? null,
                'known_company_source' => $validated['known_company_source'] ?? null,
                'status' => 'active',
                'trial_ends_at' => now()->addDays(14), // 14-day trial
            ]);

            // Create admin user for the tenant
            $user = User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['password']),
                'tenant_id' => $tenant->id,
                'phone' => $request->input('admin_phone'),
            ]);

            // Assign appropriate role based on tenant type
            $role = $validated['type'] === 'underwriter' ? 'underwriter' : 'broker';
            $user->assignRole($role);

            DB::commit();

            event(new Registered($user));

            Auth::login($user);

            // Redirect to onboarding flow after subscriber registration
            return redirect()->route('onboarding.select-plan')->with('success',
                'Your '.ucfirst($validated['type']).' account has been created! Please select a subscription plan to continue.'
            );

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'registration' => 'An error occurred during registration. Please try again.',
            ])->withInput();
        }
    }
}
