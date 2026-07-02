'use client';

import React from 'react';
import { FileNode } from '@/types/file-system';
import { FileItem } from './FileItem';

interface FileTreeProps {
    nodes: FileNode[];
    level?: number;
    expandedIds: Set<string>;
    activeFileId: string | null;
    renamingId: string | null;
    onToggleExpand: (nodeId: string) => void;
    onSelect: (node: FileNode) => void;
    onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
    onRename: (node: FileNode, newName: string) => void;
    onDelete: (node: FileNode) => void;
    onCancelRename: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
    nodes,
    level = 0,
    expandedIds,
    activeFileId,
    renamingId,
    onToggleExpand,
    onSelect,
    onContextMenu,
    onRename,
    onDelete,
    onCancelRename,
}) => {
    return (
        <div>
            {nodes.map((node) => {
                const isExpanded = expandedIds.has(node.id);
                const isActive = activeFileId === node.id;
                const isRenaming = renamingId === node.id;

                return (
                    <div key={node.id}>
                        <FileItem
                            node={node}
                            level={level}
                            isExpanded={isExpanded}
                            isActive={isActive}
                            onToggle={() => onToggleExpand(node.id)}
                            onSelect={() => onSelect(node)}
                            onContextMenu={(e) => onContextMenu(e, node)}
                            isRenaming={isRenaming}
                            onRename={(newName) => onRename(node, newName)}
                            onDelete={() => onDelete(node)}
                            onCancelRename={onCancelRename}
                        />

                        {/* Recursively render children if expanded */}
                        {node.type === 'folder' && isExpanded && node.children && node.children.length > 0 && (
                            <FileTree
                                nodes={node.children}
                                level={level + 1}
                                expandedIds={expandedIds}
                                activeFileId={activeFileId}
                                renamingId={renamingId}
                                onToggleExpand={onToggleExpand}
                                onSelect={onSelect}
                                onContextMenu={onContextMenu}
                                onRename={onRename}
                                onDelete={onDelete}
                                onCancelRename={onCancelRename}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
