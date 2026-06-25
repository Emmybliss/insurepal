<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'token',
        'token_hash',
        'public_key',
        'last_4_chars',
        'scopes',
        'allowed_domains',
        'last_used_at',
        'is_active',
    ];

    protected $casts = [
        'scopes' => 'array',
        'allowed_domains' => 'array',
        'last_used_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Determine if the key has a specific scope.
     */
    public function hasScope(string $scope): bool
    {
        if (empty($this->scopes) || in_array('*', $this->scopes)) {
            return true;
        }

        return in_array($scope, $this->scopes);
    }

    /**
     * Check if the origin/referer domain is allowed for this key.
     */
    public function isDomainAllowed(?string $domain): bool
    {
        if (empty($this->allowed_domains)) {
            return true;
        }

        if (! $domain) {
            return false;
        }

        $host = parse_url($domain, PHP_URL_HOST) ?: $domain;

        foreach ($this->allowed_domains as $allowed) {
            if ($allowed === '*' || $allowed === $host) {
                return true;
            }
            if (str_starts_with($host, '.') && str_ends_with($host, $allowed)) {
                return true;
            } // Subdomain check
        }

        return false;
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
