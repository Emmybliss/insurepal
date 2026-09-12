<?php

namespace App\Rules;

use App\Models\Tenant;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Subdomain implements ValidationRule
{
    /**
     * Reserved subdomains that system infrastructure or core routes rely on.
     */
    public const RESERVED = [
        'www',
        'app',
        'api',
        'admin',
        'mail',
        'smtp',
        'webmail',
        'support',
        'help',
        'docs',
        'status',
        'cdn',
        'assets',
        'static',
        'insurepal',
        'staging',
        'dev',
        'local',
        'test',
        'demo',
        'portal',
        'billing',
        'accounts',
        'login',
        'register',
        'auth',
        'dashboard',
        'settings',
        'root',
    ];

    public function __construct(
        protected ?int $ignoreTenantId = null
    ) {}

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('The :attribute must be a string.');

            return;
        }

        if ($value !== strtolower($value)) {
            $fail('The :attribute must contain only lowercase letters, numbers, and hyphens.');

            return;
        }

        $subdomain = trim($value);

        if (strlen($subdomain) < 2) {
            $fail('The :attribute must be at least 2 characters.');

            return;
        }

        if (strlen($subdomain) > 63) {
            $fail('The :attribute may not be greater than 63 characters.');

            return;
        }

        if (! preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $subdomain)) {
            $fail('The :attribute must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.');

            return;
        }

        if (in_array($subdomain, self::RESERVED, true)) {
            $fail("The subdomain '{$subdomain}' is reserved and cannot be used.");

            return;
        }

        $query = Tenant::where('subdomain', $subdomain);

        if ($this->ignoreTenantId) {
            $query->where('id', '!=', $this->ignoreTenantId);
        }

        if ($query->exists()) {
            $fail("The portal address '{$subdomain}' is already in use.");
        }
    }
}
