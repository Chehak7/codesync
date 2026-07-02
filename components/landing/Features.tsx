'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, Terminal, GitBranch, Mic, Palette } from 'lucide-react';

const features = [
    {
        icon: <Users className="w-8 h-8" />,
        title: "Real-Time Collaboration",
        description: "Seamlessly work together with multi-cursor support and presence indicators that feel natively integrated."
    },
    {
        icon: <Sparkles className="w-8 h-8" />,
        title: "AI Code Assistant",
        description: "Leverage generative AI to refactor code, write tests, and explain complex logic in seconds."
    },
    {
        icon: <Terminal className="w-8 h-8" />,
        title: "Built-in Terminal",
        description: "Run scripts, manage dependencies, and execute commands directly within your environment."
    },
    {
        icon: <GitBranch className="w-8 h-8" />,
        title: "Version Control",
        description: "Powerful git integration to manage your codebase and track changes effortlessly."
    },
    {
        icon: <Mic className="w-8 h-8" />,
        title: "Voice Chat",
        description: "Communicate with your team in real-time with high-quality built-in voice channels."
    },
    {
        icon: <Palette className="w-8 h-8" />,
        title: "Premium Themes",
        description: "Beautiful, hand-crafted themes designed to maximize productivity and reduce eye strain."
    }
];

export const Features: React.FC = () => {
    return (
        <section id="features" className="py-32 px-6 md:px-12 relative z-10 font-instrument">
            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-8xl font-black text-white leading-tight font-bricolage tracking-tighter"
                    >
                        Built for <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">modern</span> engineering teams.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="mt-8 text-2xl text-white/30 font-medium"
                    >
                        Every tool you need to build faster, together.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="p-12 glass-card hover:bg-glass-highlight hover:border-neon-cyan/30 transition-all duration-500 group relative overflow-hidden"
                        >
                            {/* Card Background Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-[60px] group-hover:bg-neon-cyan/10 transition-colors" />

                            <div className="mb-8 w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-neon-cyan group-hover:scale-110 transition-all duration-500 shadow-inner group-hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                {React.cloneElement(feature.icon as React.ReactElement, { className: "w-10 h-10" })}
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-white/40 leading-relaxed text-lg font-medium">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
