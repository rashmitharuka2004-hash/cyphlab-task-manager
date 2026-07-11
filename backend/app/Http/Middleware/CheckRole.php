<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Ensure user is authenticated and has a loaded role relation
        if (!$request->user() || !$request->user()->role) {
            return response()->json(['message' => 'Unauthorized Access.'], 403);
        }

        // Check if user's role name matches any of the allowed roles passed to the middleware
        if (!in_array($request->user()->role->name, $roles)) {
            return response()->json(['message' => 'Access Denied. Insufficient Permissions.'], 403);
        }

        return $next($request);
    }
}
