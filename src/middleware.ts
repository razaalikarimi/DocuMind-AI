import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/chat(.*)",
  "/workspace(.*)",
  "/settings(.*)",
  "/admin(.*)",
  "/api/chat(.*)",
  "/api/pdfs(.*)",
  "/api/workspaces(.*)",
  "/api/embeddings(.*)",
  "/api/admin(.*)",
]);

// Public API routes (no auth needed)
const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/health",
  "/api/uploadthing",
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Always allow public routes
  if (isPublicApiRoute(request)) {
    return NextResponse.next();
  }

  // Protect all dashboard/API routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Security headers for all responses
  const response = NextResponse.next();

  // CORS for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
