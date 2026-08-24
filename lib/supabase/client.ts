import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    browserClient = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey
    )
    return browserClient;
  } catch (e) {
    console.error('Failed to create Supabase browser client:', e);
    browserClient = {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: e }),
        getSession: () => Promise.resolve({ data: { session: null }, error: e }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: e }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: e }),
        signInWithOAuth: () => Promise.resolve({ data: { url: null }, error: e }),
        signInWithOtp: () => Promise.resolve({ data: { user: null, session: null }, error: e }),
        signOut: () => Promise.resolve({ error: e }),
        resetPasswordForEmail: () => Promise.resolve({ data: null, error: e }),
        updatePassword: () => Promise.resolve({ data: null, error: e }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: e }),
            on: () => ({ subscribe: () => { } }),
          }),
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    return browserClient;
  }
}
