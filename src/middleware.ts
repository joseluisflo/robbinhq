import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware function is empty because the config matcher handles all the logic.
// It's set up to intercept all routes EXCEPT the ones specified in the matcher's negative lookahead.
// For routes that are not matched, this middleware will not run.
// For routes that are matched, it will run, but since there's no logic here, it implicitly returns NextResponse.next().
export function middleware(request: NextRequest) {}

// The `config` object specifies which routes the middleware should apply to.
export const config = {
  // The `matcher` uses a negative lookahead `(?!...)` to exclude specific paths.
  // This means the middleware will run on all paths EXCEPT:
  // - /api/stripe-webhook: The Stripe webhook endpoint.
  // - /_next/static: Next.js static files (e.g., CSS, JS).
  // - /_next/image: Next.js image optimization files.
  // - /favicon.ico: The site's favicon.
  //
  // By excluding the webhook, we prevent any authentication logic from redirecting it.
  matcher: ['/((?!api/stripe-webhook|_next/static|_next/image|favicon.ico).*)'],
};
