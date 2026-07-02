"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { editMessage, deleteMessage } from "@/actions/chat-actions";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

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

interface MessageBubbleProps {
    message: Message;
    currentUserId: string;
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isOwn = message.user_id === currentUserId;
    const userName = message.user.email?.split("@")[0] || "Anonymous";
    const avatarUrl = message.user.avatar_url;

    const handleEdit = async () => {
        if (editedContent.trim() === message.content) {
            setIsEditing(false);
            return;
        }

        setIsSubmitting(true);
        const result = await editMessage(message.id, editedContent);
        setIsSubmitting(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Message updated");
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        const result = await deleteMessage(message.id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Message deleted");
        }
    };

    return (
        <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
            <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black">{userName}</span>
                    <span className="text-xs text-black/40">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                </div>

                <Card className={`p-3 ${isOwn ? "bg-white text-black border-none shadow-sm" : "bg-glass-surface text-black border border-glass-border"}`}>
                    {isEditing ? (
                        <div className="space-y-2">
                            <Textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="min-h-[60px] text-black"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleEdit} disabled={isSubmitting} className="bg-black text-white hover:bg-black/80">
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedContent(message.content);
                                    }}
                                    className="border-black/10 text-black hover:bg-black/5"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap break-words text-black">{message.content}</p>
                    )}
                </Card>

                {isOwn && !isEditing && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
