"use client";

import React, { useState, useCallback, useEffect } from "react";
import { XTermTerminal } from "./XTermTerminal";
import { Plus, X, Search, Trash2, LayoutGrid, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSocket } from "@/components/providers/socket-provider";

interface TerminalTab {
    id: string;
    title: string;
    shell: string;
    cwd: string;
}

export const TerminalManager = () => {
    const { socket } = useSocket();
    const [tabs, setTabs] = useState<TerminalTab[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('terminal_tabs');
            return saved ? JSON.parse(saved) : [
                { id: "1", title: "bash", shell: "bash", cwd: "" }
            ];
        }
        return [{ id: "1", title: "bash", shell: "bash", cwd: "" }];
    });
    const [activeTabId, setActiveTabId] = useState<string>(tabs[0]?.id || "1");
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSplit, setIsSplit] = useState(false);

    useEffect(() => {
        localStorage.setItem('terminal_tabs', JSON.stringify(tabs));
    }, [tabs]);

    const addTab = useCallback(() => {
        const newId = Math.random().toString(36).substring(7);
        const newTab: TerminalTab = {
            id: newId,
            title: `bash ${tabs.length + 1}`,
            shell: "bash",
            cwd: "",
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newId);
    }, [tabs.length]);

    const closeTab = useCallback((id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        // Emit close to backend
        socket?.emit("terminal-close", { termId: id });

        setTabs((prev) => {
            const newTabs = prev.filter((t) => t.id !== id);
            if (activeTabId === id && newTabs.length > 0) {
                setActiveTabId(newTabs[newTabs.length - 1].id);
            }
            return newTabs;
        });
    }, [activeTabId, socket]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 't') {
                e.preventDefault();
                addTab();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'w' && tabs.length > 1) {
                // Warning: Cmd+W might close the browser tab too if not careful
                // e.preventDefault();
                // closeTab(activeTabId);
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                setShowSearch(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [addTab, closeTab, activeTabId, tabs.length]);

    return (
        <div className="flex flex-col h-full bg-black">
            {/* Terminal Tab Bar */}
            <div className="flex items-center justify-between border-b border-white/5 bg-black/40 px-2 h-10 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={cn(
                                "group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all text-xs font-medium min-w-[100px] max-w-[200px] truncate",
                                activeTabId === tab.id
                                    ? "bg-black text-white border-x border-t border-white/10"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                            )}
                        >
                            <span className="truncate">{tab.title}</span>
                            <button
                                onClick={(e) => closeTab(tab.id, e)}
                                className={cn(
                                    "p-0.5 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity",
                                    activeTabId === tab.id && "opacity-100"
                                )}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addTab}
                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-all"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-1 pr-2">
                    {showSearch && (
                        <div className="flex items-center gap-2 bg-black border border-white/10 rounded-md px-2 py-1 mr-2 animate-in fade-in slide-in-from-right-2">
                            <Search className="h-3 w-3 text-white/40" />
                            <input
                                className="bg-transparent border-none outline-none text-[11px] text-white w-32"
                                placeholder="Find..."
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button onClick={() => setShowSearch(false)}>
                                <X className="h-3 w-3 text-white/40 hover:text-white" />
                            </button>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/5"
                        onClick={() => setShowSearch(!showSearch)}
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/5"
                        onClick={() => setIsSplit(!isSplit)}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/5"
                            >
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0c] border-white/10 text-white">
                            <DropdownMenuLabel>Terminal Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="hover:bg-white/5 focus:bg-white/5">
                                Shell: /bin/bash
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-white/5 focus:bg-white/5">
                                Font Size: 14px
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                                className="text-red-400 hover:bg-red-400/10 focus:bg-red-400/10"
                                onClick={() => tabs.forEach(t => closeTab(t.id))}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear All Sessions
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Terminal Content Area */}
            <div className={cn(
                "flex-1 overflow-hidden p-2 relative",
                isSplit ? "grid grid-cols-2 gap-2" : "block"
            )}>
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={cn(
                            "w-full h-full",
                            isSplit || activeTabId === tab.id ? "block" : "hidden"
                        )}
                    >
                        <XTermTerminal
                            termId={tab.id}
                            shell={tab.shell}
                            cwd={tab.cwd}
                            searchQuery={activeTabId === tab.id ? searchQuery : ""}
                            className="rounded-lg overflow-hidden border border-white/5"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
