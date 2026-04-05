import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function hasSupabaseAuthConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function proxy(request: NextRequest) {
  if (!hasSupabaseAuthConfig()) {
    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/auth");

  if (isDashboardRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth"],
};
