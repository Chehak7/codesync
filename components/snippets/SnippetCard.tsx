"use client";

import { Snippet } from "@/types/snippet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Edit, Play, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteSnippet, incrementUsageCount } from "@/actions/snippet-actions";

interface SnippetCardProps {
    snippet: Snippet;
    currentUserId?: string;
    onInsert: (code: string, snippetId: string) => void;
    onEdit: (snippet: Snippet) => void;
    onDelete?: () => void;
}

export function SnippetCard({ snippet, currentUserId, onInsert, onEdit, onDelete }: SnippetCardProps) {
    const isOwner = currentUserId === snippet.author_id;
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(snippet.code);
        toast.success("Code copied to clipboard");
        incrementUsageCount(snippet.id);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this snippet?")) return;
        setIsDeleting(true);
        const result = await deleteSnippet(snippet.id);
        setIsDeleting(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Snippet deleted");
            onDelete?.();
        }
    };

    return (
        <Card className="bg-[#1e1e1e] border-white/10 overflow-hidden group hover:border-white/20 transition-all">
            <CardHeader className="p-3 pb-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium text-white line-clamp-1" title={snippet.title}>
                        {snippet.title}
                    </CardTitle>
                    <div className="flex items-center gap-1 shrink-0">
                        {snippet.language && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/10 text-white/60">
                                {snippet.language}
                            </Badge>
                        )}
                        {snippet.is_public && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20">
                                Public
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="text-[11px] text-white/40 line-clamp-2 min-h-[2em]">
                    {snippet.description || "No description provided."}
                </div>
            </CardHeader>
            <CardContent className="p-0 border-y border-white/5 bg-[#1a1a1a]">
                <ScrollArea className="h-24 w-full">
                    <pre className="p-3 text-[10px] font-mono text-white/70 whitespace-pre">
                        {snippet.code}
                    </pre>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-2 gap-1 bg-[#1e1e1e]">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/50 hover:text-neon-cyan hover:bg-neon-cyan/10"
                    onClick={() => onInsert(snippet.code, snippet.id)}
                    title="Insert Snippet"
                >
                    <Play className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/50 hover:text-white"
                    onClick={handleCopy}
                    title="Copy Code"
                >
                    <Copy className="h-3.5 w-3.5" />
                </Button>

                <div className="flex-1" />

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isOwner && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-white/50 hover:text-white"
                                onClick={() => onEdit(snippet)}
                            >
                                <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-white/50 hover:text-red-400"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                <Trash className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
