"use client";

import { useEffect, useMemo, useState } from "react";
import { VSCodeLayout } from "@/components/layout/VSCodeLayout";
import { FileNode } from "@/types/file-system";
import { UserRole } from "@/actions/permissions-actions";
import { OnboardingTour } from "@/components/onboarding-tour";
import { InviteDialog } from "@/components/permissions/InviteDialog";
import { ImportFilesDialog } from "./ImportFilesDialog";
import { DBFile, File, RoomEditorProps } from "@/types/room";
import { useRoomCollaboration } from "@/hooks/use-room-collaboration";



export function RoomEditor({
    roomId,
    roomName = "Untitled Room",
    initialFiles,
    currentUser,
    initialMessages,
    userRole: initialUserRole,
    roomCode
}: RoomEditorProps) {
    const [files, setFiles] = useState<File[]>(initialFiles.filter((f) => f.type !== "folder").map((f: DBFile) => ({
        id: f.id,
        name: f.name,
        language: f.language || "plaintext",
        code: f.code,
        isDirty: false,
    })));

    const [activeFileId, setActiveFileId] = useState<string | null>(
        files.length > 0 ? files[0].id : null
    );

    const [userRole] = useState<UserRole>(initialUserRole);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const isReadOnly = userRole === "viewer";
    const displayName =
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        "Collaborator";

    const collaboration = useRoomCollaboration({
        roomId,
        userId: currentUser.id,
        displayName,
        activeFileId,
        canWrite: !isReadOnly,
    });

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

    const openFileIds = useMemo(() => files.map((file) => file.id).join(","), [files]);

    useEffect(() => {
        const ids = openFileIds.split(",").filter(Boolean);
        const observers = ids.map((id) => {
            const text = collaboration.getText(id);
            const updateFile = () => {
                const code = text.toString();
                setFiles((current) => current.map((file) =>
                    file.id === id && file.code !== code ? { ...file, code } : file
                ));
            };
            text.observe(updateFile);
            updateFile();
            return { text, updateFile };
        });
        return () => {
            for (const { text, updateFile } of observers) text.unobserve(updateFile);
        };
    }, [collaboration.getText, openFileIds]);

    const handleFileSelect = (file: FileNode) => {
        if (file.type === "folder") return;
        setActiveFileId(file.id);
        collaboration.requestFile(file.id);

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

    const visibleFiles = files.map((file) => ({
        ...file,
        isDirty: collaboration.hasUnsavedChanges,
    }));

    return (
        <>
            <VSCodeLayout
                roomId={roomId}
                roomName={roomName}
                currentUserId={currentUser.id}
                currentUserRole={userRole}
                openFiles={visibleFiles}
                activeFileId={activeFileId}
                activeText={collaboration.activeText}
                awareness={collaboration.awareness}
                onFileSelect={handleFileSelect}
                onTabClose={handleTabClose}
                collaborationState={collaboration.state}
                collaborationError={collaboration.error}
                participants={collaboration.participants}
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
