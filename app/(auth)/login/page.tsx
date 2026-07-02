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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { login } from "@/app/actions/auth"

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    rememberMe: z.boolean(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    })

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("email", data.email)
            formData.append("password", data.password)

            const res = await login(formData)
            if (res?.error) {
                toast.error(res.error)
            } else if (res?.success && res.redirectTo) {
                toast.success("Welcome back!")
                router.push(res.redirectTo)
            }
        } catch (error: any) {
            console.error("Login client error:", error);
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthCard>
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-[32px] font-bold text-white">
                        Login to Your Account
                    </h1>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-6">
                        <AuthInput
                            label="Email address"
                            placeholder="name@example.com"
                            {...form.register("email")}
                            error={form.formState.errors.email?.message}
                        />
                        <div className="space-y-1">
                            <AuthInput
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                {...form.register("password")}
                                error={form.formState.errors.password?.message}
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="rememberMe"
                                        className="border-white/10 data-[state=checked]:bg-neon-cyan data-[state=checked]:border-neon-cyan"
                                        onCheckedChange={(checked) => form.setValue("rememberMe", !!checked)}
                                    />
                                    <Label
                                        htmlFor="rememberMe"
                                        className="text-sm font-black uppercase tracking-widest text-white/20 cursor-pointer hover:text-white/40 transition-colors"
                                    >
                                        Stay Synced
                                    </Label>
                                </div>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-bold text-neon-cyan/50 hover:text-neon-cyan transition-colors"
                                >
                                    Forgot Key?
                                </Link>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !form.formState.isValid}
                        className="w-full h-[60px] bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-black text-xl rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            "Verify Identity"
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
                    New to the network?{" "}
                    <Link
                        href="/signup"
                        className="font-black text-neon-cyan hover:text-white transition-colors"
                    >
                        Register
                    </Link>
                </p>
            </div>
        </AuthCard>
    )
}
