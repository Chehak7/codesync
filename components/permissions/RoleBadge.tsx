"use client";

import { Badge } from "@/components/ui/badge";
import { Crown, Edit, Eye } from "lucide-react";
import { UserRole } from "@/actions/permissions-actions";

interface RoleBadgeProps {
    role: UserRole;
    showIcon?: boolean;
}

export function RoleBadge({ role, showIcon = true }: RoleBadgeProps) {
    const config = {
        owner: {
            label: "Owner",
            variant: "default" as const,
            className: "bg-yellow-500 hover:bg-yellow-600 text-white",
            icon: Crown
        },
        editor: {
            label: "Editor",
            variant: "default" as const,
            className: "bg-blue-500 hover:bg-blue-600 text-white",
            icon: Edit
        },
        member: {
            label: "Member",
            variant: "default" as const,
            className: "bg-blue-500 hover:bg-blue-600 text-white",
            icon: Edit
        },
        viewer: {
            label: "Viewer",
            variant: "secondary" as const,
            className: "",
            icon: Eye
        }
    };

    const { label, variant, className, icon: Icon } = config[role];

    return (
        <Badge variant={variant} className={className}>
            {showIcon && <Icon className="mr-1 h-3 w-3" />}
            {label}
        </Badge>
    );
}
