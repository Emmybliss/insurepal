<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA;
    }

    /**
     * Show the 2FA settings page.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        $qrCodeSvg = null;
        $recoveryCodes = null;

        // If 2FA is being set up (secret generated but not yet confirmed)
        if ($user->two_factor_secret && ! $user->hasTwoFactorEnabled()) {
            $qrCodeSvg = $this->generateQrCodeSvg($user);
        }

        // If 2FA is already fully enabled, show recovery codes
        if ($user->hasTwoFactorEnabled()) {
            $recoveryCodes = $user->two_factor_recovery_codes
                ? json_decode(decrypt($user->two_factor_recovery_codes))
                : [];
        }

        return Inertia::render('settings/two-factor', [
            'isOAuthUser' => $user->isOAuthUser(),
            'providerName' => $user->provider_name,
            'enabled' => $user->hasTwoFactorEnabled(),
            'confirming' => $user->two_factor_secret && ! $user->hasTwoFactorEnabled(),
            'qrCodeSvg' => $qrCodeSvg,
            'recoveryCodes' => $recoveryCodes,
        ]);
    }

    /**
     * Initialize 2FA setup: generate secret and recovery codes.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->isOAuthUser()) {
            return back()->withErrors(['error' => '2FA is managed by your identity provider.']);
        }

        $secret = $this->google2fa->generateSecretKey();
        $recoveryCodes = $this->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_secret' => encrypt($secret),
            'two_factor_recovery_codes' => encrypt(json_encode($recoveryCodes)),
            'two_factor_confirmed_at' => null, // reset confirmation
        ])->save();

        return back();
    }

    /**
     * Confirm the 2FA setup by validating the TOTP code.
     */
    public function confirm(Request $request): RedirectResponse
    {
        $request->validate(['code' => 'required|string']);

        $user = $request->user();

        if ($user->isOAuthUser() || ! $user->two_factor_secret) {
            return back()->withErrors(['code' => 'Invalid state.']);
        }

        $secret = decrypt($user->two_factor_secret);
        $valid = $this->google2fa->verifyKey($secret, $request->code);

        if (! $valid) {
            return back()->withErrors(['code' => 'The provided code is invalid. Please try again.']);
        }

        $user->forceFill([
            'two_factor_confirmed_at' => now(),
        ])->save();

        return back()->with('status', '2FA has been enabled successfully.');
    }

    /**
     * Disable 2FA entirely.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate(['password' => 'required|string']);

        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            return back()->withErrors(['password' => 'The provided password is incorrect.']);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return back()->with('status', '2FA has been disabled.');
    }

    /**
     * Regenerate recovery codes.
     */
    public function recoveryCodes(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasTwoFactorEnabled()) {
            return back()->withErrors(['error' => '2FA is not enabled.']);
        }

        $codes = $this->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_recovery_codes' => encrypt(json_encode($codes)),
        ])->save();

        return back()->with('status', 'Recovery codes regenerated.');
    }

    /**
     * Generate the QR code SVG for the authenticator app.
     */
    protected function generateQrCodeSvg($user): string
    {
        $secret = decrypt($user->two_factor_secret);
        $appName = config('app.name', 'InsurePal');

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            $appName,
            $user->email,
            $secret
        );

        // Use BaconQrCode to render the SVG
        $renderer = new \BaconQrCode\Renderer\ImageRenderer(
            new \BaconQrCode\Renderer\RendererStyle\RendererStyle(192),
            new \BaconQrCode\Renderer\Image\SvgImageBackEnd
        );

        $writer = new \BaconQrCode\Writer($renderer);

        return base64_encode($writer->writeString($qrCodeUrl));
    }

    /**
     * Generate 8 unique recovery codes.
     */
    protected function generateRecoveryCodes(): array
    {
        return Collection::times(8, fn () => Str::random(10).'-'.Str::random(10)
        )->all();
    }
}
