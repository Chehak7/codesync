"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RoleBadge } from "./RoleBadge";
import { UserRole, getRoomMembers, updateMemberRole, removeMember } from "@/actions/permissions-actions";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Member {
    id: string;
    user_id: string;
    role: UserRole;
    joined_at: string;
    user: {
        id: string;
        email?: string;
        avatar_url?: string;
    };
}

interface MembersPanelProps {
    roomId: string;
    currentUserId: string;
    currentUserRole: UserRole;
    open: boolean;
}

export function MembersPanel({
    roomId,
    currentUserId,
    currentUserRole,
    open,
}: MembersPanelProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

    const isOwner = currentUserRole === "owner";

    const loadMembers = useCallback(async () => {
        setLoading(true);
        const result = await getRoomMembers(roomId);
        setLoading(false);

        if (result.error) {
            toast.error(result.error);
        } else if (result.data) {
            setMembers(result.data as Member[]);
        }
    }, [roomId]);

    useEffect(() => {
        if (open) {
            loadMembers();
        }
    }, [open, roomId, loadMembers]);

    // Real-time subscription for member changes
    useEffect(() => {
        if (!open) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`room:${roomId}:members`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "room_members",
                    filter: `room_id=eq.${roomId}`
                },
                () => {
                    loadMembers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [open, roomId, loadMembers]);

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        const result = await updateMemberRole(roomId, userId, newRole);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Role updated successfully");
        }
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove) return;

        const result = await removeMember(roomId, memberToRemove.user_id);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Member removed");
        }

        setMemberToRemove(null);
    };

    return (
        <div className="h-full flex flex-col bg-transparent">
            <div className="p-8 border-b border-white/5 space-y-2 bg-white/[0.02] backdrop-blur-xl relative">
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-black flex items-center justify-between">
                    Collaborators
                    <span className="px-2 py-0.5 rounded-full bg-black/5 text-black/40 text-[8px] font-black">{members.length}</span>
                </h2>
                <p className="text-[11px] text-black/60 font-medium">Managing room access</p>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-3">
                    {loading ? (
                        <div className="py-12 text-center text-[10px] uppercase tracking-widest text-white/10 font-bold">Initializing...</div>
                    ) : (
                        members.map((member) => {
                            const userName = member.user.email?.split("@")[0] || "Anonymous";
                            const avatarUrl = member.user.avatar_url;
                            const isCurrentUser = member.user_id === currentUserId;

                            return (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10 border border-white/10 grayscale group-hover:grayscale-0 transition-all">
                                            <AvatarImage src={avatarUrl} />
                                            <AvatarFallback className="bg-white/5 text-white text-xs font-black">
                                                {userName.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-sm text-black truncate">
                                                {userName}
                                                {isCurrentUser && (
                                                    <span className="text-[9px] uppercase tracking-tight text-black/40 ml-2 font-black">
                                                        (You)
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-black/40 truncate font-medium">
                                                {member.user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isOwner && !isCurrentUser ? (
                                            <>
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(value) =>
                                                        handleRoleChange(member.user_id, value as UserRole)
                                                    }
                                                >
                                                    <SelectTrigger className="w-[90px] h-8 bg-transparent border-white/10 text-[10px] uppercase font-black tracking-tighter">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-black/60 backdrop-blur-xl border-white/10 text-white rounded-2xl">
                                                        <SelectItem value="owner">Owner</SelectItem>
                                                        <SelectItem value="editor">Editor</SelectItem>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-white/10 hover:text-red-500/60 hover:bg-red-500/5 transition-all"
                                                    onClick={() => setMemberToRemove(member)}
                                                >
                                                    <UserMinus className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        ) : (
                                            <RoleBadge role={member.role} />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
                <AlertDialogContent className="bg-black/60 backdrop-blur-3xl border-white/10 rounded-[2rem] p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white font-black uppercase tracking-widest text-lg">Remove Member</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/40 font-medium">
                            Are you sure you want to remove{" "}
                            <strong className="text-[#a855f7]">{memberToRemove?.user.email}</strong> from this room?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-4">
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white rounded-xl hover:bg-white/5 h-12 px-8">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveMember} className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 px-8 border-none font-bold">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
