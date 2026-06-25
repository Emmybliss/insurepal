<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastActiveAt
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->last_active_at?->gt(now()->subMinutes(2))) {
            $user->update(['last_active_at' => now()]);
        }

        return $next($request);
    }
}
