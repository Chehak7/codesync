"use server";

import { createClient } from "@/lib/supabase/server";
import { checkPermission } from "./permissions-actions";

const PISTON_API = "https://emkc.org/api/v2/piston";
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_EXECUTIONS_PER_HOUR = 10;

// Language version mapping for Piston API
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
    javascript: { language: "javascript", version: "18.15.0" },
    typescript: { language: "typescript", version: "5.0.3" },
    python: { language: "python", version: "3.10.0" },
    java: { language: "java", version: "15.0.2" },
    cpp: { language: "c++", version: "10.2.0" },
    c: { language: "c", version: "10.2.0" },
    go: { language: "go", version: "1.16.2" },
    rust: { language: "rust", version: "1.68.2" },
    php: { language: "php", version: "8.2.3" },
    ruby: { language: "ruby", version: "3.0.1" },
    swift: { language: "swift", version: "5.3.3" },
    kotlin: { language: "kotlin", version: "1.8.20" },
    csharp: { language: "csharp", version: "6.12.0" },
};

interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime?: number;
    memoryUsed?: number;
    error?: string;
}

export async function checkRateLimit(roomId: string): Promise<{ allowed: boolean; remaining: number; error?: string }> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { allowed: false, remaining: 0, error: "Unauthorized" };
    }

    // Check permission
    const hasPermission = await checkPermission(roomId, "editor");
    if (!hasPermission) {
        return { allowed: false, remaining: 0, error: "You don't have permission to execute code" };
    }

    // Count executions in the last hour
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString();

    const { data, error } = await supabase
        .from("execution_rate_limits")
        .select("id")
        .eq("user_id", user.id)
        .gte("executed_at", oneHourAgo);

    if (error) {
        return { allowed: false, remaining: 0, error: error.message };
    }

    const executionCount = data?.length || 0;
    const remaining = Math.max(0, MAX_EXECUTIONS_PER_HOUR - executionCount);

    if (executionCount >= MAX_EXECUTIONS_PER_HOUR) {
        return {
            allowed: false,
            remaining: 0,
            error: `Rate limit exceeded. You can execute ${MAX_EXECUTIONS_PER_HOUR} times per hour. Try again later.`
        };
    }

    return { allowed: true, remaining };
}

export async function executeCode(
    roomId: string,
    language: string,
    code: string,
    stdin?: string
): Promise<ExecutionResult> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { stdout: "", stderr: "", exitCode: 1, error: "Unauthorized" };
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(roomId);
    if (!rateLimitCheck.allowed) {
        return {
            stdout: "",
            stderr: rateLimitCheck.error || "Rate limit exceeded",
            exitCode: 1,
            error: rateLimitCheck.error
        };
    }

    // Get language configuration
    const langConfig = LANGUAGE_MAP[language.toLowerCase()];
    if (!langConfig) {
        return {
            stdout: "",
            stderr: `Language '${language}' is not supported for execution`,
            exitCode: 1,
            error: "Unsupported language"
        };
    }

    try {
        // Record rate limit
        await supabase
            .from("execution_rate_limits")
            .insert({ user_id: user.id });

        // Execute code via Piston API
        const startTime = Date.now();
        const response = await fetch(`${PISTON_API}/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language: langConfig.language,
                version: langConfig.version,
                files: [
                    {
                        name: `main.${getFileExtension(language)}`,
                        content: code,
                    },
                ],
                stdin: stdin || "",
                args: [],
                compile_timeout: 10000,
                run_timeout: 3000,
                compile_memory_limit: -1,
                run_memory_limit: -1,
            }),
        });

        const executionTime = Date.now() - startTime;

        if (!response.ok) {
            throw new Error(`Piston API error: ${response.statusText}`);
        }

        const result = await response.json();

        const executionResult: ExecutionResult = {
            stdout: result.run?.stdout || "",
            stderr: result.run?.stderr || result.compile?.stderr || "",
            exitCode: result.run?.code || 0,
            executionTime,
        };

        // Save to execution history
        await supabase
            .from("execution_history")
            .insert({
                user_id: user.id,
                room_id: roomId,
                language,
                code,
                stdin: stdin || null,
                stdout: executionResult.stdout,
                stderr: executionResult.stderr,
                exit_code: executionResult.exitCode,
                execution_time: executionTime,
            });

        return executionResult;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            stdout: "",
            stderr: `Execution failed: ${errorMessage}`,
            exitCode: 1,
            error: errorMessage,
        };
    }
}

export async function getExecutionHistory(roomId: string, limit: number = 10) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data, error } = await supabase
        .from("execution_history")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        return { error: error.message };
    }

    return { data };
}

function getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
        javascript: "js",
        typescript: "ts",
        python: "py",
        java: "java",
        cpp: "cpp",
        c: "c",
        go: "go",
        rust: "rs",
        php: "php",
        ruby: "rb",
        swift: "swift",
        kotlin: "kt",
        csharp: "cs",
    };
    return extensions[language.toLowerCase()] || "txt";
}
