"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

type ExecutionStatus = "idle" | "running" | "success" | "error" | "rate-limited";

interface ExecutionStatusProps {
    status: ExecutionStatus;
    executionTime?: number;
}

export function ExecutionStatus({ status, executionTime }: ExecutionStatusProps) {
    const config = {
        idle: {
            label: "Ready",
            variant: "secondary" as const,
            icon: Clock,
            className: "",
        },
        running: {
            label: "Running...",
            variant: "default" as const,
            icon: Loader2,
            className: "bg-blue-500 hover:bg-blue-600",
        },
        success: {
            label: executionTime ? `Success (${executionTime}ms)` : "Success",
            variant: "default" as const,
            icon: CheckCircle,
            className: "bg-green-500 hover:bg-green-600",
        },
        error: {
            label: "Error",
            variant: "destructive" as const,
            icon: XCircle,
            className: "",
        },
        "rate-limited": {
            label: "Rate Limited",
            variant: "destructive" as const,
            icon: XCircle,
            className: "",
        },
    };

    const { label, variant, icon: Icon, className } = config[status];

    return (
        <Badge variant={variant} className={className}>
            <Icon className={`mr-1 h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />
            {label}
        </Badge>
    );
}
