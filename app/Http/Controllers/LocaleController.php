<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class LocaleController extends Controller
{
    /**
     * Set the application locale.
     */
    public function setLocale(Request $request, string $locale): RedirectResponse
    {
        $supportedLocales = config('app.supported_locales', ['en']);

        $request->validate([
            'locale' => Rule::in($supportedLocales),
        ], [], [
            'locale' => $locale,
        ]);

        // If user is authenticated, save to database
        if (Auth::check()) {
            Auth::user()->update(['locale' => $locale]);
        } else {
            // For guest users, save to session
            $request->session()->put('locale', $locale);
        }

        return redirect()->back()->with('success', __('Language changed successfully.'));
    }
}
