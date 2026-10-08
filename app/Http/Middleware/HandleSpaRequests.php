<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleSpaRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        // If the browser is performing a direct HTML page navigation, render the React view
        if ($request->isMethod('GET') && $request->acceptsHtml() && !$request->expectsJson() && !$request->ajax()) {
            return response()->view('app');
        }

        return $next($request);
    }
}
