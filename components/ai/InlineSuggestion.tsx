"use client";

import { useEffect } from "react";
import { useAISuggestions } from "@/hooks/use-ai-suggestions";

interface InlineSuggestionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco: any;
}

export function InlineSuggestion({ editor, monaco }: InlineSuggestionProps) {
    const { handleKeyDown, clearSuggestions } = useAISuggestions(editor, monaco);

    useEffect(() => {
        if (!editor || !monaco) return;

        const disposable = editor.onKeyDown(handleKeyDown);
        const mouseDisposable = editor.onMouseDown(clearSuggestions);

        return () => {
            disposable.dispose();
            mouseDisposable.dispose();
            clearSuggestions();
        };
    }, [editor, monaco, handleKeyDown, clearSuggestions]);

    return null;
}
