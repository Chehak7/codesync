'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
    Files,
    Search,
    GitBranch,
    Users,
    Settings,
    MessageSquare,
    History,
    Cpu,
    Code2,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export type ActivityBarView = 'explorer' | 'search' | 'source-control' | 'members' | 'chat' | 'history' | 'settings' | 'ai' | 'snippets';

interface ActivityBarProps {
    activeView: ActivityBarView;
    onViewChange: (view: ActivityBarView) => void;
}

const activityItems: Array<{
    id: ActivityBarView;
    icon: React.ElementType;
    label: string;
}> = [
        { id: 'explorer', icon: Files, label: 'Explorer' },
        { id: 'search', icon: Search, label: 'Search' },
        { id: 'source-control', icon: GitBranch, label: 'Source Control' },
        { id: 'members', icon: Users, label: 'Members' },
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'ai', icon: Cpu, label: 'AI Assistant' },
        { id: 'snippets', icon: Code2, label: 'Snippets' },
    ];

const bottomItems: Array<{
    id: ActivityBarView;
    icon: React.ElementType;
    label: string;
}> = [
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

export const ActivityBar: React.FC<ActivityBarProps> = ({
    activeView,
    onViewChange,
}) => {
    return (
        <div className="w-[60px] bg-black/90 backdrop-blur-xl border-r border-glass-border flex flex-col items-center py-4 relative z-[70] shadow-glass">
            <TooltipProvider delayDuration={0}>
                {/* Top items */}
                <div className="flex flex-col gap-2 flex-1 w-full">
                    {activityItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;

                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => onViewChange(item.id)}
                                        className={cn(
                                            'w-full h-[60px] flex items-center justify-center relative group transition-all duration-300',
                                            isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-neon-cyan rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
                                        )}
                                        <Icon className={cn(
                                            "h-[28px] w-[28px] stroke-[1.5px] transition-colors duration-300",
                                            isActive ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "text-white"
                                        )} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-black/90 border border-glass-border text-white px-2 py-1 text-xs rounded-sm backdrop-blur-md">
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>

                {/* Bottom items */}
                <div className="flex flex-col gap-2 w-full pb-4">
                    {bottomItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => onViewChange(item.id)}
                                        className={cn(
                                            'w-full h-[60px] flex items-center justify-center relative group opacity-40 hover:opacity-100 transition-all duration-300'
                                        )}
                                    >
                                        <Icon className="h-[28px] w-[28px] text-white stroke-[1.5px] group-hover:text-white" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-black/90 border border-glass-border text-white px-2 py-1 text-xs rounded-sm backdrop-blur-md">
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </TooltipProvider>
        </div>
    );
};
