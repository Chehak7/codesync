"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    Clock, // eslint-disable-line @typescript-eslint/no-unused-vars
    History,
    Plus,
    Search,
    GitCommit,
    RotateCcw,
    Eye,
    Download,
    Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fetchFileVersions, createFileVersion, restoreFileVersion } from "@/actions/version-actions";
import { toast } from "sonner";
import { VersionDiffModal } from "./VersionDiffModal";
import { CommitDialog } from "./CommitDialog";
import { JSZipExport } from "@/lib/utils/zip-utils"; // I'll create this

interface Version {
    id: string;
    code: string;
    message: string;
    created_at: string;
    user_id: string;
    user: {
        id: string;
        display_name?: string;
        avatar_url?: string;
    };
}

interface VersionHistorySidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomId: string;
    activeFileId: string | null;
    currentFileContent: string;
    currentFileName: string;
    allFiles: { id: string, name: string, language: string, code: string }[];
}

export function VersionHistorySidebar({
    open,
    onOpenChange,
    roomId,
    activeFileId,
    currentFileContent,
    currentFileName,
    allFiles
}: VersionHistorySidebarProps) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
    const [isDiffOpen, setIsDiffOpen] = useState(false);
    const [isCommitOpen, setIsCommitOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const loadVersions = useCallback(async () => {
        if (!activeFileId) return;
        setIsLoading(true);
        const result = await fetchFileVersions(activeFileId);
        setIsLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else if (result.data) {
            setVersions(result.data as Version[]);
        }
    }, [activeFileId]);

    useEffect(() => {
        if (open && activeFileId) {
            loadVersions();
        }
    }, [open, activeFileId, loadVersions]);

    const handleCreateVersion = async (message: string) => {
        if (!activeFileId) return;

        // Optimistic update
        const tempId = Math.random().toString();
        const tempVersion = {
            id: tempId,
            code: currentFileContent,
            message: message,
            created_at: new Date().toISOString(),
            user_id: "optimistic",
            user: { id: "optimistic", display_name: "Me" }
        } as Version;
        setVersions(prev => [tempVersion, ...prev]);

        const result = await createFileVersion(roomId, activeFileId, currentFileContent, message);

        if (result.error) {
            toast.error(result.error);
            setVersions(prev => prev.filter(v => v.id !== tempId));
        } else {
            toast.success("Version created");
            loadVersions(); // Refresh to get proper data
        }
    };

    const handleRestore = async (version: Version) => {
        if (!activeFileId) return;

        const confirm = window.confirm("Are you sure? This will overwrite the current file content.");
        if (!confirm) return;

        const result = await restoreFileVersion(roomId, activeFileId, version.id);
        if (result.error || !result.data) {
            toast.error(result.error);
        } else {
            window.dispatchEvent(new CustomEvent("code-editor:replace-content", {
                detail: { code: result.data.code },
            }));
            toast.success("File restored");
            onOpenChange(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await JSZipExport(allFiles, `project-${new Date().getTime()}.zip`);
            toast.success("Project exported as ZIP");
        } catch {
            toast.error("Failed to export project");
        } finally {
            setIsExporting(false);
        }
    };

    const filteredVersions = versions.filter(v =>
        v.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="w-[400px] sm:w-[450px] flex flex-col p-0">
                    <SheetHeader className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Version History
                            </SheetTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                    <Download className="h-3 w-3 mr-1" />
                                )}
                                ZIP
                            </Button>
                        </div>
                        <SheetDescription>
                            Versions for <span className="font-mono text-foreground">{currentFileName}</span>
                        </SheetDescription>
                    </SheetHeader>

                    <div className="p-4 border-b space-y-4">
                        <div className="flex gap-2">
                            <Button className="flex-1 gap-2" onClick={() => setIsCommitOpen(true)}>
                                <Plus className="h-4 w-4" />
                                Commit Changes
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search commits..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <span>Loading history...</span>
                            </div>
                        ) : filteredVersions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <GitCommit className="h-8 w-8 mb-2 opacity-20" />
                                <span>No versions found</span>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-10">
                                {filteredVersions.map((version) => (
                                    <Card key={version.id} className="p-4 transition-colors hover:border-primary/50 relative group">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={version.user?.avatar_url} />
                                                <AvatarFallback>
                                                    {version.user?.display_name?.slice(0, 2).toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-semibold truncate">
                                                        {version.user?.display_name || "Anonymous"}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium mb-3 break-words">
                                                    {version.message || "Manual snapshot"}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px] h-5 py-0">
                                                        {version.id.slice(0, 7)}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[10px] px-2 gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => {
                                                            setSelectedVersion(version);
                                                            setIsDiffOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        View Diff
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[10px] px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleRestore(version)}
                                                    >
                                                        <RotateCcw className="h-3 w-3" />
                                                        Restore
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            <VersionDiffModal
                open={isDiffOpen}
                onOpenChange={setIsDiffOpen}
                originalContent={selectedVersion?.code || ""}
                modifiedContent={currentFileContent}
                versionName={selectedVersion?.message || "Selected Version"}
            />

            <CommitDialog
                open={isCommitOpen}
                onOpenChange={setIsCommitOpen}
                onCommit={handleCreateVersion}
            />
        </>
    );
}
