<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\UserVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    public function __construct(
        protected UserVerificationService $verificationService
    ) {}

    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        // Debugging authorization
        $userKey = (string) $request->user()->getKey();
        $routeId = (string) $request->route('id');
        $userHash = sha1($request->user()->getEmailForVerification());
        $routeHash = (string) $request->route('hash');

        if (! hash_equals($userKey, $routeId)) {
            \Illuminate\Support\Facades\Log::error("Email Verify Failed: ID mismatch. UserKey: {$userKey}, RouteId: {$routeId}");
            abort(403, 'This action is unauthorized (ID mismatch).');
        }

        if (! hash_equals($userHash, $routeHash)) {
            \Illuminate\Support\Facades\Log::error("Email Verify Failed: Hash mismatch. UserHash: {$userHash}, RouteHash: {$routeHash}");
            abort(403, 'This action is unauthorized (Hash mismatch).');
        }

        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        $this->verificationService->verifyEmailViaLink($request->user());

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}
