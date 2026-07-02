'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from "next/headers"

export async function login(formData: FormData) {
    try {
        const supabase = await createClient()

        const data = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        }

        const { error } = await supabase.auth.signInWithPassword(data)

        if (error) {
            console.error("Login Error:", error)
            return { error: error.message, code: error.code }
        }

        revalidatePath('/', 'layout')
        return { success: true, redirectTo: '/rooms' }
    } catch (e: any) {
        console.error("Login Action Panic:", e)
        return { error: e.message || "An unexpected error occurred during authentication." }
    }
}

export async function signup(formData: FormData) {
    try {
        const supabase = await createClient()
        const origin = (await headers()).get("origin");

        const data = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        }

        const { error } = await supabase.auth.signUp({
            ...data,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        })

        if (error) {
            console.error("Signup Error:", error)
            return { error: error.message, code: error.code }
        }

        return { success: true, message: 'Check your email to confirm your account.' }
    } catch (e: any) {
        console.error("Signup Action Panic:", e)
        return { error: e.message || "An unexpected error occurred during signup." }
    }
}


export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function signInWithOAuth(provider: 'google' | 'github') {
    try {
        const supabase = await createClient()
        const origin = (await headers()).get("origin");

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${origin}/auth/callback`,
            },
        })

        if (error) {
            console.error("OAuth Error:", error)
            return { error: error.message }
        }

        if (data.url) {
            return { success: true, url: data.url }
        }
        return { error: "Failed to generate authentication URL." }
    } catch (e: any) {
        console.error("OAuth Panic:", e)
        return { error: e.message || "An unexpected error occurred during OAuth." }
    }
}

export async function signInWithMagicLink(formData: FormData) {
    try {
        const supabase = await createClient()
        const origin = (await headers()).get("origin");
        const email = formData.get('email') as string

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: `${origin}/auth/callback`,
            },
        })

        if (error) {
            console.error("Magic Link Error:", error)
            return { error: error.message }
        }

        return { success: true, message: 'Check your email for the magic link.' }
    } catch (e: any) {
        console.error("Magic Link Panic:", e)
        return { error: e.message || "An unexpected error occurred while sending magic link." }
    }
}

export async function forgotPassword(formData: FormData) {
    try {
        const supabase = await createClient()
        const origin = (await headers()).get("origin");
        const email = formData.get('email') as string

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/callback?next=/reset-password`,
        })

        if (error) {
            console.error("Forgot Password Error:", error)
            return { error: error.message }
        }

        return { success: true, message: 'Check your email for the reset link.' }
    } catch (e: any) {
        console.error("Forgot Password Panic:", e)
        return { error: e.message || "An unexpected error occurred during password reset request." }
    }
}

export async function updatePassword(formData: FormData) {
    try {
        const supabase = await createClient()
        const password = formData.get('password') as string

        const { error } = await supabase.auth.updateUser({
            password,
        })

        if (error) {
            console.error("Update Password Error:", error)
            return { error: error.message }
        }

        revalidatePath('/', 'layout')
        return { success: true, redirectTo: '/rooms' }
    } catch (e: any) {
        console.error("Update Password Panic:", e)
        return { error: e.message || "An unexpected error occurred during password update." }
    }
}
