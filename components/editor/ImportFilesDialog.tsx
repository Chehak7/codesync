"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, File as FileIcon, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { createFile } from "@/actions/file-actions";

interface ImportFilesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomId: string;
    onImportSuccess: () => void;
}

export function ImportFilesDialog({
    open,
    onOpenChange,
    roomId,
    onImportSuccess
}: ImportFilesDialogProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        const supabase = createClient();
        let successCount = 0;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const filePath = `${roomId}/${Date.now()}-${file.name}`;

                // 1. Upload to Storage (for large files)
                const { error: uploadError } = await supabase.storage
                    .from('project-files')
                    .upload(filePath, file);

                if (uploadError) {
                    toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    continue;
                }

                // 2. Import into code_sessions (reading local content for small files/code)
                const reader = new FileReader();
                const content = await new Promise<string>((resolve) => {
                    reader.onload = (e) => resolve(e.target?.result as string || "");
                    reader.readAsText(file);
                });

                let lang = "javascript";
                if (fileExt === "py") lang = "python";
                else if (fileExt === "java") lang = "java";
                else if (fileExt === "cpp") lang = "cpp";
                else if (fileExt === "html") lang = "html";
                else if (fileExt === "css") lang = "css";
                else if (fileExt === "json") lang = "json";
                else if (fileExt === "sql") lang = "sql";
                else if (fileExt === "ts") lang = "typescript";
                else if (fileExt === "tsx") lang = "typescript";

                const result = await createFile(roomId, file.name, "file", null, lang, content);
                if (result.error) {
                    toast.error(`Failed to create ${file.name} in room: ${result.error}`);
                } else {
                    successCount++;
                }

                setProgress(((i + 1) / files.length) * 100);
            }

            if (successCount > 0) {
                toast.success(`Imported ${successCount} files`);
                onImportSuccess();
                onOpenChange(false);
                setFiles([]);
            }
        } catch {
            toast.error("An unexpected error occurred during import");
        } finally {
            setIsUploading(false);
            setProgress(0);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Files</DialogTitle>
                    <DialogDescription>
                        Upload files from your computer to this room.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div
                        className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Click to select or drag and drop files
                        </p>
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {files.map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                                    <div className="flex items-center gap-2 truncate">
                                        <FileIcon className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Uploading...</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Start Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
