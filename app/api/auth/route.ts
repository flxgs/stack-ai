import { NextRequest, NextResponse } from "next/server";

/**
 * Authentication endpoint configuration for Stack AI API
 * Using Supabase for authentication service
 */
const AUTH_URL = "https://sb.stack-ai.com/auth/v1/token";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3VhZGZxaGtseG9rbWxodHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzM0NTg5ODAsImV4cCI6MTk4OTAzNDk4MH0.Xjry9m7oc42_MsLRc1bZhTTzip3srDjJ6fJMkwhXQ9s";

/**
 * POST handler for authentication
 * Exchanges email/password for an access token using Stack AI's auth service
 *
 * @param request - Contains email and password in the body
 * @returns JWT token on success, error message on failure
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Call Stack AI's auth endpoint to get access token
    const response = await fetch(`${AUTH_URL}?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Apikey: ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
