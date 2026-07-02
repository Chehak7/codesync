'use client';

import React, { useState } from 'react';
import { FileNode } from '@/types/file-system';
import { getFileIcon } from '@/lib/file-utils';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface FileItemProps {
    node: FileNode;
    level: number;
    isExpanded: boolean;
    isActive: boolean;
    onToggle: () => void;
    onSelect: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    isRenaming: boolean;
    onRename: (newName: string) => void;
    onDelete: () => void;
    onCancelRename: () => void;
}

export const FileItem: React.FC<FileItemProps> = ({
    node,
    level,
    isExpanded,
    isActive,
    onToggle,
    onSelect,
    onContextMenu,
    isRenaming,
    onRename,
    onDelete,
    onCancelRename,
}) => {
    const [renamingValue, setRenamingValue] = useState(node.name);
    const Icon = getFileIcon(node.name, node.type, isExpanded);
    const handleRenameSubmit = () => {
        if (renamingValue.trim() && renamingValue !== node.name) {
            onRename(renamingValue.trim());
        } else {
            onCancelRename();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRenameSubmit();
        } else if (e.key === 'Escape') {
            onCancelRename();
        }
    };

    return (
        <div
            className={cn(
                'group flex items-center gap-3 py-2 cursor-pointer hover:bg-glass-highlight transition-all relative rounded-lg mx-2 my-0.5',
                isActive && 'bg-glass-active text-white'
            )}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
            onClick={onSelect}
            onContextMenu={onContextMenu}
        >
            {/* Active Indicator Line */}
            {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-neon-cyan rounded-full shadow-[0_0_8px_#06B6D4]" />
            )}

            {/* Folder Toggle */}
            {node.type === 'folder' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                    className="flex-shrink-0 p-0.5 transition-colors -ml-1 text-white/20 group-hover:text-white/40"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                    )}
                </button>
            )}

            {/* Icon */}
            <div className={cn(
                "flex-shrink-0 transition-transform group-hover:scale-110",
                isActive ? "text-neon-cyan drop-shadow-[0_0_5px_#06B6D4]" : "text-white/30 group-hover:text-white/60"
            )}>
                <Icon className="h-4.5 w-4.5" />
            </div>

            {/* Name */}
            {isRenaming ? (
                <Input
                    value={renamingValue}
                    onChange={(e) => setRenamingValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleRenameSubmit}
                    className="h-6 px-1.5 py-0 text-xs bg-black/40 border border-neon-cyan/30 text-white rounded-lg focus-visible:ring-1 focus-visible:ring-neon-cyan min-w-0"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <>
                    <span className={cn(
                        "text-[13px] font-medium truncate flex-1 tracking-tight",
                        isActive ? "text-white font-bold" : "text-white/40 group-hover:text-white/70 transition-colors"
                    )}>
                        {node.name}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all mr-1"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-red-500/60 hover:text-red-500" />
                    </button>
                </>
            )}
        </div>
    );
};
