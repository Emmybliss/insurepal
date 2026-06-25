<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorChallengeController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA;
    }

    /**
     * Show the 2FA challenge page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->has('auth.2fa_user_id')) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/two-factor-challenge');
    }

    /**
     * Validate the 2FA code and complete login.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'nullable|string',
            'recovery_code' => 'nullable|string',
        ]);

        $userId = $request->session()->get('auth.2fa_user_id');

        if (! $userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);

        if (! $user) {
            $request->session()->forget('auth.2fa_user_id');

            return redirect()->route('login');
        }

        // Try TOTP code first
        if ($request->filled('code')) {
            $secret = decrypt($user->two_factor_secret);
            $valid = $this->google2fa->verifyKey($secret, $request->code);

            if (! $valid) {
                return back()->withErrors(['code' => 'The authentication code you entered is invalid.']);
            }
        }
        // Try recovery code
        elseif ($request->filled('recovery_code')) {
            $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes));

            if (! in_array($request->recovery_code, $recoveryCodes, true)) {
                return back()->withErrors(['recovery_code' => 'The recovery code you entered is invalid.']);
            }

            // Consume the used recovery code
            $updatedCodes = array_values(array_filter(
                $recoveryCodes,
                fn ($code) => $code !== $request->recovery_code
            ));

            $user->forceFill([
                'two_factor_recovery_codes' => encrypt(json_encode($updatedCodes)),
            ])->save();
        } else {
            return back()->withErrors(['code' => 'Please enter an authentication code or recovery code.']);
        }

        // Clear the 2FA challenge session flag
        $request->session()->forget('auth.2fa_user_id');
        $request->session()->put('auth.2fa_passed', true);

        // Log the user in properly
        Auth::login($user);
        $request->session()->regenerate();

        $user->update(['last_login_at' => now()]);

        // Redirect using same logic as standard login
        return app(AuthenticatedSessionController::class)->redirectAfterAuth($user);
    }
}
