
export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    parent_id: string | null;
    room_id: string;
    language?: string | null;
    children?: FileNode[];
    code?: string; // Content of the file
    is_active?: boolean;
    created_at: string;
    updated_at: string;
}

export interface FileTreeProps {
    data: FileNode[];
    level?: number;
    onSelect: (node: FileNode) => void;
    onExpand: (nodeId: string) => void;
    expandedIds: Set<string>;
    onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
    onRename: (node: FileNode, newName: string) => void;
    onDelete: (node: FileNode) => void;
    onCreateFolder: (parentId: string | null) => void;
    onCreateFile: (parentId: string | null) => void;
    activeFileId: string | null;
}
