"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { ChevronLeft } from "lucide-react"

import { AuthCard } from "@/components/auth/AuthCard"
import { AuthInput } from "@/components/auth/AuthInput"
import { Button } from "@/components/ui/button"
import { forgotPassword } from "@/app/actions/auth"

const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(data: ForgotPasswordValues) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("email", data.email)

            const res = await forgotPassword(formData)
            if (res?.error) {
                toast.error(res.error)
            } else if (res?.success) {
                toast.success(res.message || "Reset link sent to your email.")
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
                        Forgot Your Password?
                    </h1>
                    <p className="text-sm text-[#54444C]/60">
                        Enter your email and we&apos;ll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <AuthInput
                        label="Email address"
                        placeholder="name@example.com"
                        {...form.register("email")}
                        error={form.formState.errors.email?.message}
                    />

                    <Button
                        type="submit"
                        disabled={isLoading || !form.formState.isValid}
                        className="w-full h-[52px] bg-gradient-to-r from-[#CB97C0] to-[#9333EA] text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(203,151,192,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            "Send Reset Link"
                        )}
                    </Button>
                </form>

                <div className="text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#CB97C0] hover:underline"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </AuthCard>
    )
}
