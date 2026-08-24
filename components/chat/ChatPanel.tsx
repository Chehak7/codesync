"use client";

import { useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

interface Message {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    user: {
        id: string;
        display_name?: string;
        avatar_url?: string;
    };
}

interface ChatPanelProps {
    roomId: string;
    currentUserId: string;
    initialMessages: Message[];
}

export function ChatPanel({
    roomId,
    currentUserId,
    initialMessages,
}: ChatPanelProps) {
    const [unreadCount] = useState(0);

    return (
        <div className="h-full flex flex-col bg-transparent">
            <div className="p-8 border-b border-white/5 space-y-2 bg-white/[0.02] backdrop-blur-xl relative">
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-black flex items-center justify-between">
                    Team Chat
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/80 text-white text-[8px] font-black">{unreadCount}</span>
                    )}
                </h2>
                <p className="text-[11px] text-black/60 font-medium">Collaborate in real-time</p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <MessageList
                    roomId={roomId}
                    currentUserId={currentUserId}
                    initialMessages={initialMessages}
                />
                <div className="p-6 bg-white/[0.01] backdrop-blur-md border-t border-white/5">
                    <MessageInput roomId={roomId} />
                </div>
            </div>
        </div>
    );
}
