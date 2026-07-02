"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { AuthCard } from "@/components/auth/AuthCard"
import { AuthInput } from "@/components/auth/AuthInput"
import { Button } from "@/components/ui/button"
import { updatePassword } from "@/app/actions/auth"

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(data: ResetPasswordValues) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("password", data.password)

            const res = await updatePassword(formData)
            if (res?.error) {
                toast.error(res.error)
            } else if (res?.success) {
                toast.success("Password updated successfully!")
                router.push("/login")
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthCard>
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-[32px] font-bold text-white">
                        Set New Password
                    </h1>
                    <p className="text-sm text-[#54444C]/60">
                        Enter your new password below.
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <AuthInput
                            label="New Password"
                            type="password"
                            placeholder="••••••••"
                            {...form.register("password")}
                            error={form.formState.errors.password?.message}
                        />
                        <AuthInput
                            label="Confirm New Password"
                            type="password"
                            placeholder="••••••••"
                            {...form.register("confirmPassword")}
                            error={form.formState.errors.confirmPassword?.message}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !form.formState.isValid}
                        className="w-full h-[52px] bg-gradient-to-r from-[#CB97C0] to-[#9333EA] text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(203,151,192,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            "Update Password"
                        )}
                    </Button>
                </form>
            </div>
        </AuthCard>
    )
}
