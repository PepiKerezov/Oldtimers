import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Proxy provides a cheap first-pass cookie check on /admin routes.
// SECURITY: never trust this alone — every server action and admin page
// must re-verify the session and ADMIN role server-side. This guards
// against CVE-2025-29927 (proxy bypass via spoofed headers).
export function proxy(request: NextRequest) {
  const cookie = getSessionCookie(request);
  if (!cookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
