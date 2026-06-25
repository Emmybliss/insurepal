<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class TenantType
{
    public function handle(Request $request, Closure $next, string ...$types): Response
    {
        $user = Auth::user();

        if (! $user) {
            abort(403, 'No tenant context available.');
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if (! $user->tenant) {
            abort(403, 'No tenant context available.');
        }

        if (! in_array($user->tenant->type, $types)) {
            abort(403, 'Access denied: This action is not available for your account type.');
        }

        return $next($request);
    }
}
