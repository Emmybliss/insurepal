<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\TenantRegistrationRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class TenantRegistrationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/tenant-registration');
    }

    public function store(TenantRegistrationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($validated) {
            $tenant = Tenant::create([
                'name' => $validated['company_name'],
                'type' => $validated['tenant_type'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'status' => 'active',
                'trial_ends_at' => now()->addDays(14), // 14-day trial
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'tenant_id' => $tenant->id,
                'is_active' => true,
            ]);

            // Assign appropriate role using Spatie
            $roleName = $validated['tenant_type'] === 'underwriter' ? 'underwriter' : 'broker';
            $user->assignRole($roleName);

            event(new Registered($user));

            Auth::login($user);

            return redirect()->route('dashboard')->with('success', 'Account created successfully! Your 14-day trial has started.');
        });
    }

    public function showPlans(): Response
    {
        $plans = \App\Models\SubscriptionPlan::active()->get();

        return Inertia::render('auth/subscription-plans', [
            'plans' => $plans,
        ]);
    }
}
