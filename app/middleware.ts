import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global middleware for API route protection
 * Ensures all API routes (except /api/auth) have valid authentication
 *
 * @param request - Incoming request to check
 * @returns Response or continues to next middleware
 */
export function middleware(request: NextRequest) {
  // Only check auth header for API routes, excluding the auth endpoint
  if (
    request.nextUrl.pathname.startsWith("/api") &&
    !request.nextUrl.pathname.endsWith("/auth")
  ) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Configure which routes should use this middleware
export const config = {
  matcher: "/api/:path*",
};
