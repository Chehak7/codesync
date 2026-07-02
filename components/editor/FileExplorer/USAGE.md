// Example: How to integrate the new FileExplorer into RoomEditor.tsx

import { FileExplorer } from './FileExplorer';
import { FileNode } from '@/types/file-system';

// In your RoomEditor component:

export function RoomEditor({ roomId, currentUser }: RoomEditorProps) {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');

  const handleFileSelect = (file: FileNode) => {
    setActiveFileId(file.id);
    setActiveFileContent(file.code || '');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1>CodeSync</h1>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* File Explorer Panel */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
          <FileExplorer
            roomId={roomId}
            onFileSelect={handleFileSelect}
            activeFileId={activeFileId}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Editor Panel */}
        <ResizablePanel defaultSize={80}>
          <CodeEditor
            code={activeFileContent}
            onChange={(value) => setActiveFileContent(value || '')}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// The FileExplorer component handles:
// - Loading files from Supabase
// - Real-time updates via Supabase Realtime
// - File/folder CRUD operations
// - Context menu
// - Search functionality
// - Expand/collapse state persistence
