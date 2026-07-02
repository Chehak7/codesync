"use client";

import { useEffect, useState, useCallback } from "react";
import { getSnippets } from "@/actions/snippet-actions";
import { Snippet } from "@/types/snippet";
import { SnippetCard } from "./SnippetCard";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SnippetListProps {
    currentUserId: string;
    onInsert: (code: string, snippetId: string) => void;
    onEdit: (snippet: Snippet) => void;
    refreshTrigger: number;
}

const LANGUAGES = ["all", "typescript", "javascript", "python", "html", "css", "json", "sql", "java", "csharp", "cpp", "go", "rust"];
const CATEGORIES = ["all", "Functions", "Classes", "Loops", "Conditionals", "React Components", "API Calls", "Database Queries", "Algorithms", "Data Structures", "Other"];

export function SnippetList({ currentUserId, onInsert, onEdit, refreshTrigger }: SnippetListProps) {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [language, setLanguage] = useState("all");
    const [category, setCategory] = useState("all");


    const fetchSnippets = useCallback(async () => {
        setLoading(true);
        const { data } = await getSnippets(search, language, category);
        if (data) {
            setSnippets(data);
        }
        setLoading(false);
    }, [search, language, category]);

    useEffect(() => {
        // Debounce search
        const timeout = setTimeout(fetchSnippets, 300);
        return () => clearTimeout(timeout);
    }, [fetchSnippets, refreshTrigger]);

    const handleDeleteFromList = () => {
        fetchSnippets();
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/40" />
                    <Input
                        placeholder="Search snippets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/30 h-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white h-8 text-xs">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            {LANGUAGES.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang === "all" ? "All Languages" : lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-[#1a1a1a] border-white/10 text-white h-8 text-xs">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
                    </div>
                ) : snippets.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-xs">
                        No snippets found.
                    </div>
                ) : (
                    snippets.map(snippet => (
                        <SnippetCard
                            key={snippet.id}
                            snippet={snippet}
                            currentUserId={currentUserId}
                            onInsert={onInsert}
                            onEdit={onEdit}
                            onDelete={handleDeleteFromList}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
