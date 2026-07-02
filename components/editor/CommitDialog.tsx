"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCommit: (message: string) => void;
}

export function CommitDialog({ open, onOpenChange, onCommit }: CommitDialogProps) {
    const [message, setMessage] = useState("");

    const handleCommit = () => {
        if (!message.trim()) return;
        onCommit(message);
        setMessage("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Commit Changes</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="What did you change?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCommit} disabled={!message.trim()}>
                        Save Version
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
