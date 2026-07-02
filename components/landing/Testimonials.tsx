'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        name: "Alex Rivera",
        role: "Senior Frontend Engineer",
        content: "CodeSync has completely transformed how our team pair programs. It's incredibly fast and the AI assistant is actually helpful.",
        rating: 5
    },
    {
        name: "Sarah Chen",
        role: "CTO at TechFlow",
        content: "The best collaborative editor I've used. The glassmorphism design isn't just pretty—it's a joy to work in every day.",
        rating: 5
    },
    {
        name: "Marcus Thorne",
        role: "Open Source Contributor",
        content: "Seamless, beautiful, and powerful. Being able to code, chat, and debug in real-time has cut our PR time in half.",
        rating: 5
    }
];

export const Testimonials: React.FC = () => {
    return (
        <section className="py-32 px-6 md:px-12 relative z-10">
            <div className="container mx-auto">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-5xl font-black text-white font-bricolage mb-4 tracking-tighter">
                        Loved by developers <span className="text-neon-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">worldwide</span>.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="p-10 rounded-[2rem] bg-white/5 border border-white/5 hover:border-neon-cyan/20 hover:bg-white/[0.08] transition-all duration-300 group"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-neon-cyan text-neon-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.2)]" />
                                ))}
                            </div>
                            <p className="text-white/60 text-lg leading-relaxed mb-8 italic font-medium">
                                &quot;{testimonial.content}&quot;
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center font-black text-black">
                                    {testimonial.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{testimonial.name}</h4>
                                    <p className="text-sm text-white/30">{testimonial.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
