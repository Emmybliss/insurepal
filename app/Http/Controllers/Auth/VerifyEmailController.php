<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(\Illuminate\Http\Request $request): RedirectResponse
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

        $request->user()->markEmailAsVerified();
        event(new \Illuminate\Auth\Events\Verified($request->user()));

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}
