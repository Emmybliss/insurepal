<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

class Turnstile implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Skip validation if we are running tests, unless we specifically want to test it
        if (app()->environment('testing')) {
            return;
        }

        try {
            $response = Http::asForm()
                ->timeout(30)
                ->post(
                    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                    [
                        'secret' => config('services.turnstile.secret_key'),
                        'response' => $value,
                        'remoteip' => request()->ip(),
                    ]
                );

            if (! $response->json('success')) {
                $fail('The Cloudflare Turnstile security check failed. Please try again.');
            }
        } catch (\Illuminate\Http\Client\ConnectionException) {
            $fail('Unable to verify security check. Please check your connection and try again.');
        }
    }
}
