'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';

import { User } from '@supabase/supabase-js';

interface LandingNavbarProps {
    user: User | null;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ user }) => {
    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-12 md:px-24 h-24 bg-neon-void/60 backdrop-blur-[30px] border-b border-glass-border shadow-2xl"
        >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-4 transition-transform hover:scale-105 active:scale-95 group">
                <div className="w-12 h-12 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-[1.2rem] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:rotate-6 transition-all duration-500">
                    <Code2 className="w-7 h-7 text-white" />
                </div>
                <span className="text-white font-black tracking-tighter text-2xl font-bricolage text-glow-purple transition-all duration-500 group-hover:text-glow-cyan">CodeSync</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-12 text-[14px] font-black uppercase tracking-[0.2em] text-white/30">
                <Link href="#features" className="hover:text-white hover:drop-shadow-[0_0_8px_#fff] transition-all">Features</Link>
                <Link href="#pricing" className="hover:text-white hover:drop-shadow-[0_0_8px_#fff] transition-all">Pricing</Link>
                <Link href="/docs" className="hover:text-white hover:drop-shadow-[0_0_8px_#fff] transition-all">Docs</Link>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-8">
                {user ? (
                    <Button asChild className="rounded-[1.2rem] bg-white text-black font-black h-14 px-10 text-base shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all">
                        <Link href="/rooms">Dashboard</Link>
                    </Button>
                ) : (
                    <>
                        <Link href="/login" className="text-white/30 hover:text-white hidden sm:flex font-black uppercase tracking-widest text-xs transition-colors">
                            Log in
                        </Link>
                        <Link href="/signup">
                            <button className="rounded-[1.2rem] bg-gradient-to-r from-neon-purple to-neon-magenta text-white font-black px-10 h-14 text-base transition-all hover:scale-[1.05] active:scale-95 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                                Try it Free
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </motion.nav>
    );
};
