'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export const CTASection: React.FC = () => {
    return (
        <section className="py-32 px-6 md:px-12 relative z-10">
            <div className="container mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="p-20 rounded-[3rem] bg-gradient-to-br from-neon-cyan via-neon-magenta to-neon-purple text-white text-center shadow-[0_0_80px_rgba(6,182,212,0.2)] overflow-hidden relative border border-white/10"
                >
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-neon-purple opacity-10 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-[100px] -ml-48 -mb-48 animate-pulse [animation-delay:2s]" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-5xl md:text-8xl font-black font-bricolage mb-8 leading-tight tracking-tighter">
                            Ready to start <span className="text-glow-cyan">syncing</span>?
                        </h2>
                        <p className="text-2xl text-white/60 mb-12 font-medium tracking-tight">
                            Join over 10,000 developers building the future of software, together.
                            Set up your first room in less than 30 seconds.
                        </p>
                        <Link href="/signup">
                            <button className="h-[72px] px-14 rounded-2xl bg-white text-black font-black text-xl hover:scale-[1.05] active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] group">
                                Start Coding Free
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
