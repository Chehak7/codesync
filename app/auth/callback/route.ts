import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_NEXT_PATHS = new Set([
    '/',
    '/rooms',
    '/profile',
    '/settings',
    '/reset-password',
])

const ROOM_PATH = /^\/room\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getTrustedOrigin(requestUrl: string) {
    const configuredOrigin = process.env.APP_ORIGIN?.trim()

    if (configuredOrigin) {
        const configuredUrl = new URL(configuredOrigin)
        const isAllowedProtocol = process.env.NODE_ENV === 'production'
            ? configuredUrl.protocol === 'https:'
            : configuredUrl.protocol === 'http:' || configuredUrl.protocol === 'https:'

        if (
            !isAllowedProtocol ||
            configuredUrl.username ||
            configuredUrl.password ||
            configuredUrl.pathname !== '/' ||
            configuredUrl.search ||
            configuredUrl.hash
        ) {
            throw new Error('APP_ORIGIN must be an origin only (for example, https://codesync.example.com)')
        }

        return configuredUrl.origin
    }

    if (process.env.NODE_ENV !== 'production') {
        const localUrl = new URL(requestUrl)
        if (['localhost', '127.0.0.1', '[::1]'].includes(localUrl.hostname)) {
            return localUrl.origin
        }
    }

    throw new Error('APP_ORIGIN is required for authentication callbacks')
}

function normalizeNextPath(value: string | null) {
    if (!value) return '/rooms'

    try {
        const internalBase = new URL('https://codesync.internal')
        const candidate = new URL(value, internalBase)
        const isInternal = candidate.origin === internalBase.origin
        const isAllowedPath = ALLOWED_NEXT_PATHS.has(candidate.pathname) || ROOM_PATH.test(candidate.pathname)

        if (!isInternal || !isAllowedPath) return '/rooms'
        return `${candidate.pathname}${candidate.search}`
    } catch {
        return '/rooms'
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const trustedOrigin = getTrustedOrigin(request.url)
    const code = searchParams.get('code')
    const next = normalizeNextPath(searchParams.get('next'))

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(new URL(next, trustedOrigin))
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(new URL('/login?error=auth-code-error', trustedOrigin))
}
