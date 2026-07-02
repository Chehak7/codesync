'use client';

import React, { useState, useEffect } from 'react';
import { ActivityBar, ActivityBarView } from './ActivityBar';
import { SideBar } from './SideBar';
import { EditorArea } from './EditorArea';
import { Panel } from './Panel';
import { TitleBar } from './TitleBar';
import { AlertCircle, Settings } from 'lucide-react';
import { FileNode } from '@/types/file-system';
import { UserRole } from '@/actions/permissions-actions';
import { Message } from '@/types/room';
import { AIAssistantProvider } from '../ai/AIAssistant';
import { AIChatPanel } from '../ai/AIChatPanel';
import { SnippetPanel } from '../snippets/SnippetPanel';

interface VSCodeLayoutProps {
    roomId: string;
    roomName: string;
    currentUserId: string;
    currentUserRole: UserRole | null;

    // Editor state
    openFiles: Array<{
        id: string;
        name: string;
        language: string;
        code: string;
        isDirty?: boolean;
    }>;
    activeFileId: string | null;
    onFileSelect: (file: FileNode) => void;
    onFileChange: (value: string | undefined) => void;
    onTabClose: (fileId: string) => void;

    // Editor settings
    fontSize?: number;
    minimap?: boolean;
    lineNumbers?: 'on' | 'off';
    readOnly?: boolean;

    // Chat/Messages
    initialMessages?: Message[];
}

export const VSCodeLayout: React.FC<VSCodeLayoutProps> = ({
    roomId,
    roomName,
    currentUserId,
    currentUserRole,
    openFiles,
    activeFileId,
    onFileSelect,
    onFileChange,
    onTabClose,
    fontSize = 14,
    minimap = true,
    lineNumbers = 'on',
    readOnly = false,
    initialMessages = [],
}) => {
    const [activeView, setActiveView] = useState<ActivityBarView>('explorer');
    const [isPanelOpen, setIsPanelOpen] = useState(true); // Default to open for visibility
    const [panelHeight, setPanelHeight] = useState(200);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [isSnippetPanelOpen, setIsSnippetPanelOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                setIsPanelOpen(prev => !prev);
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                setIsSnippetPanelOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const activeFile = openFiles.find((f) => f.id === activeFileId);
    const breadcrumbs = activeFile ? [activeFile.name] : [];

    return (
        <AIAssistantProvider>
            <div className="h-screen w-screen bg-vscode-bg overflow-hidden flex flex-col font-sans text-vscode-text selection:bg-[#264f78] relative">
                {/* Title Bar */}
                <TitleBar
                    roomName={roomName}
                    breadcrumbs={breadcrumbs}
                />

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Activity Bar */}
                    <ActivityBar
                        activeView={activeView}
                        onViewChange={(view) => {
                            if (view === 'snippets') {
                                setIsSnippetPanelOpen(true);
                            } else {
                                setActiveView(view);
                            }
                        }}
                    />

                    {/* Side Bar */}
                    <SideBar
                        key={activeView}
                        activeView={activeView}
                        roomId={roomId}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        activeFileId={activeFileId}
                        onFileSelect={onFileSelect}
                        activeFileContent={activeFile?.code}
                        activeFileName={activeFile?.name}
                        allFiles={openFiles}
                        initialMessages={initialMessages}
                        onClose={() => setActiveView('explorer')}
                    />

                    {/* Editor Area + Panel */}
                    <div className="flex-1 flex flex-col min-w-0 bg-vscode-bg">
                        <EditorArea
                            tabs={openFiles.map((f) => ({
                                id: f.id,
                                name: f.name,
                                language: f.language,
                                isDirty: f.isDirty,
                            }))}
                            activeTabId={activeFileId}
                            onTabChange={(id) => {
                                const file = openFiles.find((f) => f.id === id);
                                if (file) {
                                    onFileSelect(file as unknown as FileNode);
                                }
                            }}
                            onTabClose={onTabClose}
                            code={activeFile?.code || ''}
                            language={activeFile?.language || 'plaintext'}
                            onChange={onFileChange}
                            readOnly={readOnly}
                            fontSize={fontSize}
                            minimap={minimap}
                            lineNumbers={lineNumbers}
                        />

                        {/* Panel */}
                        <Panel
                            isOpen={isPanelOpen}
                            onToggle={() => setIsPanelOpen(!isPanelOpen)}
                            height={panelHeight}
                            onHeightChange={setPanelHeight}
                        />
                    </div>
                </div>

                <div className="h-[28px] bg-glass-surface backdrop-blur-3xl border-t border-glass-border text-white/40 flex items-center px-6 text-[10px] font-black uppercase tracking-[0.2em] select-none relative z-50">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2 hover:text-neon-cyan transition-all cursor-pointer">
                            <span className="w-2 h-2 bg-neon-cyan rounded-full shadow-[0_0_8px_#06B6D4]"></span>
                            main*
                        </span>
                        <span className="flex items-center gap-4 opacity-50">
                            <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3 text-neon-pink" /> 0</span>
                            <span className="flex items-center gap-1.5"><Settings className="w-3 h-3 text-neon-cyan" /> 0</span>
                        </span>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-8">
                        <span className="hover:text-neon-cyan transition-all cursor-pointer">Ln 1, Col 1</span>
                        <span className="hover:text-neon-cyan transition-all cursor-pointer">UTF-8</span>
                        <span className="text-neon-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] font-bold">{activeFile?.language || 'Plain Text'}</span>
                    </div>
                </div>
            </div>

            {/* AI Components - Moved outside main container for layering safety */}
            <AIChatPanel open={isAIPanelOpen} onOpenChange={setIsAIPanelOpen} />
            <SnippetPanel
                open={isSnippetPanelOpen}
                onOpenChange={setIsSnippetPanelOpen}
                currentUserId={currentUserId}
                onInsert={(code) => {
                    // Dispatch custom event for editor
                    window.dispatchEvent(new CustomEvent('code-editor:insert-snippet', {
                        detail: { code }
                    }));
                    setIsSnippetPanelOpen(false);
                }}
            />
        </AIAssistantProvider>
    );
};
