<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddCsrfTokenHeader
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Add fresh CSRF token to response headers
        if ($request->session()->has('_token')) {
            $response->headers->set('X-CSRF-Token', $request->session()->token());
        }

        return $response;
    }
}
