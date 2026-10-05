import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "blik_session";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdminRoute = path.includes("/admin") && !path.includes("/admin/login");

  if (isAdminRoute && !request.cookies.get(SESSION_COOKIE)?.value) {
    // За reverse-proxy request.url указывает на внутренний адрес контейнера, поэтому редирект
    // строим по публичному хосту из заголовков прокси.
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
    const loginUrl = new URL("/games/admin/login", `${proto}://${host}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
