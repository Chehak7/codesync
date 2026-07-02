"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DiffEditor } from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface VersionDiffModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originalContent: string;
    modifiedContent: string;
    versionName: string;
}

export function VersionDiffModal({
    open,
    onOpenChange,
    originalContent,
    modifiedContent,
    versionName
}: VersionDiffModalProps) {
    const { theme } = useTheme();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-[90vw] h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Comparing with: {versionName}</DialogTitle>
                </DialogHeader>
                <div className="flex-1">
                    <DiffEditor
                        original={originalContent}
                        modified={modifiedContent}
                        theme={theme === "dark" ? "vs-dark" : "light"}
                        loading={<div className="flex items-center justify-center h-full">Loading Diff...</div>}
                        options={{
                            renderSideBySide: true,
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
