"use client";

import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { fetchMessages } from "@/actions/chat-actions";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface Message {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    user: {
        id: string;
        email?: string;
        avatar_url?: string;
    };
}

interface MessageListProps {
    roomId: string;
    currentUserId: string;
    initialMessages: Message[];
}

export function MessageList({ roomId, currentUserId, initialMessages }: MessageListProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialMessages.length === 50);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Auto-scroll to bottom
    useEffect(() => {
        if (shouldAutoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, shouldAutoScroll]);

    // Detect if user scrolled up
    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isAtBottom);
        }
    };

    // Real-time subscription
    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel(`room:${roomId}:messages`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                async (payload: any) => {
                    // Fetch full message with user data
                    const { data } = await supabase
                        .from("messages")
                        .select(`
                            *,
                            user:profiles(id, email, avatar_url)
                        `)
                        .eq("id", payload.new.id)
                        .single();

                    if (data) {
                        setMessages((prev) => [...prev, data as Message]);
                        setShouldAutoScroll(true);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === payload.new.id
                                ? { ...msg, ...payload.new }
                                : msg
                        )
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    const loadMore = async () => {
        setIsLoadingMore(true);
        const result = await fetchMessages(roomId, 50, messages.length);
        setIsLoadingMore(false);

        if (result.data && result.data.length > 0) {
            setMessages((prev) => [...result.data!, ...prev]);
            setHasMore(result.data!.length === 50);
        } else {
            setHasMore(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4" ref={scrollRef} onScroll={handleScroll}>
                {hasMore && (
                    <div className="flex justify-center mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadMore}
                            disabled={isLoadingMore}
                        >
                            {isLoadingMore ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Load More"
                            )}
                        </Button>
                    </div>
                )}

                <div className="space-y-4">
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
