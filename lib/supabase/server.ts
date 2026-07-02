import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    try {
        const cookieStore = await cookies()
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables');
        }

        return createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )
    } catch (e: any) {
        if (e.digest === 'DYNAMIC_SERVER_USAGE' || e.message?.includes('Dynamic server usage')) throw e;
        console.error('Failed to create Supabase server client:', e);
        // Return a minimal object that won't crash common calls but returns errors
        return {
            auth: {
                getUser: () => Promise.resolve({ data: { user: null }, error: e }),
                getSession: () => Promise.resolve({ data: { session: null }, error: e }),
                signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: e }),
                signUp: () => Promise.resolve({ data: { user: null, session: null }, error: e }),
                signInWithOAuth: () => Promise.resolve({ data: { url: null }, error: e }),
                signInWithOtp: () => Promise.resolve({ data: { user: null, session: null }, error: e }),
                signOut: () => Promise.resolve({ error: e }),
                exchangeCodeForSession: () => Promise.resolve({ data: { user: null, session: null }, error: e }),
                resetPasswordForEmail: () => Promise.resolve({ data: null, error: e }),
                updateUser: () => Promise.resolve({ data: { user: null }, error: e }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        maybeSingle: () => Promise.resolve({ data: null, error: e }),
                        order: () => Promise.resolve({ data: null, error: e }),
                    }),
                    order: () => Promise.resolve({ data: null, error: e }),
                }),
                insert: () => Promise.resolve({ data: null, error: e }),
                update: () => Promise.resolve({ data: null, error: e }),
                delete: () => Promise.resolve({ data: null, error: e }),
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
    }
}
