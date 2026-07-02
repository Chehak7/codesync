'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeEditor } from '@/components/editor/CodeEditor';

interface EditorTab {
    id: string;
    name: string;
    language: string;
    isDirty?: boolean;
}

interface EditorAreaProps {
    tabs: EditorTab[];
    activeTabId: string | null;
    onTabChange: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    code: string;
    language: string;
    onChange: (value: string | undefined) => void;
    readOnly?: boolean;
    fontSize?: number;
    minimap?: boolean;
    lineNumbers?: 'on' | 'off';
}

export const EditorArea: React.FC<EditorAreaProps> = ({
    tabs,
    activeTabId,
    onTabChange,
    onTabClose,
    code,
    language,
    onChange,
    readOnly = false,
    fontSize = 14,
    minimap = true,
    lineNumbers = 'on',
}) => {
    return (
        <div className="flex-1 flex flex-col bg-neon-void overflow-hidden">
            {/* Tab Bar */}
            {tabs.length > 0 && (
                <div className="flex items-center bg-black/40 border-b border-glass-border overflow-x-auto no-scrollbar h-[44px]">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                'flex items-center gap-3 px-5 h-full cursor-pointer relative min-w-[160px] max-w-[240px] border-r border-glass-border group select-none transition-all',
                                activeTabId === tab.id
                                    ? 'bg-glass-active text-white'
                                    : 'bg-transparent text-white/30 hover:bg-glass-surface hover:text-white/60'
                            )}
                        >
                            {/* Active Tab Indicator */}
                            {activeTabId === tab.id && (
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-neon-cyan shadow-[0_0_10px_#06B6D4]" />
                            )}

                            <span className={cn(
                                "text-[11px] font-black uppercase tracking-[0.15em] truncate flex-1 flex items-center gap-2",
                                activeTabId === tab.id ? "text-white" : "text-white/30 group-hover:text-white/60"
                            )}>
                                {tab.name || "Untitled"}
                                {tab.isDirty && <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full shadow-[0_0_8px_#06B6D4]" />}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTabClose(tab.id);
                                }}
                                className={cn(
                                    "p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-white/40 hover:text-white",
                                    tab.isDirty && "opacity-100" // Always show close if dirty but maybe use a different icon or state
                                )}
                                aria-label="Close tab"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Breadcrumbs */}
            {activeTabId && (
                <div className="h-[28px] px-6 flex items-center bg-transparent text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 border-b border-white/5 select-none">
                    <span className="hover:text-neon-cyan transition-colors cursor-pointer">src</span>
                    <span className="mx-2 opacity-30 text-neon-purple">•</span>
                    <span className="hover:text-neon-cyan transition-colors cursor-pointer">{tabs.find(t => t.id === activeTabId)?.name}</span>
                </div>
            )}

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden bg-neon-void relative">
                {activeTabId ? (
                    <CodeEditor
                        code={code}
                        language={language}
                        onChange={onChange}
                        readOnly={readOnly}
                        fontSize={fontSize}
                        minimap={minimap}
                        lineNumbers={lineNumbers}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-6 opacity-20">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-neon-purple to-neon-cyan rounded-[2.5rem] flex items-center justify-center animate-pulse">
                                <span className="text-4xl font-black text-white">CS</span>
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Select a file to sync</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
