<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'cf-turnstile-response' => ['required', 'string', new \App\Rules\Turnstile],
        ], [
            'cf-turnstile-response.required' => 'Please complete the security check to verify you are human.',
        ]);

        // Create user with tenant in a transaction
        $user = DB::transaction(function () use ($request) {
            // Create a basic tenant for the new user
            $tenant = Tenant::create([
                'name' => $request->name."'s Company",
                'type' => 'broker', // Default type
                'email' => $request->email,
                'status' => 'active',
                'trial_ends_at' => now()->addDays(14),
            ]);

            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'tenant_id' => $tenant->id,
            ]);

            // Assign default broker role
            $user->assignRole('broker');

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        // Redirect to onboarding flow
        return redirect()->route('onboarding.select-plan')
            ->with('success', 'Welcome! Please select a subscription plan to continue.');
    }
}
