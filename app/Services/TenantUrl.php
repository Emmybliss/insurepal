<?php

namespace App\Services;

use App\Models\Tenant;

class TenantUrl
{
    /**
     * Get base root host without www or subdomains.
     */
    public static function getRootHost(): string
    {
        $appUrl = config('app.url', 'http://localhost');
        $host = parse_url($appUrl, PHP_URL_HOST) ?? 'localhost';

        // Strip leading www.
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }

        return $host;
    }

    /**
     * Extract tenant subdomain from host string, returning null if it's root domain or reserved.
     */
    public static function extractSubdomain(string $host): ?string
    {
        // Strip port if present
        $hostOnly = explode(':', $host)[0];
        $hostOnly = strtolower(trim($hostOnly));

        $rootHost = strtolower(static::getRootHost());

        // Exact match to root domain or www.rootDomain
        if ($hostOnly === $rootHost || $hostOnly === "www.{$rootHost}") {
            return null;
        }

        // Check if host ends with .rootHost
        if (str_ends_with($hostOnly, ".{$rootHost}")) {
            $subdomain = substr($hostOnly, 0, -strlen(".{$rootHost}"));

            // If nested subdomain like foo.bar, take the first part
            $parts = explode('.', $subdomain);
            $subdomain = end($parts);

            return static::normalizeSubdomain($subdomain);
        }

        // Support local dev environments like neta.localhost or neta.insurepal-ai-saas.test
        if (str_contains($hostOnly, '.')) {
            $parts = explode('.', $hostOnly);
            if (count($parts) >= 2) {
                $subdomain = $parts[0];

                return static::normalizeSubdomain($subdomain);
            }
        }

        return null;
    }

    /**
     * Normalize subdomain format and check reserved list.
     */
    public static function normalizeSubdomain(?string $subdomain): ?string
    {
        if (empty($subdomain)) {
            return null;
        }

        $clean = strtolower(trim($subdomain));
        $clean = preg_replace('/[^a-z0-9\-]/', '', $clean);

        if (empty($clean) || in_array($clean, \App\Rules\Subdomain::RESERVED, true)) {
            return null;
        }

        return $clean;
    }

    /**
     * Build full URL for a tenant and path.
     */
    public static function to(?Tenant $tenant, string $path = '/'): string
    {
        $appUrl = config('app.url', 'http://localhost');
        $scheme = parse_url($appUrl, PHP_URL_SCHEME) ?? 'http';
        $port = parse_url($appUrl, PHP_URL_PORT);
        $portString = $port ? ":{$port}" : '';

        // If request is active, match current request scheme
        if (request()->hasHeader('Host')) {
            $scheme = request()->getScheme();
        }

        $rootHost = static::getRootHost();
        $path = '/'.ltrim($path, '/');

        if (! $tenant || empty($tenant->subdomain)) {
            return "{$scheme}://{$rootHost}{$portString}{$path}";
        }

        $subdomain = strtolower($tenant->subdomain);

        return "{$scheme}://{$subdomain}.{$rootHost}{$portString}{$path}";
    }
}
