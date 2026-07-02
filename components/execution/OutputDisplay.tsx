"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface OutputDisplayProps {
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime?: number;
    memoryUsed?: number;
    onClear: () => void;
}

export function OutputDisplay({
    stdout,
    stderr,
    exitCode,
    executionTime,
    memoryUsed,
    onClear,
}: OutputDisplayProps) {
    const hasOutput = stdout || stderr;

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-2 border-b">
                <h3 className="text-sm font-medium">Output</h3>
                <div className="flex items-center gap-2">
                    {hasOutput && (
                        <Button variant="ghost" size="sm" onClick={onClear}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {!hasOutput ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Run code to see output
                </div>
            ) : (
                <Tabs defaultValue="stdout" className="flex-1 flex flex-col">
                    <TabsList className="mx-2 mt-2">
                        <TabsTrigger value="stdout">Output</TabsTrigger>
                        <TabsTrigger value="stderr">Errors</TabsTrigger>
                        <TabsTrigger value="info">Info</TabsTrigger>
                    </TabsList>

                    <TabsContent value="stdout" className="flex-1 m-2 mt-0">
                        <Card className="h-full p-4 overflow-auto">
                            {stdout ? (
                                <div className="space-y-2">
                                    <div className="flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopy(stdout, "Output")}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                                        {stdout}
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-sm">No output</div>
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="stderr" className="flex-1 m-2 mt-0">
                        <Card className="h-full p-4 overflow-auto">
                            {stderr ? (
                                <div className="space-y-2">
                                    <div className="flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopy(stderr, "Errors")}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <pre className="text-sm font-mono text-destructive whitespace-pre-wrap break-words">
                                        {stderr}
                                    </pre>
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-sm">No errors</div>
                            )}
                        </Card>
                    </TabsContent>

                    <TabsContent value="info" className="flex-1 m-2 mt-0">
                        <Card className="h-full p-4">
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Exit Code:</span>
                                    <span className={exitCode === 0 ? "text-green-500" : "text-destructive"}>
                                        {exitCode}
                                    </span>
                                </div>
                                {executionTime !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Execution Time:</span>
                                        <span>{executionTime}ms</span>
                                    </div>
                                )}
                                {memoryUsed !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Memory Used:</span>
                                        <span>{(memoryUsed / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className={exitCode === 0 ? "text-green-500" : "text-destructive"}>
                                        {exitCode === 0 ? "Success" : "Failed"}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
