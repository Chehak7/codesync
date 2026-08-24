"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const COMPLETION_MODEL = "claude-sonnet-4-6";
const SUGGESTION_MODEL = "claude-haiku-4-5-20251001";
const REQUEST_TIMEOUT_MS = 30_000;

const MAX_PROMPT_CHARS = 8_000;
const MAX_CONTEXT_CHARS = 32_000;
const MAX_PREFIX_CHARS = 24_000;
const MAX_SUFFIX_CHARS = 12_000;
const MAX_LANGUAGE_CHARS = 64;

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

type AIAction = "completion" | "inline_suggestion";
type AIResult = { error?: string };
type CompletionResult = AIResult & { content?: string };
type SuggestionResult = AIResult & { suggestion?: string };

function isStringWithinLimit(value: unknown, maximum: number, allowEmpty = true): value is string {
    return typeof value === "string"
        && value.length <= maximum
        && (allowEmpty || value.trim().length > 0);
}

function logSafeMetadata(
    action: AIAction,
    status: "success" | "rejected" | "error",
    metadata: Record<string, string | number | boolean | null>,
) {
    console.info("AI action", { action, status, ...metadata });
}

function errorName(error: unknown) {
    return error instanceof Error ? error.name : "UnknownError";
}

async function authenticate(action: AIAction) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        logSafeMetadata(action, "rejected", { reason: "unauthenticated", inputChars: 0 });
        return { error: "Authentication required" } as const;
    }

    return { supabase } as const;
}

async function reserveUsage(
    supabase: Awaited<ReturnType<typeof createClient>>,
    action: AIAction,
    inputChars: number,
) {
    const { data, error } = await supabase.rpc("reserve_ai_usage", {
        p_action: action,
        p_input_chars: inputChars,
    });

    if (error) {
        logSafeMetadata(action, "error", {
            reason: "budget_check_failed",
            inputChars,
            errorType: error.code ?? "DatabaseError",
        });
        return { error: "AI service is temporarily unavailable" } as const;
    }

    const reservation = Array.isArray(data) ? data[0] : data;
    if (!reservation?.allowed) {
        logSafeMetadata(action, "rejected", {
            reason: reservation?.reason ?? "usage_limit",
            inputChars,
        });
        return { error: "AI usage limit reached. Try again later" } as const;
    }

    return { allowed: true } as const;
}

export async function getAICompletion(prompt: string, context: string = ""): Promise<CompletionResult> {
    const action: AIAction = "completion";
    const authentication = await authenticate(action);
    if ("error" in authentication) {
        return { error: authentication.error };
    }

    if (!isStringWithinLimit(prompt, MAX_PROMPT_CHARS, false)) {
        logSafeMetadata(action, "rejected", { reason: "invalid_prompt", inputChars: 0 });
        return { error: `Prompt must contain 1-${MAX_PROMPT_CHARS} characters` };
    }
    if (!isStringWithinLimit(context, MAX_CONTEXT_CHARS)) {
        logSafeMetadata(action, "rejected", { reason: "invalid_context", inputChars: prompt.length });
        return { error: `Context cannot exceed ${MAX_CONTEXT_CHARS} characters` };
    }
    if (!anthropic) {
        logSafeMetadata(action, "error", { reason: "service_not_configured", inputChars: prompt.length + context.length });
        return { error: "AI service is unavailable" };
    }

    const inputChars = prompt.length + context.length;
    const authorization = await reserveUsage(authentication.supabase, action, inputChars);
    if ("error" in authorization) {
        return { error: authorization.error };
    }

    const startedAt = Date.now();
    try {
        const response = await anthropic.messages.create({
            model: COMPLETION_MODEL,
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: `Context:\n${context}\n\nTask: ${prompt}`,
                },
            ],
        }, { timeout: REQUEST_TIMEOUT_MS });

        const contentBlock = response.content[0];
        if (contentBlock?.type === "text") {
            logSafeMetadata(action, "success", {
                model: COMPLETION_MODEL,
                inputChars,
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                durationMs: Date.now() - startedAt,
            });
            return { content: contentBlock.text };
        }

        logSafeMetadata(action, "error", {
            reason: "unexpected_response",
            model: COMPLETION_MODEL,
            inputChars,
            durationMs: Date.now() - startedAt,
        });
        return { error: "Unexpected response format" };
    } catch (error: unknown) {
        logSafeMetadata(action, "error", {
            model: COMPLETION_MODEL,
            inputChars,
            durationMs: Date.now() - startedAt,
            errorType: errorName(error),
        });
        return { error: "Failed to get AI completion" };
    }
}

export async function getInlineSuggestion(prefix: string, suffix: string, language: string): Promise<SuggestionResult> {
    const action: AIAction = "inline_suggestion";
    const authentication = await authenticate(action);
    if ("error" in authentication) {
        return { error: authentication.error };
    }

    if (!isStringWithinLimit(prefix, MAX_PREFIX_CHARS)) {
        logSafeMetadata(action, "rejected", { reason: "invalid_prefix", inputChars: 0 });
        return { error: `Prefix cannot exceed ${MAX_PREFIX_CHARS} characters` };
    }
    if (!isStringWithinLimit(suffix, MAX_SUFFIX_CHARS)) {
        logSafeMetadata(action, "rejected", { reason: "invalid_suffix", inputChars: prefix.length });
        return { error: `Suffix cannot exceed ${MAX_SUFFIX_CHARS} characters` };
    }
    if (
        !isStringWithinLimit(language, MAX_LANGUAGE_CHARS, false)
        || !/^[A-Za-z0-9_+#. -]+$/.test(language)
    ) {
        logSafeMetadata(action, "rejected", { reason: "invalid_language", inputChars: prefix.length + suffix.length });
        return { error: "Language is invalid" };
    }
    if (!anthropic) {
        logSafeMetadata(action, "error", { reason: "service_not_configured", inputChars: prefix.length + suffix.length });
        return { error: "AI service is unavailable" };
    }

    const inputChars = prefix.length + suffix.length + language.length;
    const authorization = await reserveUsage(authentication.supabase, action, inputChars);
    if ("error" in authorization) {
        return { error: authorization.error };
    }

    const startedAt = Date.now();
    try {
        const response = await anthropic.messages.create({
            model: SUGGESTION_MODEL,
            max_tokens: 256,
            messages: [{
                role: "user",
                content: `You are an expert ${language} developer. Complete the code between the following prefix and suffix.\nPREFIX:\n${prefix}\n\nSUFFIX:\n${suffix}\n\nRespond only with the code to insert.`,
            }],
            temperature: 0,
        }, { timeout: REQUEST_TIMEOUT_MS });

        const contentBlock = response.content[0];
        if (contentBlock?.type === "text") {
            logSafeMetadata(action, "success", {
                model: SUGGESTION_MODEL,
                inputChars,
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                durationMs: Date.now() - startedAt,
            });
            return { suggestion: contentBlock.text };
        }

        logSafeMetadata(action, "error", {
            reason: "unexpected_response",
            model: SUGGESTION_MODEL,
            inputChars,
            durationMs: Date.now() - startedAt,
        });
        return { error: "Unexpected response format" };
    } catch (error: unknown) {
        logSafeMetadata(action, "error", {
            model: SUGGESTION_MODEL,
            inputChars,
            durationMs: Date.now() - startedAt,
            errorType: errorName(error),
        });
        return { error: "Failed to fetch suggestion" };
    }
}
