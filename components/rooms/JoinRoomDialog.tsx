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
import { joinRoom } from "@/actions/room-actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function JoinRoomDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const code = formData.get("code") as string;

        const result = await joinRoom(code);
        setLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            setOpen(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/5 bg-white/5 text-white font-bold hover:bg-white/10 transition-all">
                    Join Room
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-white/5 shadow-2xl p-12 bg-[#0B0B0B] text-white">
                <DialogHeader className="mb-8">
                    <DialogTitle className="text-4xl font-black tracking-tighter text-white">Join Room</DialogTitle>
                    <DialogDescription className="text-lg font-semibold text-white/40 pt-2">
                        Enter the room code to join an existing session.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <Label htmlFor="code" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 pl-1">
                            Room Code
                        </Label>
                        <Input
                            id="code"
                            name="code"
                            placeholder="ABC-123-XYZ"
                            className="h-14 rounded-2xl bg-[#1A1A1A] border-white/5 px-6 text-[15px] focus-visible:ring-1 focus-visible:ring-white/10 transition-all placeholder:text-white/20 font-mono font-bold text-white uppercase"
                            required
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 rounded-2xl bg-white hover:bg-white/90 text-black font-black text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Join Room
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
