<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->determineLocale($request);

        App::setLocale($locale);

        return $next($request);
    }

    /**
     * Determine the best locale for the current request.
     */
    private function determineLocale(Request $request): string
    {
        $availableLocales = config('app.supported_locales', ['en']);
        $fallbackLocale = config('app.locale', 'en');

        // Priority 1: User preference (if logged in)
        if (Auth::check() && Auth::user()->locale) {
            $userLocale = Auth::user()->locale;
            if (in_array($userLocale, $availableLocales)) {
                return $userLocale;
            }
        }

        // Priority 2: Session locale (for guest users)
        if ($request->session()->has('locale')) {
            $sessionLocale = $request->session()->get('locale');
            if (in_array($sessionLocale, $availableLocales)) {
                return $sessionLocale;
            }
        }

        // Priority 3: Tenant default locale
        if ($request->user()?->tenant?->default_locale) {
            $tenantLocale = $request->user()->tenant->default_locale;
            if (in_array($tenantLocale, $availableLocales)) {
                return $tenantLocale;
            }
        }

        // Priority 4: Browser preference
        $acceptLanguage = $request->header('Accept-Language');
        if ($acceptLanguage) {
            $browserLocales = $this->parseAcceptLanguage($acceptLanguage);
            foreach ($browserLocales as $browserLocale) {
                if (in_array($browserLocale, $availableLocales)) {
                    return $browserLocale;
                }
            }
        }

        // Priority 5: Fallback to app default
        return $fallbackLocale;
    }

    /**
     * Parse the Accept-Language header.
     */
    private function parseAcceptLanguage(string $acceptLanguage): array
    {
        $locales = [];
        $parts = explode(',', $acceptLanguage);

        foreach ($parts as $part) {
            $locale = trim(explode(';', $part)[0]);
            // Convert locale format from 'en-US' to 'en'
            $locale = strtolower(substr($locale, 0, 2));
            if (! in_array($locale, $locales)) {
                $locales[] = $locale;
            }
        }

        return $locales;
    }
}
