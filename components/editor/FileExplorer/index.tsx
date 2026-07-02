'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileNode } from '@/types/file-system';
import { buildFileTree, isValidFileName } from '@/lib/file-utils';
import { FileTree } from './FileTree';
import { FileContextMenu } from './FileContextMenu';
import { NewItemDialog, DeleteConfirmDialog } from './FileOperations';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderPlus, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface FileExplorerProps {
    roomId: string;
    currentUserRole?: string;
    onFileSelect?: (file: FileNode) => void;
    activeFileId?: string | null;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
    roomId,
    currentUserRole = 'viewer',
    onFileSelect,
    activeFileId = null,
}) => {
    const [files, setFiles] = useState<FileNode[]>([]);
    const [treeData, setTreeData] = useState<FileNode[]>([]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [searchQuery] = useState('');
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [contextNode, setContextNode] = useState<FileNode | null>(null);
    const [contextParentId, setContextParentId] = useState<string | null>(null);

    // Dialog states
    const [newFileDialog, setNewFileDialog] = useState(false);
    const [newFolderDialog, setNewFolderDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [nodeToDelete, setNodeToDelete] = useState<FileNode | null>(null);

    const supabase = createClient();

    // Load files from Supabase
    const loadFiles = useCallback(async () => {
        const { data, error } = await supabase
            .from('code_sessions')
            .select('*')
            .eq('room_id', roomId)
            .order('name');

        if (error) {
            toast.error('Error loading files', {
                description: error.message,
            });
            return;
        }

        setFiles(data || []);
    }, [roomId, supabase]);

    // Subscribe to real-time updates
    useEffect(() => {
        loadFiles();

        const channel = supabase
            .channel(`code_sessions:room_id=eq.${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'code_sessions',
                    filter: `room_id=eq.${roomId}`,
                },
                () => {
                    loadFiles();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, loadFiles, supabase]);

    // Build tree and apply search filter
    useEffect(() => {
        let filteredFiles = files;

        if (searchQuery) {
            filteredFiles = files.filter((file) =>
                file.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        const tree = buildFileTree(filteredFiles);
        setTreeData(tree);

        // Load expanded state from localStorage
        const savedExpanded = localStorage.getItem(`file-explorer-expanded-${roomId}`);
        if (savedExpanded) {
            setExpandedIds(new Set(JSON.parse(savedExpanded)));
        }
    }, [files, searchQuery, roomId]);

    // Save expanded state to localStorage
    useEffect(() => {
        localStorage.setItem(
            `file-explorer-expanded-${roomId}`,
            JSON.stringify([...expandedIds])
        );
    }, [expandedIds, roomId]);

    // Toggle expand/collapse
    const handleToggleExpand = (nodeId: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    // Create file
    const handleCreateFile = async (name: string) => {
        if (!isValidFileName(name)) {
            toast.error('Invalid file name', {
                description: 'File name can only contain letters, numbers, dots, dashes, and underscores.',
            });
            return;
        }

        const { error } = await supabase.from('code_sessions').insert({
            room_id: roomId,
            name,
            type: 'file',
            parent_id: contextParentId,
            language: name.split('.').pop() || 'plaintext',
            code: '',
        });

        if (error) {
            toast.error('Error creating file', {
                description: error.message,
            });
        } else {
            toast.success('File created', {
                description: `${name} has been created.`,
            });
        }
    };

    // Create folder
    const handleCreateFolder = async (name: string) => {
        if (!isValidFileName(name)) {
            toast.error('Invalid folder name', {
                description: 'Folder name can only contain letters, numbers, dots, dashes, and underscores.',
            });
            return;
        }

        const { error } = await supabase.from('code_sessions').insert({
            room_id: roomId,
            name,
            type: 'folder',
            parent_id: contextParentId,
        });

        if (error) {
            toast.error('Error creating folder', {
                description: error.message,
            });
        } else {
            toast.success('Folder created', {
                description: `${name} has been created.`,
            });
        }
    };

    // Rename file/folder
    const handleRename = async (node: FileNode, newName: string) => {
        if (!isValidFileName(newName)) {
            toast.error('Invalid name', {
                description: 'Name can only contain letters, numbers, dots, dashes, and underscores.',
            });
            setRenamingId(null);
            return;
        }

        const { error } = await supabase
            .from('code_sessions')
            .update({ name: newName })
            .eq('id', node.id);

        if (error) {
            toast.error('Error renaming', {
                description: error.message,
            });
        } else {
            toast.success('Renamed', {
                description: `${node.name} has been renamed to ${newName}.`,
            });
        }

        setRenamingId(null);
    };

    // Delete file/folder
    const handleDelete = async () => {
        if (!nodeToDelete) return;

        const { error } = await supabase
            .from('code_sessions')
            .delete()
            .eq('id', nodeToDelete.id);

        if (error) {
            toast.error('Error deleting', {
                description: error.message,
            });
        } else {
            toast.success('Deleted', {
                description: `${nodeToDelete.name} has been deleted.`,
            });
        }

        setDeleteDialog(false);
        setNodeToDelete(null);
    };

    // Download file
    const handleDownload = (node: FileNode) => {
        if (node.type === 'file' && node.code) {
            const blob = new Blob([node.code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = node.name;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Context menu handlers
    const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
        e.preventDefault();
        e.stopPropagation();
        setContextNode(node);
        setContextParentId(node.type === 'folder' ? node.id : node.parent_id);
    };

    const handleBackgroundContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextNode(null);
        setContextParentId(null);
    };

    return (
        <div className="h-full flex flex-col bg-transparent border-r border-white/5 selection:bg-neon-purple/20">
            {/* Header */}
            <div className="h-[52px] px-6 flex items-center text-[10px] font-black tracking-[0.3em] text-white/20 uppercase select-none border-b border-white/5">
                Explorer
            </div>

            {/* Project Section Header (Collapsible look) */}
            <div className="flex flex-col flex-1 min-h-0">
                <div className="group flex items-center px-4 py-3 cursor-pointer hover:bg-glass-highlight text-white transition-all">
                    <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full mr-3 shadow-[0_0_8px_#06B6D4]"></span>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.15em]">CODESSYNC</span>
                    {(currentUserRole !== 'viewer') && (
                        <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setContextParentId(null);
                                    setNewFileDialog(true);
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                title="New File"
                            >
                                <FilePlus className="h-3.5 w-3.5 text-white/40 hover:text-white" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setContextParentId(null);
                                    setNewFolderDialog(true);
                                }}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                                title="New Folder"
                            >
                                <FolderPlus className="h-3.5 w-3.5 text-white/40 hover:text-white" />
                            </button>
                        </div>
                    )}
                </div>

                {/* File Tree */}
                <ScrollArea className="flex-1">
                    <FileContextMenu
                        node={contextNode}
                        canEdit={currentUserRole !== 'viewer'}
                        onNewFile={() => setNewFileDialog(true)}
                        onNewFolder={() => setNewFolderDialog(true)}
                        onRename={() => contextNode && setRenamingId(contextNode.id)}
                        onDelete={() => {
                            if (contextNode) {
                                setNodeToDelete(contextNode);
                                setDeleteDialog(true);
                            }
                        }}
                        onDownload={() => contextNode && handleDownload(contextNode)}
                    >
                        <div
                            className="min-h-full"
                            onContextMenu={handleBackgroundContextMenu}
                        >
                            {treeData.length === 0 ? (
                                <div className="p-4 text-center text-xs text-[#cccccc]">
                                    No files yet. Right-click or use buttons to create.
                                </div>
                            ) : (
                                <FileTree
                                    nodes={treeData}
                                    expandedIds={expandedIds}
                                    activeFileId={activeFileId}
                                    renamingId={renamingId}
                                    onToggleExpand={handleToggleExpand}
                                    onSelect={(node) => {
                                        if (node.type === 'file' && onFileSelect) {
                                            onFileSelect(node);
                                        }
                                    }}
                                    onContextMenu={handleContextMenu}
                                    onRename={handleRename}
                                    onDelete={(node) => {
                                        setNodeToDelete(node);
                                        setDeleteDialog(true);
                                    }}
                                    onCancelRename={() => setRenamingId(null)}
                                />
                            )}
                        </div>
                    </FileContextMenu>
                </ScrollArea>
            </div>

            {/* Dialogs */}
            <NewItemDialog
                open={newFileDialog}
                type="file"
                onClose={() => setNewFileDialog(false)}
                onCreate={handleCreateFile}
            />

            <NewItemDialog
                open={newFolderDialog}
                type="folder"
                onClose={() => setNewFolderDialog(false)}
                onCreate={handleCreateFolder}
            />

            <DeleteConfirmDialog
                open={deleteDialog}
                node={nodeToDelete}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};
