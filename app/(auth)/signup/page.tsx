"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { AuthCard } from "@/components/auth/AuthCard"
import { AuthInput } from "@/components/auth/AuthInput"
import { OAuthButtons } from "@/components/auth/OAuthButtons"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { signup } from "@/app/actions/auth"

const signupSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(data: SignupFormValues) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("email", data.email)
            formData.append("password", data.password)
            // Note: we can also add fullName to metadata if needed

            const res = await signup(formData)
            if (res?.error) {
                toast.error(res.error)
            } else if (res?.success) {
                toast.success(res.message || "Account created! Please check your email.")
                router.push("/login")
            }
        } catch (error: any) {
            console.error("Signup client error:", error);
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthCard>
            <div className="space-y-10">
                <div className="text-center space-y-3">
                    <h1 className="text-[40px] font-black text-white font-bricolage">
                        Create Your Account
                    </h1>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-5">
                        <AuthInput
                            label="Full Name"
                            placeholder="John Doe"
                            {...form.register("fullName")}
                            error={form.formState.errors.fullName?.message}
                        />
                        <AuthInput
                            label="Email address"
                            placeholder="name@example.com"
                            {...form.register("email")}
                            error={form.formState.errors.email?.message}
                        />
                        <AuthInput
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            {...form.register("password")}
                            error={form.formState.errors.password?.message}
                        />
                        <AuthInput
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            {...form.register("confirmPassword")}
                            error={form.formState.errors.confirmPassword?.message}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !form.formState.isValid}
                        className="w-full h-[64px] bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-black text-xl rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            "Initiate Protocol"
                        )}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full bg-white/5" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-neon-void px-6 text-white/20 font-black uppercase tracking-widest text-xs">Access Gate</span>
                    </div>
                </div>

                <OAuthButtons />

                <p className="text-center text-sm text-white/30 font-medium">
                    Already part of the sync?{" "}
                    <Link
                        href="/login"
                        className="font-black text-neon-cyan hover:text-white transition-colors"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </AuthCard>
    )
}
