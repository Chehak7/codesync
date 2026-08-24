"use client";

import { useEffect, useState, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";
import { InlineSuggestion } from "../ai/InlineSuggestion";

// Loader config if needed (e.g. from CDN)
// Loader.config({ paths: { vs: "..." } }); 

interface CodeEditorProps {
    yText: Y.Text;
    awareness: Awareness;
    language: string;
    theme?: string;
    readOnly?: boolean;
    fontSize?: number;
    minimap?: boolean;
    lineNumbers?: "on" | "off" | "relative" | "interval";
    onMount?: OnMount;
}

export function CodeEditor({
    yText,
    awareness,
    language,
    readOnly = false,
    fontSize = 14,
    minimap = true,
    lineNumbers = "on",
    onMount
}: CodeEditorProps) {
    const [editorTheme, setEditorTheme] = useState("codesync-dark");
    const editorRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const bindingRef = useRef<MonacoBinding | null>(null);
    const [monaco, setMonaco] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [observableContent, setObservableContent] = useState(() => yText.toString());

    const handleEditorWillMount = (monaco: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        monaco.editor.defineTheme('codesync-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'A855F7' },
                { token: 'identifier', foreground: '06B6D4' },
                { token: 'string', foreground: 'EC4899' },
                { token: 'number', foreground: 'FF00FF' },
            ],
            colors: {
                'editor.background': '#050505',
                'editor.lineHighlightBackground': '#FFFFFF08',
                'editorCursor.foreground': '#06B6D4',
                'editor.selectionBackground': '#A855F740',
                'editorLineNumber.foreground': '#FFFFFF20',
                'editorLineNumber.activeForeground': '#A855F7',
                'editor.border': '#00000000',
                'editorOverviewRuler.border': '#00000000',
            }
        });

        // Register Snippet Completion Provider
        // Note: In a real app we might want to fetch these dynamically or pass as props
        // For now we will fetch them once on mount if possible, or we can use a basic set.
        // Since we can't easily use async server actions in this synchronous callback, 
        // we'll rely on a separate effect to update the completions via `monaco.languages.registerCompletionItemProvider`
        // strictly speaking, we should do it outside or manage the disposable.
    };

    // Always use premium dark theme for the editor to match workspace aesthetic
    useEffect(() => {
        setEditorTheme("codesync-dark");
    }, []);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        setMonaco(monaco);
        const model = editor.getModel();
        if (model) {
            bindingRef.current?.destroy();
            bindingRef.current = new MonacoBinding(yText, model, new Set([editor]), awareness);
        }
        if (onMount) {
            onMount(editor, monaco);
        }
    };

    useEffect(() => {
        const updateContent = () => setObservableContent(yText.toString());
        yText.observe(updateContent);
        updateContent();
        return () => yText.unobserve(updateContent);
    }, [yText]);

    useEffect(() => () => {
        bindingRef.current?.destroy();
        bindingRef.current = null;
    }, []);

    useEffect(() => {
        const handleInsertSnippet = (e: Event) => {
            const customEvent = e as CustomEvent<{ code: string }>;
            if (!readOnly && editorRef.current) {
                const contribution = editorRef.current.getContribution("snippetController2");
                if (contribution) {
                    contribution.insert(customEvent.detail.code);
                    editorRef.current.focus();
                }
            }
        };

        const handleReplaceContent = (e: Event) => {
            if (readOnly) return;
            const customEvent = e as CustomEvent<{ code: string }>;
            const editor = editorRef.current;
            const model = editor?.getModel();
            if (!editor || !model || typeof customEvent.detail?.code !== "string") return;
            editor.pushUndoStop();
            editor.executeEdits("version-restore", [{
                range: model.getFullModelRange(),
                text: customEvent.detail.code,
                forceMoveMarkers: true,
            }]);
            editor.pushUndoStop();
            editor.focus();
        };

        window.addEventListener("code-editor:insert-snippet", handleInsertSnippet);
        window.addEventListener("code-editor:replace-content", handleReplaceContent);
        return () => {
            window.removeEventListener("code-editor:insert-snippet", handleInsertSnippet);
            window.removeEventListener("code-editor:replace-content", handleReplaceContent);
        };
    }, [readOnly]);

    // Register Snippet Completions
    useEffect(() => {
        if (!monaco) return;

        let disposable: any; // eslint-disable-line @typescript-eslint/no-explicit-any

        import("@/actions/snippet-actions").then(({ getSnippets }) => {
            getSnippets().then(({ data }) => {
                if (!data) return;

                disposable = monaco.languages.registerCompletionItemProvider(language, {
                    provideCompletionItems: () => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const suggestions = data.map((snippet: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
                            label: snippet.shortcuts || snippet.title,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: snippet.code,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: snippet.description || snippet.title,
                            detail: snippet.title
                        }));
                        return { suggestions };
                    }
                });
            });
        });

        return () => {
            if (disposable) disposable.dispose();
        };
    }, [monaco, language]);

    return (
        <div className="h-full w-full overflow-hidden">
            <output
                className="sr-only"
                aria-hidden="true"
                data-testid="editor-content"
                data-content={observableContent}
            >
                {observableContent}
            </output>
            {!readOnly && editorRef.current && monaco && (
                <InlineSuggestion editor={editorRef.current} monaco={monaco} />
            )}
            <Editor
                height="100%"
                language={language.toLowerCase()} // Monaco languages are lowercase
                defaultValue={yText.toString()}
                theme={editorTheme}
                onMount={handleEditorDidMount}
                beforeMount={handleEditorWillMount}
                options={{
                    readOnly,
                    fontSize,
                    minimap: { enabled: minimap },
                    lineNumbers,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 }
                }}
                loading={<div className="flex h-full items-center justify-center text-muted-foreground">Loading Editor...</div>}
            />
        </div>
    );
}
