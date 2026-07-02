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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateRoom } from "@/actions/room-actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RoomSettingsDialog({ room, open, onOpenChange }: { room: { id: string, name: string }, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [loading, setLoading] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const name = formData.get("name") as string;

        const result = await updateRoom(room.id, { name });

        setLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Room updated");
            onOpenChange(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-white/5 shadow-2xl p-12 bg-[#0B0B0B] text-white">
                <DialogHeader className="mb-8">
                    <DialogTitle className="text-4xl font-black tracking-tighter text-white">Room Settings</DialogTitle>
                    <DialogDescription className="text-lg font-semibold text-white/40 pt-2">
                        Update room details and preferences.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 pl-1">
                            Room Name
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={room.name}
                            className="h-14 rounded-2xl bg-[#1A1A1A] border-white/5 px-6 text-[15px] focus-visible:ring-1 focus-visible:ring-white/10 transition-all placeholder:text-white/20 font-bold text-white"
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
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
