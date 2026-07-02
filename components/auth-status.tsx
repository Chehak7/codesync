"use client"

import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { User } from "@supabase/supabase-js"

export function AuthStatus({ user }: { user: User | null }) {
    if (!user) {
        return (
            <div className="flex gap-2">
                <Button asChild variant="ghost">
                    <a href="/login">Login</a>
                </Button>
                <Button asChild>
                    <a href="/signup">Sign Up</a>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
                {user.email}
            </div>
            <form action={signOut}>
                <Button variant="outline" size="sm">
                    Sign Out
                </Button>
            </form>
        </div>
    )
}
