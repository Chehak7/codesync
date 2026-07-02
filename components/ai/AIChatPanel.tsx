"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AIChatView } from "./AIChatView";

export function AIChatPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[450px] sm:w-[540px] p-0 bg-neon-void border-l border-glass-border flex flex-col shadow-2xl relative overflow-hidden z-[1000]">
                <SheetHeader className="sr-only">
                    <SheetTitle>AI Assistant</SheetTitle>
                    <SheetDescription>Chat with Claude 3.5 Assistant</SheetDescription>
                </SheetHeader>
                <AIChatView />
            </SheetContent>
        </Sheet>
    );
}
