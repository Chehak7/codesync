"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAIAssistant } from "./AIAssistant";
import { Send, Trash2, Cpu, Code2, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export function AIChatView() {
    const { messages, isLoading, addMessage, clearChat, tokenUsage, maxTokens } = useAIAssistant();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const msg = input;
        setInput("");
        await addMessage(msg);
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden bg-transparent">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] pointer-events-none" />

            <div className="p-8 pb-4 relative z-10 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-transform hover:scale-110 duration-500">
                            <Cpu className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tighter text-white">Claude 3.5</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_6px_#06B6D4]" />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neon-cyan/60">System Online</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 rounded-lg hover:bg-white/5 text-white/10 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 px-8 py-6 relative z-10">
                <div className="space-y-8">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-6">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner group">
                                <Sparkles className="text-neon-cyan w-8 h-8 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-black text-xl text-white tracking-tighter">Initiate Sync</p>
                                <p className="text-xs font-bold text-white/20 px-8 leading-relaxed tracking-tight">Accelerate your dev cycle today.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 w-full max-w-[280px]">
                                <QuickActionButton icon={<Code2 className="w-3.5 h-3.5" />} label="Refactor Selection" />
                                <QuickActionButton icon={<MessageSquare className="w-3.5 h-3.5" />} label="Generate Tests" />
                            </div>
                        </div>
                    ) : (
                        messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[95%] p-4 rounded-2xl font-bold text-[13px] leading-relaxed shadow-xl transition-all ${m.role === "user"
                                    ? "bg-white text-black rounded-tr-none"
                                    : "bg-glass-surface text-white/90 rounded-tl-none border border-glass-border backdrop-blur-xl"
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-glass-surface text-white/40 p-4 rounded-2xl rounded-tl-none border border-glass-border flex items-center gap-2 shadow-xl backdrop-blur-xl">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-8 pt-4 border-t border-white/5 bg-black/20 space-y-6 relative z-10 backdrop-blur-3xl">
                <div className="space-y-3">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.3em] text-white/20 px-1">
                        <span>Quantum Credits</span>
                        <span className="text-neon-cyan">{Math.round((tokenUsage / maxTokens) * 100)}% Used</span>
                    </div>
                    <Progress value={(tokenUsage / maxTokens) * 100} className="h-1 bg-white/5" indicatorClassName="bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                </div>

                <div className="relative">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="min-h-[100px] bg-glass-surface border-glass-border rounded-2xl p-4 pr-16 text-sm font-bold focus-visible:ring-neon-cyan/30 resize-none placeholder:text-white/10 text-white shadow-xl backdrop-blur-xl"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-3 bottom-3 w-10 h-10 bg-white hover:bg-white/90 text-black rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all active:scale-90"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function QuickActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <Button variant="outline" className="w-full h-12 justify-start gap-4 px-6 border-glass-border bg-glass-surface hover:bg-glass-highlight rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white/30 transition-all hover:text-white shadow-sm group">
            <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center text-white/40 group-hover:text-neon-cyan transition-colors">
                {icon}
            </div>
            {label}
        </Button>
    );
}
