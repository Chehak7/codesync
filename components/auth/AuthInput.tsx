"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
    ({ label, error, type, className, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const isPassword = type === "password"
        const inputType = isPassword ? (showPassword ? "text" : "password") : type

        return (
            <div className="space-y-3 w-full text-white">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 px-1">
                    {label}
                </Label>
                <div className="relative">
                    <input
                        ref={ref}
                        type={inputType}
                        autoComplete="off"
                        className={cn(
                            "w-full bg-black/40 border border-white/5 px-6 py-5 rounded-2xl text-base font-bold transition-all duration-300 outline-none text-white placeholder:text-white/10 shadow-inner",
                            "focus:border-neon-purple/50 focus:bg-neon-purple/5 focus:ring-4 focus:ring-neon-purple/5",
                            error && "border-neon-pink/50 focus:border-neon-pink focus:ring-neon-pink/5",
                            className
                        )}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    )}
                </div>
                {error && (
                    <p className="text-sm text-[#EF4444] font-medium animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)

AuthInput.displayName = "AuthInput"
