"use client";

import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, AlertCircle } from "lucide-react";
import { ExecutionStatus } from "./ExecutionStatus";
import { OutputDisplay } from "./OutputDisplay";
import { executeCode, checkRateLimit } from "@/actions/execute-actions";
import { toast } from "sonner";

interface ExecutionPanelProps {
    roomId: string;
    code: string;
    language: string;
}

type Status = "idle" | "running" | "success" | "error" | "rate-limited";

export function ExecutionPanel({ roomId, code, language }: ExecutionPanelProps) {
    const [stdin, setStdin] = useState("");
    const [stdout, setStdout] = useState("");
    const [stderr, setStderr] = useState("");
    const [exitCode, setExitCode] = useState(0);
    const [executionTime, setExecutionTime] = useState<number>();
    const [status, setStatus] = useState<Status>("idle");
    const [remaining, setRemaining] = useState<number>(10);
    const [error, setError] = useState<string>();

    const handleExecute = async () => {
        setStatus("running");
        setError(undefined);

        try {
            // Check rate limit first
            const rateLimitCheck = await checkRateLimit(roomId);

            if (!rateLimitCheck.allowed) {
                setStatus("rate-limited");
                setError(rateLimitCheck.error);
                toast.error(rateLimitCheck.error);
                return;
            }

            setRemaining(rateLimitCheck.remaining - 1);

            // Execute code
            const result = await executeCode(roomId, language, code, stdin);

            if (result.error) {
                setStatus("error");
                setError(result.error);
                setStderr(result.stderr);
                setStdout(result.stdout);
                setExitCode(result.exitCode);
                toast.error(result.error);
            } else {
                setStatus(result.exitCode === 0 ? "success" : "error");
                setStdout(result.stdout);
                setStderr(result.stderr);
                setExitCode(result.exitCode);
                setExecutionTime(result.executionTime);

                if (result.exitCode === 0) {
                    toast.success("Code executed successfully");
                } else {
                    toast.error("Code execution failed");
                }
            }
        } catch (err) {
            setStatus("error");
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleClear = () => {
        setStdout("");
        setStderr("");
        setExitCode(0);
        setExecutionTime(undefined);
        setStatus("idle");
        setError(undefined);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="border-b p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium">Execution</h3>
                    <ExecutionStatus status={status} executionTime={executionTime} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {remaining} runs remaining
                    </span>
                    <Button
                        onClick={handleExecute}
                        disabled={status === "running" || !code.trim()}
                        size="sm"
                    >
                        <Play className="h-4 w-4 mr-1" />
                        Run Code
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="m-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <ResizablePanelGroup orientation="vertical" className="flex-1">
                <ResizablePanel defaultSize={30} minSize={20}>
                    <div className="h-full flex flex-col p-3">
                        <Label htmlFor="stdin" className="mb-2">
                            Input (stdin)
                        </Label>
                        <Textarea
                            id="stdin"
                            value={stdin}
                            onChange={(e) => setStdin(e.target.value)}
                            placeholder="Enter input for your program..."
                            className="flex-1 font-mono text-sm resize-none"
                        />
                    </div>
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={70}>
                    <OutputDisplay
                        stdout={stdout}
                        stderr={stderr}
                        exitCode={exitCode}
                        executionTime={executionTime}
                        onClear={handleClear}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
