"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SnippetList } from "./SnippetList";
import { SnippetDialog } from "./SnippetDialog";
import { Snippet } from "@/types/snippet";

interface SnippetPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUserId: string;
    onInsert: (code: string, snippetId: string) => void;
}

export function SnippetPanel({ open, onOpenChange, currentUserId, onInsert }: SnippetPanelProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleCreate = () => {
        setEditingSnippet(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (snippet: Snippet) => {
        setEditingSnippet(snippet);
        setIsDialogOpen(true);
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="left"
                className="w-[400px] sm:w-[500px] bg-[#0c0c0c] border-r border-white/10 p-0 flex flex-col pt-14"
            >
                <SheetHeader className="px-4 pb-2 border-b border-white/5 bg-[#0c0c0c]">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-sm font-semibold text-white">Snippets Library</SheetTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCreate}
                            className="bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/20 h-7 text-xs gap-1"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New Snippet
                        </Button>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden p-4">
                    <SnippetList
                        currentUserId={currentUserId}
                        onInsert={(code, id) => {
                            onInsert(code, id);
                            // Optional: Close panel on insert?
                            // onOpenChange(false);
                        }}
                        onEdit={handleEdit}
                        refreshTrigger={refreshTrigger}
                    />
                </div>

                <SnippetDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    snippetToEdit={editingSnippet}
                    onSuccess={handleSuccess}
                />
            </SheetContent>
        </Sheet>
    );
}
