import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="container max-w-2xl py-24 px-4 mx-auto font-sans relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-cyan/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="glass-card overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border-glass-border">
                <CardHeader className="flex flex-col items-center gap-10 py-24 bg-gradient-to-b from-glass-highlight to-transparent relative border-b border-white/5">
                    <div className="relative group">
                        {/* Avatar Halo */}
                        <div className="absolute -inset-6 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full blur-3xl opacity-20 group-hover:opacity-40 animate-pulse transition duration-1000"></div>

                        <Avatar className="h-44 w-44 rounded-full border-4 border-white/10 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative transition-all duration-700 group-hover:scale-105 group-hover:shadow-[0_0_60px_rgba(6,182,212,0.4)]">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="text-7xl font-black bg-neon-void text-white text-glow-cyan">{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="text-center space-y-4 relative z-10">
                        <CardTitle className="text-5xl font-black tracking-tighter text-white text-glow-cyan drop-shadow-2xl">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </CardTitle>
                        <p className="text-neon-cyan/50 font-black text-[11px] uppercase tracking-[0.3em] bg-neon-cyan/5 px-6 py-2 rounded-full inline-block border border-neon-cyan/20 backdrop-blur-md">
                            {user.email}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="p-12 space-y-8 relative z-10 bg-black/20">
                    <div className="flex flex-col gap-6">
                        <Button asChild variant="ghost" className="h-24 justify-between px-10 rounded-[2rem] bg-glass-surface hover:bg-glass-highlight transition-all border border-glass-border group">
                            <Link href="/settings" className="flex items-center w-full">
                                <div className="flex items-center gap-8">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-neon-cyan/20 transition-all duration-500">
                                        <Settings className="h-7 w-7 text-white/40 group-hover:text-neon-cyan transition-colors" />
                                    </div>
                                    <span className="font-black text-xs uppercase tracking-[0.2em] text-white/30 group-hover:text-white transition-colors">Workspace Settings</span>
                                </div>
                            </Link>
                        </Button>

                        <form action={signOut}>
                            <Button variant="ghost" className="h-24 w-full justify-between px-10 rounded-[2rem] bg-neon-pink/5 hover:bg-neon-pink/10 transition-all border border-neon-pink/10 group">
                                <div className="flex items-center gap-8">
                                    <div className="w-14 h-14 rounded-2xl bg-neon-pink/5 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-neon-pink/20 transition-all duration-500">
                                        <LogOut className="h-7 w-7 text-neon-pink/40 group-hover:text-neon-pink transition-colors" />
                                    </div>
                                    <span className="font-black text-xs uppercase tracking-[0.2em] text-neon-pink/40 group-hover:text-neon-pink transition-colors">Disconnect Account</span>
                                </div>
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
