<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialiteController extends Controller
{
    /**
     * Redirect to Google OAuth provider
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Redirect to Microsoft OAuth provider
     */
    public function redirectToMicrosoft(): RedirectResponse
    {
        return Socialite::driver('microsoft')->redirect();
    }

    /**
     * Handle Google OAuth callback
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        return $this->handleProviderCallback('google');
    }

    /**
     * Handle Microsoft OAuth callback
     */
    public function handleMicrosoftCallback(): RedirectResponse
    {
        return $this->handleProviderCallback('microsoft');
    }

    /**
     * Shared logic for Google & Microsoft callback
     */
    protected function handleProviderCallback(string $provider): RedirectResponse
    {
        try {
            Log::info(strtoupper($provider).' OAuth callback started');

            $providerUser = Socialite::driver($provider)->user();
            Log::info($provider.' user retrieved', [
                'email' => $providerUser->getEmail(),
                'name' => $providerUser->getName(),
                'id' => $providerUser->getId(),
            ]);

            $user = $this->findOrCreateUser($providerUser, $provider);
            Log::info('User found/created', ['user_id' => $user->id, 'email' => $user->email]);

            // Logout any existing user before logging in the OAuth user
            if (Auth::check()) {
                Log::info('Logging out existing user', ['old_user_id' => Auth::id()]);
                Auth::logout();
            }

            Auth::login($user);
            Log::info('User logged in', ['user_id' => $user->id]);

            // Regenerate session to prevent fixation attacks
            request()->session()->regenerate();

            // Update last login timestamp
            $user->update(['last_login_at' => now()]);

            // Determine redirect based on user state
            $redirect = $this->redirectAfterAuth($user);
            Log::info('Redirecting user', ['to' => $redirect->getTargetUrl()]);

            return $redirect;
        } catch (\Exception $e) {
            Log::error(strtoupper($provider).' OAuth callback failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('login')
                ->with('error', 'Unable to authenticate with '.ucfirst($provider).'. Please try again.');
        }
    }

    /**
     * Find or create user from OAuth provider data
     */
    protected function findOrCreateUser($providerUser, string $provider): User
    {
        // Check if user exists by provider ID
        $user = User::where('provider_id', $providerUser->getId())
            ->where('provider_name', $provider)
            ->first();

        if ($user) {
            $user->update([
                'avatar' => $providerUser->getAvatar(),
            ]);

            return $user;
        }

        // Check if user exists by email (may have signed up via another method)
        $user = User::where('email', $providerUser->getEmail())->first();

        if ($user) {
            $user->update([
                'provider_id' => $providerUser->getId(),
                'provider_name' => $provider,
                'avatar' => $providerUser->getAvatar(),
            ]);

            // Inform the user that their accounts have been linked
            session()->flash('status', 'Your '.ucfirst($provider).' account has been linked to your existing InsurePal account. You can now sign in using either method.');

            return $user;
        }

        // New user - create tenant and account
        return DB::transaction(function () use ($providerUser, $provider) {
            $tenant = Tenant::create([
                'name' => $providerUser->getName()."'s Company",
                'type' => 'broker',
                'email' => $providerUser->getEmail(),
                'status' => 'active',
                'trial_ends_at' => now()->addDays(14),
            ]);

            $user = User::create([
                'name' => $providerUser->getName(),
                'email' => $providerUser->getEmail(),
                'provider_id' => $providerUser->getId(),
                'provider_name' => $provider,
                'avatar' => $providerUser->getAvatar(),
                'password' => Hash::make(Str::random(32)),
                'tenant_id' => $tenant->id,
                'email_verified_at' => now(),
            ]);

            $user->assignRole('broker');
            event(new Registered($user));

            return $user;
        });
    }

    /**
     * Determine where to redirect user after authentication
     */
    protected function redirectAfterAuth(User $user): RedirectResponse
    {
        if ($user->hasRole('super_admin')) {
            return redirect()->route('admin.dashboard');
        }

        $tenant = $user->tenant;

        if (! $tenant) {
            return redirect()->route('login')
                ->with('error', 'No tenant found. Please contact support.');
        }

        if ($tenant->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        $steps = $tenant->onboarding_steps ?? [];
        $hasPlan = ! empty($tenant->subscription_plan_id);

        if (! ($steps['subscription_selected'] ?? false) && ! $hasPlan) {
            return redirect()->route('onboarding.select-plan')
                ->with('info', 'Welcome! Please select a subscription plan to continue.');
        }

        if (! ($steps['payment_completed'] ?? false) && ! $hasPlan) {
            return redirect()->route('onboarding.select-plan')
                ->with('info', 'Please complete your payment to continue.');
        }

        if (! ($steps['company_details'] ?? false)) {
            return redirect()->route('onboarding.company-details')
                ->with('info', 'Please complete your company profile to get started.');
        }

        return redirect()->route('dashboard');
    }
}
