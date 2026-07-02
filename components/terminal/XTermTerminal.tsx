"use client";

import { useEffect, useRef } from "react";
import { Terminal, ILink } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { useSocket } from "@/components/providers/socket-provider";
import { Button } from "@/components/ui/button";

interface XTermTerminalProps {
    termId: string;
    shell?: string;
    cwd?: string;
    onData?: (data: string) => void;
    theme?: unknown;
    className?: string;
    searchQuery?: string;
}

export const XTermTerminal = ({
    termId,
    shell,
    cwd,
    theme,
    className,
    searchQuery
}: XTermTerminalProps) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const searchAddonRef = useRef<SearchAddon | null>(null);
    const { socket, isConnected } = useSocket();


    useEffect(() => {
        if (!terminalRef.current || !socket || !isConnected) return;

        // Cleanup previous terminal instance if it exists
        if (xtermRef.current) {
            xtermRef.current.dispose();
            xtermRef.current = null;
        }

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
            theme: theme || {
                background: "#050505",
                foreground: "#ffffff",
                cursor: "#06B6D4",
                selectionBackground: "rgba(6, 182, 212, 0.3)",
                black: "#000000",
                red: "#ff5555",
                green: "#50fa7b",
                yellow: "#f1fa8c",
                blue: "#06B6D4",
                magenta: "#ff79c6",
                cyan: "#06B6D4",
                white: "#bfbfbf",
                brightBlack: "#4d4d4d",
                brightRed: "#ff6e67",
                brightGreen: "#5af78e",
                brightYellow: "#f4f99d",
                brightBlue: "#06B6D4",
                brightMagenta: "#ff92d0",
                brightCyan: "#06B6D4",
                brightWhite: "#e6e6e6",
            },
            allowTransparency: true,
        });

        const fitAddon = new FitAddon();
        const searchAddon = new SearchAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(searchAddon);
        term.loadAddon(webLinksAddon);

        // Custom Link Provider
        term.registerLinkProvider({
            provideLinks(bufferLineNumber: number, callback: (links: ILink[] | undefined) => void) {
                const line = term.buffer.active.getLine(bufferLineNumber - 1)?.translateToString(true);
                if (!line) return;

                const fileMatch = line.match(/(?:\/|[A-Z]:\\)[\w\-. / ]+\.\w+(?::\d+)?(?::\d+)?/g);
                if (fileMatch) {
                    const links = fileMatch.map((match: string) => {
                        const start = line.indexOf(match);
                        return {
                            range: {
                                start: { x: start + 1, y: bufferLineNumber },
                                end: { x: start + match.length, y: bufferLineNumber }
                            },
                            text: match,
                            activate: () => {
                                console.log("Opening file path:", match);
                            }
                        };
                    });
                    callback(links);
                } else {
                    callback(undefined);
                }
            }
        });

        const initOrFit = () => {
            if (!terminalRef.current) return;
            if (terminalRef.current.offsetParent && terminalRef.current.offsetHeight > 0 && terminalRef.current.offsetWidth > 0) {
                try {
                    if (!term.element) {
                        term.open(terminalRef.current);
                        fitAddon.fit();
                    } else {
                        fitAddon.fit();
                    }
                } catch (e) {
                    console.debug("Terminal init/fit skipped:", e);
                }
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(initOrFit);
        });

        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
            requestAnimationFrame(initOrFit);
        }

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
        searchAddonRef.current = searchAddon;

        // Spawn/Reattach shell process
        socket.emit("terminal-spawn", { termId, shell, cwd, reattach: true });

        const outputHandler = (data: string) => {
            if (term.element) {
                term.write(data);
            }
        };
        socket.on(`terminal-output-${termId}`, outputHandler);

        term.onData((data: string) => {
            socket.emit("terminal-input", { termId, input: data });
        });

        term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
            socket.emit("terminal-resize", { termId, cols, rows });
        });



        return () => {
            resizeObserver.disconnect();
            socket.off(`terminal-output-${termId}`, outputHandler);
            try {
                term.dispose();
            } catch (e) {
                console.error("Error disposing terminal:", e);
            }
        };
    }, [socket, isConnected, termId, shell, cwd, theme]);

    useEffect(() => {
        if (searchAddonRef.current && searchQuery) {
            searchAddonRef.current.findNext(searchQuery);
        }
    }, [searchQuery]);

    return (
        <div className="relative w-full h-full group">
            <div
                ref={terminalRef}
                className={`w-full h-full overflow-hidden ${className}`}
            />
            {!isConnected && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-4 max-w-[280px] text-center">
                        <div className="relative">
                            <div className="h-12 w-12 border-4 border-white/10 border-t-neon-cyan rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="h-2 w-2 bg-neon-cyan rounded-full animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">Offline</h3>
                            <p className="text-white/40 text-[10px] leading-relaxed font-medium">
                                Terminal protocol requires a persistent secure connection. Standard serverless environments (like Vercel) do not support stateful shell sessions.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-tighter h-8"
                            onClick={() => window.location.reload()}
                        >
                            Reconnect
                        </Button>
                    </div>
                </div>
            )}
            {isConnected && (
                <div className="absolute top-3 right-3 flex items-center gap-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Secure Link</span>
                </div>
            )}
        </div>
    );
};
