"use client";

import { ReactNode } from "react";
import { UserRole } from "@/actions/permissions-actions";

interface PermissionsGuardProps {
    userRole: UserRole | null;
    requiredRole: UserRole;
    fallback?: ReactNode;
    children: ReactNode;
}

const roleHierarchy: Record<UserRole, number> = {
    owner: 3,
    editor: 2,
    member: 2,
    viewer: 1
};

export function PermissionsGuard({
    userRole,
    requiredRole,
    fallback = null,
    children
}: PermissionsGuardProps) {
    if (!userRole) {
        return <>{fallback}</>;
    }

    const hasPermission = roleHierarchy[userRole] >= roleHierarchy[requiredRole];

    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
