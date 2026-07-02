'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, ChevronDown, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TerminalManager } from '../terminal/TerminalManager';

type PanelTab = 'terminal' | 'output' | 'problems';

interface PanelProps {
    isOpen: boolean;
    onToggle: () => void;
    height?: number;
    onHeightChange?: (height: number) => void;
}

export const Panel: React.FC<PanelProps> = ({
    isOpen,
    onToggle,
    height = 200,
    onHeightChange,
}) => {
    const [activeTab, setActiveTab] = useState<PanelTab>('terminal');
    const [isResizing, setIsResizing] = useState(false);

    const tabs: Array<{ id: PanelTab; label: string }> = [
        { id: 'problems', label: 'PROBLEMS' },
        { id: 'output', label: 'OUTPUT' },
        { id: 'terminal', label: 'TERMINAL' },
    ];

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newHeight = window.innerHeight - e.clientY;
            if (onHeightChange && newHeight >= 100 && newHeight <= 600) {
                onHeightChange(newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, onHeightChange]);

    if (!isOpen) return null;

    return (
        <div
            className="bg-black/60 backdrop-blur-3xl border-t border-glass-border flex flex-col relative shadow-[0_-20px_50px_rgba(0,0,0,0.3)]"
            style={{ height: `${height}px` }}
        >
            {/* Resize Handle */}
            <div
                onMouseDown={handleMouseDown}
                className="absolute top-0 left-0 right-0 h-[2px] cursor-ns-resize hover:bg-neon-purple/50 bg-white/5 transition-all z-[100]"
            />

            {/* Tab Bar */}
            <div className="flex items-center justify-between px-6 h-[44px] select-none border-b border-white/5">
                <div className="flex items-center gap-8 h-full">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'h-full flex items-center text-[10px] font-black uppercase tracking-[0.2em] relative px-1 transition-all',
                                    isActive
                                        ? 'text-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                                        : 'text-white/20 hover:text-white/40'
                                )}
                            >
                                {tab.label}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon-cyan shadow-[0_0_10px_#06B6D4]" />
                                )}
                                {tab.id === 'problems' && (
                                    <div className="flex items-center gap-1.5 ml-3">
                                        <span className="text-[10px] text-white/20">0</span>
                                        <AlertCircle className="w-3.5 h-3.5 text-white/10" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggle}
                        className="p-1.5 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onToggle}
                        className="p-1.5 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all transform hover:translate-y-0.5"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden bg-neon-void/40">
                {activeTab === 'terminal' && (
                    <TerminalManager />
                )}
                {activeTab === 'output' && (
                    <ScrollArea className="h-full p-6">
                        <div className="font-mono text-sm space-y-2">
                            <p className="text-neon-purple/60">[Info] <span className="text-white/40">Server started at port 3000</span></p>
                            <p className="text-neon-cyan/60">[Info] <span className="text-white/40">Database connected</span></p>
                            <p className="text-neon-magenta/60">[Sync] <span className="text-white/40">Workspace hydrated successfully</span></p>
                        </div>
                    </ScrollArea>
                )}
                {activeTab === 'problems' && (
                    <ScrollArea className="h-full p-6">
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-20">
                            <AlertCircle className="w-10 h-10 text-white" />
                            <p className="text-xs font-black uppercase tracking-widest text-white">No problems detected</p>
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
};
