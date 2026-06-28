import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/library', '/profile', '/settings']
const ADMIN_PATHS = ['/admin']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check Supabase auth cookie without importing @supabase/ssr (incompatible with Edge Runtime)
  // Real auth verification happens in server components; middleware does fast redirect only
  const cookies = request.cookies.getAll()
  const isLoggedIn = cookies.some(
    c => c.name.includes('-auth-token') && c.value.length > 0
  )

  if (PROTECTED_PATHS.some(p => path.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (ADMIN_PATHS.some(p => path.startsWith(p)) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
