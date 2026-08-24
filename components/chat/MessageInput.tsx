"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Smile } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { sendMessage } from "@/actions/chat-actions";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

interface MessageInputProps {
    roomId: string;
}

export function MessageInput({ roomId }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingChannelRef = useRef<RealtimeChannel | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingActiveRef = useRef(false);
    const typingClientIdRef = useRef(crypto.randomUUID());

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase.channel(`room:${roomId}:messages`, {
            config: {
                private: true,
                broadcast: { ack: true, self: false },
            },
        });

        void supabase.realtime.setAuth();
        channel.subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
                typingChannelRef.current = channel;
            }
        });

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (typingActiveRef.current) {
                void channel.send({
                    type: "broadcast",
                    event: "stop-typing",
                    payload: { clientId: typingClientIdRef.current },
                });
            }
            typingChannelRef.current = null;
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    const stopTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        if (!typingActiveRef.current) return;
        typingActiveRef.current = false;
        void typingChannelRef.current?.send({
            type: "broadcast",
            event: "stop-typing",
            payload: { clientId: typingClientIdRef.current },
        });
    };

    const handleTyping = (value: string) => {
        if (!value.trim()) {
            stopTyping();
            return;
        }

        if (!typingActiveRef.current && typingChannelRef.current) {
            typingActiveRef.current = true;
            void typingChannelRef.current.send({
                type: "broadcast",
                event: "typing",
                payload: { clientId: typingClientIdRef.current },
            });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, 2000);
    };

    const handleSend = async () => {
        if (!message.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const result = await sendMessage(roomId, message);
        setIsSubmitting(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            setMessage("");
            stopTyping();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setMessage((prev) => prev + emojiData.emoji);
        setIsEmojiOpen(false);
        textareaRef.current?.focus();
    };

    return (
        <div className="flex gap-2 p-4 border-t">
            <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Smile className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-full p-0">
                    <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" />
                </PopoverContent>
            </Popover>

            <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="min-h-[40px] max-h-[120px] resize-none"
                rows={1}
            />

            <Button onClick={handleSend} disabled={!message.trim() || isSubmitting} size="icon">
                <Send className="h-5 w-5" />
            </Button>
        </div>
    );
}
