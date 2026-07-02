"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const shortcuts = [
    {
        group: "General", actions: [
            { name: "Open Command Palette", keys: ["⌘", "K"] },
            { name: "Toggle Theme", keys: ["⌘", "T"] },
            { name: "Search actions", keys: ["⌘", "K"] },
        ]
    },
    {
        group: "Editor", actions: [
            { name: "Save File", keys: ["⌘", "S"] },
            { name: "Format Code", keys: ["⌥", "⇧", "F"] },
            { name: "Find", keys: ["⌘", "F"] },
            { name: "Replace", keys: ["⌥", "⌘", "F"] },
        ]
    },
    {
        group: "Navigation", actions: [
            { name: "Go to Dashboard", keys: ["G", "D"] },
            { name: "Go to Profile", keys: ["G", "P"] },
            { name: "Go to Settings", keys: ["G", "S"] },
        ]
    }
]

export function ShortcutsModal() {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Keyboard Shortcuts</DialogTitle>
                    <DialogDescription>
                        Master CodeSync with these keyboard shortcuts.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {shortcuts.map((group) => (
                        <div key={group.group} className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {group.group}
                            </h4>
                            <div className="grid gap-2">
                                {group.actions.map((action) => (
                                    <div key={action.name} className="flex items-center justify-between text-sm">
                                        <span>{action.name}</span>
                                        <div className="flex gap-1">
                                            {action.keys.map((key) => (
                                                <kbd key={key} className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
