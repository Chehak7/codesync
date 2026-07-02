"use client"

import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
    title: string
    description: string
    icon?: LucideIcon
    action?: {
        label: string
        onClick: () => void
    }
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-black/5 bg-white/40 backdrop-blur-sm p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-black shadow-xl shadow-black/10 transition-transform hover:scale-110">
                {Icon ? (
                    <Icon className="h-10 w-10 text-white" />
                ) : (
                    <svg
                        className="h-10 w-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                    </svg>
                )}
            </div>
            <h3 className="mt-8 text-2xl font-extrabold tracking-tight text-black">{title}</h3>
            <p className="mt-2 mb-8 max-w-sm text-black font-medium opacity-60">
                {description}
            </p>
            {action && (
                <Button onClick={action.onClick} className="h-12 px-8 rounded-2xl bg-black hover:bg-black/90 text-white font-bold transition-all shadow-lg shadow-black/5 hover:scale-105 active:scale-95">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
