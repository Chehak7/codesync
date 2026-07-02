"use client";

import { useState } from "react";
import { VSCodeLayout } from "@/components/layout/VSCodeLayout";
import { FileNode } from "@/types/file-system";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { saveFileContent } from "@/actions/file-actions";
import { UserRole } from "@/actions/permissions-actions";
import { OnboardingTour } from "@/components/onboarding-tour";
import { InviteDialog } from "@/components/permissions/InviteDialog";
import { ImportFilesDialog } from "./ImportFilesDialog";
import { DBFile, File, RoomEditorProps } from "@/types/room";



export function RoomEditor({
    roomId,
    roomName = "Untitled Room",
    initialFiles,
    currentUser,
    initialMessages,
    userRole: initialUserRole,
    roomCode
}: RoomEditorProps) {
    const [files, setFiles] = useState<File[]>(initialFiles.map((f: DBFile) => ({
        id: f.id,
        name: f.name,
        language: f.language,
        code: f.code,
        isDirty: false,
    })));

    const [activeFileId, setActiveFileId] = useState<string | null>(
        files.length > 0 ? files[0].id : null
    );

    const [userRole] = useState<UserRole>(initialUserRole);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Editor settings
    const [fontSize] = useState(
        currentUser.user_metadata?.editor_settings?.fontSize || 14
    );
    const [minimap] = useState(
        currentUser.user_metadata?.editor_settings?.minimap ?? true
    );
    const [lineNumbers] = useState<"on" | "off">(
        currentUser.user_metadata?.editor_settings?.lineNumbers || "on"
    );

    const handleCodeChange = (value: string | undefined) => {
        if (!activeFileId || !value) return;

        setFiles(prev => prev.map(f =>
            f.id === activeFileId ? { ...f, code: value, isDirty: true } : f
        ));

        debouncedSave(activeFileId, value);
    };

    const debouncedSave = useDebouncedCallback(async (fileId: string, content: string) => {
        try {
            const result = await saveFileContent(fileId, content, roomId);
            if (result.error) {
                toast.error(result.error);
            }
        } catch {
            toast.error("An unexpected error occurred during save");
        } finally {
            // Mark as saved
            setFiles(prev => prev.map(f =>
                f.id === fileId ? { ...f, isDirty: false } : f
            ));
        }
    }, 1000);

    const handleFileSelect = (file: FileNode) => {
        setActiveFileId(file.id);

        // Add to open files if not already open
        if (!files.find(f => f.id === file.id)) {
            setFiles(prev => [...prev, {
                id: file.id,
                name: file.name,
                language: file.language || 'plaintext',
                code: file.code || '',
                isDirty: false,
            }]);
        }
    };

    const handleTabClose = (fileId: string) => {
        setFiles(prevFiles => {
            const index = prevFiles.findIndex(f => f.id === fileId);
            const remainingFiles = prevFiles.filter(f => f.id !== fileId);

            if (activeFileId === fileId) {
                if (remainingFiles.length > 0) {
                    // Try to pick the next tab, or the previous one if closing the last tab
                    const nextIndex = Math.min(index, remainingFiles.length - 1);
                    setActiveFileId(remainingFiles[nextIndex].id);
                } else {
                    setActiveFileId(null);
                }
            }

            return remainingFiles;
        });
    };

    const isReadOnly = userRole === "viewer";

    return (
        <>
            <VSCodeLayout
                roomId={roomId}
                roomName={roomName}
                currentUserId={currentUser.id}
                currentUserRole={userRole}
                openFiles={files}
                activeFileId={activeFileId}
                onFileSelect={handleFileSelect}
                onFileChange={handleCodeChange}
                onTabClose={handleTabClose}
                fontSize={fontSize}
                minimap={minimap}
                lineNumbers={lineNumbers}
                readOnly={isReadOnly}
                initialMessages={initialMessages}
            />

            {/* Dialogs */}
            <InviteDialog
                roomId={roomId}
                roomCode={roomCode}
                open={isInviteOpen}
                onOpenChange={setIsInviteOpen}
            />

            <ImportFilesDialog
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                roomId={roomId}
                onImportSuccess={() => {
                    window.location.reload();
                }}
            />

            <OnboardingTour />
        </>
    );
}
// VS Code Layout Integration Complete
