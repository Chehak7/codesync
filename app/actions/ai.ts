"use server";

import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

const anthropic = apiKey ? new Anthropic({
    apiKey: apiKey,
}) : null;

export async function getAICompletion(prompt: string, context: string = "") {
    try {
        if (!anthropic) {
            return { error: "Anthropic API key is missing. Please configure it in .env.local" };
        }
        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: `Context:\n${context}\n\nTask: ${prompt}`,
                },
            ],
        });

        const contentBlock = response.content[0];
        if (contentBlock.type === 'text') {
            return { content: contentBlock.text };
        }
        return { error: "Unexpected response format" };
    } catch (error: unknown) {
        console.error("AI Assistant Error:", error);
        return { error: error instanceof Error ? error.message : "Failed to get AI completion" };
    }
}

export async function getInlineSuggestion(prefix: string, suffix: string, language: string) {
    try {
        const prompt = `You are an expert ${language} developer. Complete the code between the FOLLOWING prefix and suffix. 
    PREFIX:
    ${prefix}
    
    SUFFIX:
    ${suffix}
    
    Respond ONLY with the code to be inserted at the cursor position. No explanations, no markdown blocks.`;

        if (!anthropic) {
            return { error: "Anthropic API key is missing" };
        }

        const response = await anthropic.messages.create({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 256,
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
        });

        const contentBlock = response.content[0];
        if (contentBlock.type === 'text') {
            return { suggestion: contentBlock.text };
        }
        return { error: "Unexpected response format" };
    } catch (error: unknown) {
        console.error("AI Suggestion Error:", error);
        return { error: "Failed to fetch suggestion" };
    }
}
