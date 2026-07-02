import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let supabase;
    try {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables');
        }

        supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        })
    } catch (e) {
        console.error('Failed to create Supabase middleware client:', e);
        // Fallback to a minimal client that won't crash
        supabase = {
            auth: {
                getUser: () => Promise.resolve({ data: { user: null }, error: e }),
                getSession: () => Promise.resolve({ data: { session: null }, error: e }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
    }

    // refreshing the auth token
    let user = null
    try {
        const { data } = await supabase.auth.getUser()
        user = data.user
    } catch (e) {
        console.error('Supabase Auth Error in Middleware:', e)
    }

    if (request.nextUrl.pathname.startsWith("/") &&
        !user &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/signup") &&
        !request.nextUrl.pathname.startsWith("/auth") &&
        !request.nextUrl.pathname.startsWith("/forgot-password") &&
        request.nextUrl.pathname !== "/") {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
