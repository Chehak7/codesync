"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    LayoutDashboard,
    LogOut,
    Moon,
    Settings,
    Sun,
    User,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { signOut } from "@/app/actions/auth"

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { setTheme } = useTheme()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false)
        command()
    }, [])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="General">
                    <CommandItem onSelect={() => runCommand(() => router.push("/rooms"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/profile"))}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Theme">
                    <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light Mode</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark Mode</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Account">
                    <form action={signOut}>
                        <CommandItem onSelect={() => runCommand(() => (document.activeElement as HTMLElement)?.closest("form")?.submit())}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </CommandItem>
                    </form>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
