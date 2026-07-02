"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoom } from "@/actions/room-actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateRoomDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);

        // Server action
        const result = await createRoom(formData); // This might redirect

        // If it didn't redirect (e.g. error)
        // Note: redirect throws an error in Next.js Server Actions, so this might not be reached if success
        // But if we handle errors, we should check result.
        // However, createRoom uses redirect() on success.

        // We can wrap in try/catch if we want to catch the redirect? 
        // No, Next.js handles the redirect exception.
        // If it returns an object with error, it failed.

        setLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            setOpen(false);
            // Redirect happens
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl bg-white hover:bg-white/90 text-black font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5">
                    Create Room
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-white/5 shadow-2xl p-12 bg-[#0B0B0B] text-white">
                <DialogHeader className="mb-8">
                    <DialogTitle className="text-4xl font-black tracking-tighter text-white">Create Room</DialogTitle>
                    <DialogDescription className="text-lg font-semibold text-white/40 pt-2">
                        Start a new collaboration room. You will be the owner.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 pl-1">
                                Room Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="E.g. Lunar Alpha"
                                className="h-14 rounded-2xl bg-[#1A1A1A] border-white/5 px-6 text-[15px] focus-visible:ring-1 focus-visible:ring-white/10 transition-all placeholder:text-white/20 font-bold text-white"
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-4 px-5 py-4 bg-white/5 border border-white/5 rounded-2xl group transition-all hover:border-white/10">
                            <input
                                type="checkbox"
                                id="isPublic"
                                name="isPublic"
                                className="h-5 w-5 rounded-lg border-white/10 bg-[#0B0B0B] text-white focus:ring-white/20 cursor-pointer accent-white"
                            />
                            <Label htmlFor="isPublic" className="text-sm font-bold text-white/60 cursor-pointer select-none group-hover:text-white transition-colors">Make Public</Label>
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 rounded-2xl bg-white hover:bg-white/90 text-black font-black text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Room
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
