"use client"

import * as React from "react"
import { Github } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function OAuthButtons() {
    const [isLoading, setIsLoading] = React.useState<"google" | "github" | null>(null)
    const supabase = createClient()

    const handleOAuthLogin = async (provider: "google" | "github") => {
        setIsLoading(provider)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            toast.error(error.message || `Failed to login with ${provider}`)
            setIsLoading(null)
        }
    }

    return (
        <div className="flex gap-4 w-full">
            <button
                type="button"
                disabled={!!isLoading}
                onClick={() => handleOAuthLogin("google")}
                className={cn(
                    "flex-1 flex items-center justify-center gap-4 bg-white/5 border border-white/5 px-6 py-4 rounded-2xl transition-all duration-300",
                    "hover:border-neon-purple/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
                )}
            >
                {isLoading === "google" ? (
                    <div className="h-5 w-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                )}
                <span className="text-sm font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Google</span>
            </button>

            <button
                type="button"
                disabled={!!isLoading}
                onClick={() => handleOAuthLogin("github")}
                className={cn(
                    "flex-1 flex items-center justify-center gap-4 bg-white/5 border border-white/5 px-6 py-4 rounded-2xl transition-all duration-300",
                    "hover:border-neon-purple/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
                )}
            >
                {isLoading === "github" ? (
                    <div className="h-5 w-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Github className="h-5 w-5 text-white/40 group-hover:text-white group-hover:scale-110 transition-all" />
                )}
                <span className="text-sm font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">GitHub</span>
            </button>
        </div>
    )
}
