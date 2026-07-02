'use client';

import React from 'react';
import { Search, LayoutTemplate, Settings } from 'lucide-react';

interface TitleBarProps {
    breadcrumbs?: string[];
    roomName?: string;
    onMenuClick?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
    roomName,
}) => {
    return (
        <div className="h-[52px] bg-glass-surface backdrop-blur-3xl border-b border-glass-border flex items-center justify-between px-6 select-none relative z-50 shadow-glass">
            {/* Left: Window Controls */}
            <div className="flex items-center gap-6">
                <div className="flex gap-2.5 p-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500/40 border border-red-500/20"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-500/40 border border-amber-500/20"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/40 border border-emerald-500/20"></div>
                </div>
            </div>

            {/* Center: Search Box */}
            <div className="flex-1 max-w-[700px] mx-8">
                <div className="h-[32px] bg-black/40 rounded-xl flex items-center justify-between px-4 border border-white/5 hover:border-neon-purple/50 transition-all cursor-pointer group shadow-inner">
                    <div className="flex items-center">
                        <Search className="w-3.5 h-3.5 text-white/30 mr-3 group-hover:text-neon-purple transition-colors" />
                        <span className="text-[13px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{roomName || 'search'}</span>
                    </div>
                    <kbd className="text-[10px] font-black text-neon-purple/50 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 group-hover:border-neon-purple/30 group-hover:text-neon-purple transition-all">⌘ P</kbd>
                </div>
            </div>

            {/* Right: Layout Controls */}
            <div className="flex items-center gap-3">
                <button className="p-2 h-10 w-10 flex items-center justify-center hover:bg-glass-highlight rounded-xl text-white/30 hover:text-white transition-all">
                    <LayoutTemplate className="w-5 h-5" />
                </button>
                <button className="p-2 h-10 w-10 flex items-center justify-center hover:bg-neon-purple/10 rounded-xl text-white/30 hover:text-neon-purple transition-all">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
