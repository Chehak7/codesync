"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Code2, Settings, User, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "@/app/actions/auth"
import { User as UserType } from "@supabase/supabase-js"

export function Navbar({ user }: { user: UserType | null }) {
    const pathname = usePathname()

    if (pathname === "/") return null;

    return (
        <header className="sticky top-0 z-[100] w-full bg-glass-surface backdrop-blur-xl border-b border-glass-border">
            <div className="container flex h-20 items-center px-4 md:px-8 max-w-7xl mx-auto">
                <div className="mr-8 flex items-center">
                    <Link href="/" className="flex items-center space-x-4 group transition-transform hover:scale-105 active:scale-95">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:rotate-6 transition-all duration-500">
                            <Code2 className="h-6 w-6 text-white" />
                        </div>
                        <span className="hidden font-black sm:inline-block text-2xl tracking-tighter text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                            CodeSync
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-10 text-[10px] font-black uppercase tracking-[0.2em] ml-12">
                        <Link
                            href="/rooms"
                            className={cn(
                                "transition-all relative py-2",
                                pathname === "/rooms" ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "text-white/40 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                            )}
                        >
                            Dashboard
                        </Link>
                    </nav>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-8">
                    <div className="hidden md:flex items-center">
                        <Button
                            variant="ghost"
                            className="relative h-12 w-56 lg:w-72 justify-start text-[11px] text-white/30 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white transition-all font-bold uppercase tracking-widest shadow-inner"
                            onClick={() => {
                                const event = new KeyboardEvent('keydown', {
                                    key: 'k',
                                    metaKey: true,
                                    bubbles: true
                                });
                                document.dispatchEvent(event);
                            }}
                        >
                            <span className="hidden lg:inline-flex px-4">Search actions...</span>
                            <span className="inline-flex lg:hidden px-4">Search...</span>
                            <kbd className="pointer-events-none absolute right-3 top-3 hidden h-6 select-none items-center gap-1 rounded-lg bg-black/40 px-2 font-mono text-[9px] font-black text-neon-cyan border border-white/5 shadow-xl sm:flex">
                                ⌘K
                            </kbd>
                        </Button>
                    </div>

                    <nav className="flex items-center space-x-4">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-12 w-12 rounded-2xl p-0 hover:bg-white/5 transition-all">
                                        <Avatar className="h-10 w-10 border-2 border-neon-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                                            <AvatarFallback className="bg-neon-cyan text-white font-black">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 rounded-[2.5rem] border border-glass-border bg-black/80 backdrop-blur-[24px] text-white shadow-[0_0_30px_rgba(0,0,0,0.5)] p-4 mt-4" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal p-4">
                                        <div className="flex flex-col space-y-2">
                                            <p className="text-sm font-black leading-none text-white">{user.email}</p>
                                            <p className="text-[10px] uppercase tracking-[0.1em] leading-none text-neon-purple font-bold">
                                                {user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/5 mx-2" />
                                    <div className="p-2 space-y-1">
                                        <DropdownMenuItem asChild className="rounded-xl focus:bg-neon-purple/20 focus:text-neon-purple group">
                                            <Link href="/profile" className="flex items-center cursor-pointer py-3">
                                                <User className="mr-4 h-5 w-5 text-white/30 group-focus:text-neon-purple transition-colors" />
                                                <span className="font-black text-[10px] uppercase tracking-[0.15em] text-white/40 group-focus:text-neon-purple transition-colors">Profile</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="rounded-xl focus:bg-neon-cyan/20 focus:text-neon-cyan group">
                                            <Link href="/settings" className="flex items-center cursor-pointer py-3">
                                                <Settings className="mr-4 h-5 w-5 text-white/30 group-focus:text-neon-cyan transition-colors" />
                                                <span className="font-black text-[10px] uppercase tracking-[0.15em] text-white/40 group-focus:text-neon-cyan transition-colors">Settings</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-white/5 mx-2" />
                                        <form action={signOut}>
                                            <DropdownMenuItem asChild className="rounded-xl focus:bg-neon-pink/20 focus:text-neon-pink group">
                                                <button className="w-full text-left flex items-center cursor-pointer py-3">
                                                    <LogOut className="mr-4 h-5 w-5 text-white/30 group-focus:text-neon-pink transition-colors" />
                                                    <span className="font-black text-[10px] uppercase tracking-[0.15em] text-white/40 group-focus:text-neon-pink transition-colors">Log out</span>
                                                </button>
                                            </DropdownMenuItem>
                                        </form>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Button asChild variant="ghost" className="h-12 px-8 rounded-xl text-white/40 font-black text-[11px] uppercase tracking-[0.15em] hover:text-white hover:bg-white/5 transition-all">
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button asChild className="h-12 px-8 rounded-xl bg-neon-cyan hover:bg-neon-cyan/80 text-white font-black text-[11px] uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95">
                                    <Link href="/signup">Join Now</Link>
                                </Button>
                            </div>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    )
}
