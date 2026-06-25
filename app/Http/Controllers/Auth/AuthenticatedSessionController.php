<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();

        // --- Login Access Guard ---
        // Customers whose access has been revoked by their tenant cannot log in.
        if ($user->login_access === false) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')
                ->withErrors(['email' => 'Your login access has been revoked. Please contact your administrator.']);
        }

        // --- Login Harmonization ---
        // If the user's account is linked to an OAuth provider, instruct them
        // to use the correct login button rather than email/password.
        if ($user->isOAuthUser()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            $providerLabel = ucfirst($user->provider_name ?? 'your identity provider');

            return redirect()->route('login')
                ->withErrors(['email' => "This account was created via {$providerLabel}. Please use the \"Sign in with {$providerLabel}\" button instead."]);
        }

        // --- 2FA Challenge ---
        // If 2FA is enabled, log them out temporarily and send them to the challenge page.
        if ($user->hasTwoFactorEnabled()) {
            $request->session()->put('auth.2fa_user_id', $user->id);
            Auth::logout();

            return redirect()->route('two-factor.challenge');
        }

        // Update last login timestamp
        $user->update(['last_login_at' => now()]);

        // Determine redirect based on user state
        return $this->redirectAfterAuth($user);
    }

    /**
     * Determine where to redirect user after authentication
     */
    public function redirectAfterAuth($user): RedirectResponse
    {
        // Super admin goes directly to admin dashboard
        if ($user->hasRole('super_admin')) {
            return redirect()->route('admin.dashboard');
        }

        $tenant = $user->tenant;

        if (! $tenant) {
            return redirect()->route('login')
                ->with('error', 'No tenant found. Please contact support.');
        }

        // Check if onboarding is completed
        if ($tenant->onboarding_completed) {
            return redirect()->intended(route('dashboard'));
        }

        // New or incomplete onboarding - determine next step
        $steps = $tenant->onboarding_steps ?? [];
        $hasPlan = ! empty($tenant->subscription_plan_id);

        // If no subscription selected, go to plan selection
        if (! ($steps['subscription_selected'] ?? false) && ! $hasPlan) {
            return redirect()->route('onboarding.select-plan')
                ->with('info', 'Welcome! Please select a subscription plan to continue.');
        }

        // If subscription selected but payment not completed
        if (! ($steps['payment_completed'] ?? false) && ! $hasPlan) {
            return redirect()->route('onboarding.select-plan')
                ->with('info', 'Please complete your payment to continue.');
        }

        // If payment completed but company details not filled
        if (! ($steps['company_details'] ?? false)) {
            return redirect()->route('onboarding.company-details')
                ->with('info', 'Please complete your company profile to get started.');
        }

        // Default to dashboard
        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
