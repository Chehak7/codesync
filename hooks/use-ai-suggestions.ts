"use client";

import { useState, useCallback, useRef } from "react";
import { getInlineSuggestion } from "@/app/actions/ai";

export function useAISuggestions(editor: any, monaco: any) {
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const decorationIds = useRef<string[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearSuggestions = useCallback(() => {
        if (editor && decorationIds.current.length > 0) {
            editor.deltaDecorations(decorationIds.current, []);
            decorationIds.current = [];
        }
        setSuggestion(null);
    }, [editor]);

    const applySuggestion = useCallback(async () => {
        if (!editor || !monaco) return;

        const model = editor.getModel();
        const position = editor.getPosition();
        if (!model || !position) return;

        const lineContent = model.getLineContent(position.lineNumber);
        const prefix = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });
        const suffix = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: model.getLineCount(),
            endColumn: model.getLineMaxColumn(model.getLineCount())
        });

        const result = await getInlineSuggestion(prefix, suffix, model.getLanguageId());

        if (result.suggestion && result.suggestion.trim()) {
            setSuggestion(result.suggestion);

            const newDecorations = [
                {
                    range: new monaco.Range(
                        position.lineNumber,
                        position.column,
                        position.lineNumber,
                        position.column
                    ),
                    options: {
                        after: {
                            content: result.suggestion,
                            inlineClassName: "ghost-text",
                        },
                        showIfCollapsed: true
                    }
                }
            ];
            decorationIds.current = editor.deltaDecorations(decorationIds.current, newDecorations);
        }
    }, [editor, monaco]);

    const handleKeyDown = useCallback((e: any) => {
        if (e.keyCode === monaco.KeyCode.Tab && suggestion) {
            e.preventDefault();
            e.stopPropagation();

            const position = editor.getPosition();
            editor.executeEdits("ai-suggestion", [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: suggestion,
                forceMoveMarkers: true
            }]);

            clearSuggestions();
        } else if (e.keyCode !== monaco.KeyCode.Tab) {
            clearSuggestions();

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(applySuggestion, 500);
        }
    }, [editor, monaco, suggestion, applySuggestion, clearSuggestions]);

    return { handleKeyDown, clearSuggestions };
}
