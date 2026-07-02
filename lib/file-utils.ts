import { FileNode } from '@/types/file-system';
import {
    FileCode,
    File as FileIcon,
    Folder,
    FolderOpen,
    Image,
    FileText,
    Braces,
    Cpu,
    Coffee,
    Palette
} from 'lucide-react';

export const getFileIcon = (fileName: string, type: 'file' | 'folder', isOpen?: boolean) => {
    if (type === 'folder') {
        return isOpen ? FolderOpen : Folder;
    }

    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            return FileCode;
        case 'html':
        case 'md':
        case 'txt':
            return FileText;
        case 'css':
        case 'scss':
            return Palette;
        case 'json':
            return Braces; // Using Braces for JSON
        case 'py':
            return FileCode; // Reuse FileCode for Python as requested
        case 'java':
            return Coffee;
        case 'c':
        case 'cpp':
        case 'h':
            return Cpu;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
            return Image;
        default:
            return FileIcon;
    }
};

export const buildFileTree = (nodes: FileNode[]): FileNode[] => {
    const nodeMap = new Map<string, FileNode>();
    const roots: FileNode[] = [];

    // First pass: create nodes with empty children arrays
    nodes.forEach(node => {
        nodeMap.set(node.id, { ...node, children: [] });
    });

    // Second pass: link children to parents
    nodes.forEach(node => {
        const currentNode = nodeMap.get(node.id)!;
        if (node.parent_id && nodeMap.has(node.parent_id)) {
            const parent = nodeMap.get(node.parent_id)!;
            parent.children = parent.children || [];
            parent.children.push(currentNode);
        } else {
            roots.push(currentNode);
        }
    });

    // Sort: Folders first, then alphabetical
    const sortNodes = (nodeList: FileNode[]) => {
        nodeList.sort((a, b) => {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name);
            }
            return a.type === 'folder' ? -1 : 1;
        });
        nodeList.forEach(node => {
            if (node.children && node.children.length > 0) {
                sortNodes(node.children);
            }
        });
    };

    sortNodes(roots);
    return roots;
};

// Validate file name
export const isValidFileName = (name: string): boolean => {
    // Regex to allow alphanumeric, dot, dash, underscore
    // No spaces or special chars usually allowed in code filenames strictly, but VS Code allows spaces.
    // User req: "no special characters except .-_"
    return /^[a-zA-Z0-9 ._-]+$/.test(name);
};
