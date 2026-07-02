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

interface InviteDialogProps {
    roomId: string;
    roomCode: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ roomCode, open, onOpenChange }: InviteDialogProps) {
    const [selectedRole, setSelectedRole] = useState<UserRole>("editor");
    const [copied, setCopied] = useState(false);
    const [inviteUrl, setInviteUrl] = useState("");

    useEffect(() => {
        // Only access window on client side
        if (typeof window !== 'undefined') {
            setInviteUrl(`${window.location.origin}/rooms?join=${roomCode}`);
        }
    }, [roomCode]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            toast.success("Invite link copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
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
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="room-code">Room Code</Label>
                        <Input
                            id="room-code"
                            value={roomCode}
                            readOnly
                            className="font-mono text-lg text-center"
                        />
                        <p className="text-sm text-muted-foreground">
                            Users can also join using this code
                        </p>
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
