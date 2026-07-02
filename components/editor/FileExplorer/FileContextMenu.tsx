'use client';

import React from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { FileNode } from '@/types/file-system';
import { FilePlus, FolderPlus, Edit, Trash2, Download } from 'lucide-react';

interface FileContextMenuProps {
    children: React.ReactNode;
    node: FileNode | null;
    canEdit?: boolean;
    onNewFile: () => void;
    onNewFolder: () => void;
    onRename: () => void;
    onDelete: () => void;
    onDownload: () => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
    children,
    node,
    canEdit = false,
    onNewFile,
    onNewFolder,
    onRename,
    onDelete,
    onDownload,
}) => {
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                <ContextMenuItem onClick={onNewFile}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    New File
                </ContextMenuItem>
                <ContextMenuItem onClick={onNewFolder}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    New Folder
                </ContextMenuItem>
                {node && (
                    <>
                        <ContextMenuSeparator />
                        {canEdit && (
                            <>
                                <ContextMenuItem onClick={onRename}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Rename
                                </ContextMenuItem>
                                <ContextMenuItem onClick={onDelete} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </ContextMenuItem>
                            </>
                        )}
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={onDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
};
