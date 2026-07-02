'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="py-20 px-6 md:px-12 border-t border-white/5 relative z-10 bg-black font-instrument">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center">
                                <Terminal className="w-6 h-6 text-black" />
                            </div>
                            <span className="text-white font-black tracking-tighter text-2xl font-bricolage">CodeSync</span>
                        </Link>
                        <p className="text-white/30 max-w-sm leading-relaxed font-bold tracking-tight">
                            Elevating the craft of software engineering through real-time collaboration. Designed for high-performance teams worldwide.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-black uppercase text-[11px] tracking-[0.3em] mb-8">Product</h4>
                        <ul className="space-y-4 text-white/40 font-bold text-sm">
                            <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="#developers" className="hover:text-white transition-colors">API Docs</Link></li>
                            <li><Link href="#changelog" className="hover:text-white transition-colors">Changelog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-black uppercase text-[11px] tracking-[0.3em] mb-8">Company</h4>
                        <ul className="space-y-4 text-white/40 font-bold text-sm">
                            <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/5 text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
                    <p>© 2026 CodeSync. All rights reserved.</p>
                    <div className="flex gap-12">
                        <Link href="#" className="hover:text-white transition-colors">Twitter (X)</Link>
                        <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
                        <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
