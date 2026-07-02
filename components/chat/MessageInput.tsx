"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Smile } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { sendMessage } from "@/actions/chat-actions";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/socket-provider";

interface MessageInputProps {
    roomId: string;
}

export function MessageInput({ roomId }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { socket } = useSocket();
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    const handleTyping = () => {
        if (socket) {
            socket.emit("typing", { roomId });

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stop-typing", { roomId });
            }, 2000);
        }
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
            if (socket) {
                socket.emit("stop-typing", { roomId });
            }
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
                    handleTyping();
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
