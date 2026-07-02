"use client";

import { useEffect, useState } from "react";
import { CreateSnippetInput, Snippet } from "@/types/snippet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Editor from "@monaco-editor/react";
import { createSnippet, updateSnippet } from "@/actions/snippet-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SnippetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    snippetToEdit?: Snippet | null;
    onSuccess: () => void;
}

const LANGUAGES = [
    "typescript", "javascript", "python", "html", "css", "json", "sql", "java", "csharp", "cpp", "go", "rust"
];

const CATEGORIES = [
    "Functions", "Classes", "Loops", "Conditionals", "React Components", "API Calls", "Database Queries", "Algorithms", "Data Structures", "Other"
];

export function SnippetDialog({ open, onOpenChange, snippetToEdit, onSuccess }: SnippetDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateSnippetInput>({
        title: "",
        description: "",
        language: "typescript",
        category: "Functions",
        code: "",
        variables: [],
        shortcuts: "",
        is_public: false,
        tags: []
    });

    useEffect(() => {
        if (snippetToEdit) {
            setFormData({
                title: snippetToEdit.title,
                description: snippetToEdit.description || "",
                language: snippetToEdit.language,
                category: snippetToEdit.category || "Functions",
                code: snippetToEdit.code,
                variables: snippetToEdit.variables || [],
                shortcuts: snippetToEdit.shortcuts || "",
                is_public: snippetToEdit.is_public,
                tags: snippetToEdit.tags || []
            });
        } else {
            setFormData({
                title: "",
                description: "",
                language: "typescript",
                category: "Functions",
                code: "// Write your snippet here\n// Use ${1:default} for variables",
                variables: [],
                shortcuts: "",
                is_public: false,
                tags: []
            });
        }
    }, [snippetToEdit, open]);

    const handleSubmit = async () => {
        if (!formData.title || !formData.code) {
            toast.error("Title and Code are required");
            return;
        }

        setLoading(true);
        try {
            if (snippetToEdit) {
                const res = await updateSnippet(snippetToEdit.id, formData);
                if (res.error) throw new Error(res.error);
                toast.success("Snippet updated successfully");
            } else {
                const res = await createSnippet(formData);
                if (res.error) throw new Error(res.error);
                toast.success("Snippet created successfully");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-[#1e1e1e] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>{snippetToEdit ? "Edit Snippet" : "Create New Snippet"}</DialogTitle>
                    <DialogDescription className="text-white/50">
                        Detailed snippets help you and your team code faster.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="e.g., React Functional Component"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="bg-[#1a1a1a] border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Shortcut Trigger</Label>
                            <Input
                                placeholder="e.g., rfc"
                                value={formData.shortcuts || ""}
                                onChange={e => setFormData({ ...formData, shortcuts: e.target.value })}
                                className="bg-[#1a1a1a] border-white/10 font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Language</Label>
                            <Select
                                value={formData.language}
                                onValueChange={val => setFormData({ ...formData, language: val })}
                            >
                                <SelectTrigger className="bg-[#1a1a1a] border-white/10">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    {LANGUAGES.map(lang => (
                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.category || "Other"}
                                onValueChange={val => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger className="bg-[#1a1a1a] border-white/10">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Snippet Code</Label>
                        <div className="h-[300px] border border-white/10 rounded-md overflow-hidden">
                            <Editor
                                height="100%"
                                language={formData.language}
                                value={formData.code}
                                theme="vs-dark"
                                onChange={val => setFormData({ ...formData, code: val || "" })}
                                options={{
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 13,
                                    padding: { top: 10 }
                                }}
                            />
                        </div>
                        <p className="text-[10px] text-white/40">
                            Use {'${1:variable}'} syntax for variables. e.g., {'const ${1:name} = useState(${2:initial})'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="What does this snippet do?"
                            value={formData.description || ""}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="bg-[#1a1a1a] border-white/10 min-h-[80px]"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="public-mode"
                            checked={formData.is_public}
                            onCheckedChange={checked => setFormData({ ...formData, is_public: checked })}
                        />
                        <Label htmlFor="public-mode">Make Public (Share with community)</Label>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t border-white/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {snippetToEdit ? "Update Snippet" : "Create Snippet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
