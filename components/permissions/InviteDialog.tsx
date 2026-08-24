"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { UserRole } from "@/actions/permissions-actions";
import { toast } from "sonner";
import { createRoomInvite } from "@/actions/room-actions";

interface InviteDialogProps {
    roomId: string;
    roomCode?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ roomId, open, onOpenChange }: InviteDialogProps) {
    const [selectedRole, setSelectedRole] = useState<UserRole>("editor");
    const [copied, setCopied] = useState(false);
    const [inviteUrl, setInviteUrl] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setInviteUrl("");
        setCopied(false);
    }, [roomId, selectedRole]);

    const handleCopy = async () => {
        setIsGenerating(true);
        try {
            const result = await createRoomInvite(roomId, selectedRole as "editor" | "viewer");
            if (result.error || !result.data) {
                toast.error(result.error || "Unable to create invitation");
                return;
            }
            const url = `${window.location.origin}/rooms?invite=${encodeURIComponent(result.data.token)}`;
            setInviteUrl(url);
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success(`${selectedRole === "editor" ? "Editor" : "Viewer"} invite copied`);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite to Room</DialogTitle>
                    <DialogDescription>
                        Share this link with others to invite them to this room
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role">Default Role</Label>
                        <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            New members will join with this role
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="invite-link">Invite Link</Label>
                        <div className="flex gap-2">
                            <Input
                                id="invite-link"
                                value={inviteUrl}
                                readOnly
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopy}
                                disabled={isGenerating}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
