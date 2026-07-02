"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface AIAssistantContextType {
    messages: Message[];
    isLoading: boolean;
    addMessage: (content: string, context?: string) => Promise<void>;
    clearChat: () => void;
    tokenUsage: number;
    maxTokens: number;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tokenUsage, setTokenUsage] = useState(0);
    const maxTokens = 50000; // Example limit

    const addMessage = async (content: string, context: string = "") => {
        const newMessage: Message = { role: "user", content };
        setMessages((prev) => [...prev, newMessage]);
        setIsLoading(true);

        try {
            const { getAICompletion } = await import("@/app/actions/ai");
            const result = await getAICompletion(content, context);

            if (result.content) {
                setMessages((prev) => [...prev, { role: "assistant", content: result.content }]);
                // Mock token calculation for now
                setTokenUsage((prev) => prev + content.length / 4 + result.content.length / 4);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Chat Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => setMessages([]);

    return (
        <AIAssistantContext.Provider value={{ messages, isLoading, addMessage, clearChat, tokenUsage, maxTokens }}>
            {children}
        </AIAssistantContext.Provider>
    );
}

export const useAIAssistant = () => {
    const context = useContext(AIAssistantContext);
    if (!context) throw new Error("useAIAssistant must be used within AIAssistantProvider");
    return context;
};
