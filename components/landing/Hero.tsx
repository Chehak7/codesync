'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { TypeAnimation } from 'react-type-animation';

interface HeroProps {
    user: User | null;
}

export const Hero: React.FC<HeroProps> = () => {
    return (
        <div className="container mx-auto px-6 md:px-12 pt-48 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            {/* Left Content */}
            <div className="flex flex-col gap-8 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className="text-[84px] font-[900] text-white leading-[1.0] tracking-tighter mb-8">
                        <TypeAnimation
                            sequence={[
                                'Collaborate.',
                                1000,
                                'Debug.',
                                1000,
                                'Deploy.',
                                1000,
                                'Sync Your Code',
                                2000,
                            ]}
                            wrapper="span"
                            speed={50}
                            repeat={Infinity}
                        />
                        <br />
                        <span className="bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-purple bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                            Instantly.
                        </span>
                    </h1>

                    <p className="text-2xl text-white/50 leading-relaxed max-w-[700px] mb-12 font-medium">
                        The ultimate real-time workspace for modern engineering teams.
                        Experience zero-latency collaboration with a design that inspires.
                    </p>

                    <div className="flex flex-wrap gap-8">
                        <Link href="/signup">
                            <button className="h-[72px] px-12 rounded-[24px] bg-white text-black font-black text-xl transition-all hover:scale-[1.05] active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-2 group">
                                Get Started <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                            </button>
                        </Link>
                        <button className="h-[72px] px-12 rounded-[24px] bg-glass-surface border border-glass-border text-white font-bold text-xl transition-all hover:bg-glass-highlight hover:scale-[1.05] active:scale-95 flex items-center gap-2 backdrop-blur-xl">
                            <Play className="w-6 h-6 fill-neon-purple text-neon-purple" /> View Demo
                        </button>
                    </div>

                </motion.div>
            </div>

            {/* Right Column - Animated Demo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative hidden lg:block"
            >
                <div className="relative glass-card border-neon-purple/20 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
                    {/* Fake Editor Header */}
                    <div className="h-14 bg-white/5 border-b border-white/5 flex items-center px-8 gap-4">
                        <div className="flex gap-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-red-500/30" />
                            <div className="w-3.5 h-3.5 rounded-full bg-amber-500/30" />
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/30" />
                        </div>
                        <div className="mx-auto text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">lib/core/sync.ts</div>
                    </div>

                    {/* Editor Content Overlay */}
                    <div className="p-12 font-mono text-base leading-relaxed text-white/40">
                        <div className="flex gap-4">
                            <span className="text-white/10 w-8">01</span>
                            <span className="text-neon-purple font-bold">export</span>
                            <span className="text-neon-cyan font-bold">const</span>
                            <span className="text-white/80">CodeSync</span>
                            <span className="text-white/60">=</span>
                            <span className="text-white/80">{'() => {'}</span>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <span className="text-white/10 w-8">02</span>
                            <span className="pl-6 text-white/80">return </span>
                            <span className="text-neon-purple">{'{'}</span>
                        </div>
                        <div className="flex gap-4 mt-2">
                            <span className="text-white/10 w-8">03</span>
                            <span className="pl-12 text-neon-magenta">active:</span>
                            <span className="text-neon-cyan">true</span>
                            <span className="text-white/60">,</span>
                        </div>
                        <div className="flex gap-4 mt-2 pl-12 relative">
                            {/* Animated Cursor 1 */}
                            <motion.div
                                animate={{ x: [0, 200, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute left-10 top-0 w-[2px] h-6 bg-neon-purple shadow-[0_0_10px_#A855F7]"
                            >
                                <span className="absolute top-[-24px] left-0 px-3 py-1 bg-neon-purple text-[9px] text-white rounded-lg font-sans uppercase font-black tracking-tighter">Chehak</span>
                            </motion.div>
                            <span className="text-white/10 w-8">04</span>
                            <span className="text-white/40 italic">latency:</span>
                            <span className="text-neon-cyan">&quot;0ms&quot;</span>
                        </div>
                        <div className="flex gap-4 mt-4">
                            <span className="text-white/10 w-8">05</span>
                            <span className="pl-6 text-neon-purple">{'}'}</span>
                        </div>
                        <div className="flex gap-4 mt-2">
                            <span className="text-white/10 w-8">06</span>
                            <span className="text-white/80">{'}'}</span>
                        </div>
                    </div>

                    {/* Floating Illustration Elements */}
                    <motion.div
                        animate={{
                            y: [0, -30, 0],
                            rotate: [12, 24, 12]
                        }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className="absolute bottom-[-20px] right-[-20px] w-48 h-48 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-[3rem] blur-[60px] opacity-20"
                    />
                </div>
            </motion.div>
        </div>
    );
};
