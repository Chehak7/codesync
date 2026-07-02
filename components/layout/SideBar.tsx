'use client';

import React from 'react';
import { FileExplorer } from '@/components/editor/FileExplorer/index';
import { FileNode } from '@/types/file-system';
import { ActivityBarView } from './ActivityBar';
import { MembersPanel } from '@/components/permissions/MembersPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { AIChatView } from '@/components/ai/AIChatView';
import { VersionHistorySidebar } from '@/components/editor/VersionHistorySidebar';
import { Search, Settings as SettingsIcon } from 'lucide-react';
import { UserRole } from '@/actions/permissions-actions';

interface SideBarProps {
    activeView: ActivityBarView;
    roomId: string;
    currentUserId: string;
    currentUserRole: UserRole | null;
    activeFileId: string | null;
    onFileSelect?: (file: FileNode) => void;
    activeFileContent?: string;
    activeFileName?: string;
    allFiles?: Array<{ id: string; name: string; language: string; code: string; isDirty?: boolean }>;
    initialMessages?: import('@/types/room').Message[];
    onClose?: () => void;
}

export const SideBar: React.FC<SideBarProps> = ({
    activeView,
    roomId,
    currentUserId,
    currentUserRole,
    activeFileId,
    onFileSelect,
    activeFileContent = '',
    activeFileName = '',
    allFiles = [],
    initialMessages = [],
    onClose = () => { },
}) => {
    const renderContent = () => {
        const handleClose = (open: boolean) => {
            if (!open) onClose();
        };

        switch (activeView) {
            case 'explorer':
                return (
                    <FileExplorer
                        roomId={roomId}
                        onFileSelect={onFileSelect}
                        activeFileId={activeFileId}
                        currentUserRole={currentUserRole || 'viewer'}
                    />
                );

            case 'search':
                return (
                    <div className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Search className="h-4 w-4" />
                            <span>Search functionality coming soon</span>
                        </div>
                    </div>
                );

            case 'source-control':
                return (
                    <VersionHistorySidebar
                        open={true}
                        onOpenChange={handleClose}
                        roomId={roomId}
                        activeFileId={activeFileId}
                        currentFileContent={activeFileContent}
                        currentFileName={activeFileName}
                        allFiles={allFiles}
                    />
                );

            case 'members':
                return currentUserRole ? (
                    <MembersPanel
                        roomId={roomId}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        open={true}
                    />
                ) : null;

            case 'chat':
                return (
                    <ChatPanel
                        roomId={roomId}
                        currentUserId={currentUserId}
                        initialMessages={initialMessages}
                    />
                );

            case 'ai':
                return <AIChatView />;

            case 'settings':
                return (
                    <div className="p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <SettingsIcon className="h-4 w-4" />
                            <span>Settings panel coming soon</span>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="w-[320px] bg-black/80 backdrop-blur-md border-r border-glass-border overflow-hidden flex flex-col relative z-20 shadow-glass">
            {renderContent()}
        </div>
    );
};
