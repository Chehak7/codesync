"use client";

import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Copy, LogOut, Trash, Users, Edit } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteRoom, joinPublicRoom, leaveRoom } from "@/actions/room-actions";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useTransition } from "react";
import { RoomSettingsDialog } from "./RoomSettingsDialog";

interface RoomCardProps {
    room: {
        id: string;
        name: string;
        room_code: string;
        is_public: boolean;
        owner_id: string;
        created_at: string;
    };
    currentUserId: string;
    memberRole?: "owner" | "editor" | "viewer";
    participantCount: number;
}

export function RoomCard({ room, currentUserId, memberRole, participantCount }: RoomCardProps) {
    const isOwner = room.owner_id === currentUserId;
    const isMember = Boolean(memberRole);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isJoining, startJoining] = useTransition();

    const handleCopyCode = () => {
        navigator.clipboard.writeText(room.room_code);
        toast.success("Room code copied to clipboard");
    };

    const handleDelete = async () => {
        const result = await deleteRoom(room.id);
        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Room deleted");
        }
    };

    const handleLeave = async () => {
        const result = await leaveRoom(room.id);
        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success("Left room");
        }
    };

    const handleJoinPublicRoom = () => {
        startJoining(async () => {
            const result = await joinPublicRoom(room.id);
            if (result?.error) toast.error(result.error);
        });
    };

    return (
        <Card className="flex flex-col h-full bg-glass-surface backdrop-blur-md border border-glass-border rounded-[2rem] p-6 shadow-glass transition-all duration-300 hover:border-neon-cyan/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] group relative overflow-hidden text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex flex-row items-start justify-between mb-6 relative z-10">
                <div className="flex flex-col space-y-3">
                    <CardTitle className="text-3xl font-black tracking-tighter text-white truncate max-w-[220px] drop-shadow-md" title={room.name}>
                        {room.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-white/5 text-white/60 border border-white/5 font-bold text-[10px] uppercase tracking-widest rounded-lg px-3 py-1 backdrop-blur-sm">
                            {room.is_public ? "Public" : "Private"}
                        </Badge>
                        {isOwner && (
                            <Badge className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 font-bold text-[10px] uppercase tracking-widest rounded-lg px-3 py-1 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                Owner
                            </Badge>
                        )}
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-2xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border border-glass-border bg-black/80 backdrop-blur-xl shadow-2xl p-2 min-w-[160px]">
                        <DropdownMenuItem onClick={handleCopyCode} className="rounded-xl focus:bg-white/5 focus:text-white font-semibold flex items-center gap-3 py-2.5">
                            <Copy className="h-4 w-4" />
                            Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5 mx-2" />
                        {!isOwner && (
                            <DropdownMenuItem onClick={handleLeave} className="text-neon-pink focus:text-neon-pink focus:bg-neon-pink/10 rounded-xl font-semibold flex items-center gap-3 py-2.5">
                                <LogOut className="h-4 w-4" />
                                Leave Room
                            </DropdownMenuItem>
                        )}
                        {isOwner && (
                            <>
                                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="rounded-xl focus:bg-white/5 focus:text-white font-semibold flex items-center gap-3 py-2.5">
                                    <Edit className="h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-xl focus:bg-neon-pink/10 p-0">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <div className="flex items-center w-full text-neon-pink cursor-pointer px-3 py-2.5 font-semibold gap-3">
                                                <Trash className="h-4 w-4" />
                                                Delete Room
                                            </div>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-[2.5rem] border border-glass-border bg-black/90 backdrop-blur-xl shadow-2xl p-10 max-w-md">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-3xl font-black text-white tracking-tighter">Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-white/40 font-semibold leading-relaxed">
                                                    This action is permanent. All code and history will be lost forever.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-8 gap-3">
                                                <AlertDialogCancel className="rounded-2xl border-white/5 bg-white/5 text-white font-bold h-14 px-8 hover:bg-white/10 transition-colors">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="bg-neon-pink hover:bg-neon-pink/90 text-white font-bold h-14 px-8 rounded-2xl border-none transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.4)]">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 space-y-6 relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                    Created {new Date(room.created_at).toLocaleDateString()}
                </div>

                <div className="space-y-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className="inline-flex items-center gap-4 bg-white/5 px-5 py-3 rounded-2xl text-sm font-mono font-bold text-white hover:bg-white/10 transition-all border border-white/5 cursor-pointer group/code hover:border-neon-cyan/30"
                                    onClick={handleCopyCode}
                                >
                                    <span className="text-neon-cyan opacity-80">#</span> {room.room_code}
                                    <Copy className="h-3.5 w-3.5 opacity-30 group-hover/code:opacity-100 transition-opacity text-neon-cyan" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="rounded-xl border border-glass-border bg-black/80 backdrop-blur-md text-white font-bold px-4 py-2 text-[11px] uppercase tracking-widest">
                                <p>Click to copy code</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <div className="flex items-center gap-3 text-white/60 font-bold text-xs uppercase tracking-widest bg-white/5 w-fit px-4 py-2 rounded-2xl border border-white/5">
                        <Users className="h-4 w-4 text-neon-purple" />
                        {participantCount} Active
                    </div>
                </div>
            </div>

            <div className="mt-10 relative z-10">
                {isMember ? (
                    <Button asChild className="w-full bg-white hover:bg-white/90 text-black font-black h-16 rounded-2xl transition-all hover:scale-105 active:scale-95 text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                        <Link href={`/room/${room.id}`}>Enter Room</Link>
                    </Button>
                ) : (
                    <Button
                        type="button"
                        disabled={isJoining || !room.is_public}
                        onClick={handleJoinPublicRoom}
                        className="w-full bg-white hover:bg-white/90 text-black font-black h-16 rounded-2xl transition-all hover:scale-105 active:scale-95 text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                    >
                        {isJoining ? "Joining…" : "Join Public Room"}
                    </Button>
                )}
            </div>

            <RoomSettingsDialog room={room} open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </Card>
    );
}
