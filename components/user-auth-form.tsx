"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Github } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"

import { login, signup, signInWithOAuth, signInWithMagicLink } from "@/app/actions/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }).optional(),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    isSignUp?: boolean
}

export function UserAuthForm({ className, isSignUp, ...props }: UserAuthFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [authMethod] = React.useState<"password" | "magic">("password")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append("email", values.email)
            if (values.password) formData.append("password", values.password)

            if (authMethod === "magic") {
                const res = await signInWithMagicLink(formData)
                if (res?.error) {
                    toast.error(res.error)
                } else if (res?.success) {
                    toast.success(res.message)
                }
            } else if (isSignUp) {
                const res = await signup(formData)
                if (res?.error) {
                    if (res.code === "email_not_confirmed") {
                        toast.error("Email not confirmed. Please check your inbox.")
                    } else {
                        toast.error(res.error)
                    }
                } else if (res?.success) {
                    toast.success(res.message)
                }
            } else {
                const res = await login(formData)
                if (res?.error) {
                    if (res.code === "email_not_confirmed") {
                        toast.error("Email for this account is not confirmed. Please verify your email first.")
                    } else {
                        toast.error(res.error)
                    }
                } else if (res?.success && res.redirectTo) {
                    router.push(res.redirectTo)
                }
            }
        } catch {
            toast.error("An unexpected error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuth = async (provider: 'google' | 'github') => {
        setIsLoading(true)
        try {
            const res = await signInWithOAuth(provider)
            if (res?.error) {
                toast.error(res.error)
            } else if (res?.success && res.url) {
                window.location.href = res.url
            }
        } catch {
            toast.error("OAuth error")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormControl>
                                    <Input
                                        placeholder="Email address"
                                        className="bg-[#1A1A1A] border-white/5 h-14 rounded-2xl px-6 text-[15px] text-white focus-visible:ring-1 focus-visible:ring-white/20 transition-all placeholder:text-white/30"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="pl-2 px-1 text-xs text-red-400" />
                            </FormItem>
                        )}
                    />
                    {authMethod === "password" && (
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Password"
                                            className="bg-[#1A1A1A] border-white/5 h-14 rounded-2xl px-6 text-[15px] text-white focus-visible:ring-1 focus-visible:ring-white/20 transition-all placeholder:text-white/30"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="pl-2 px-1 text-xs text-red-400" />
                                </FormItem>
                            )}
                        />
                    )}
                    <Button
                        type="submit"
                        className="w-full bg-white hover:bg-white/90 text-black h-14 rounded-2xl text-[15px] font-bold transition-all mt-4"
                        disabled={isLoading}
                    >
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {authMethod === "magic"
                            ? "Sign In with Magic Link"
                            : isSignUp ? "Create Account" : "Login"}
                    </Button>
                </form>
            </Form>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    <span className="bg-black px-4">
                        OR CONTINUE WITH
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    onClick={() => handleOAuth('google')}
                    disabled={isLoading}
                    className="bg-[#1A1A1A] border-white/5 hover:bg-white/5 hover:border-white/10 h-14 rounded-2xl text-[13px] font-bold transition-all text-white"
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                    )}
                    Google
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleOAuth('github')}
                    disabled={isLoading}
                    className="bg-[#1A1A1A] border-white/5 hover:bg-white/5 hover:border-white/10 h-14 rounded-2xl text-[13px] font-bold transition-all text-white"
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Github className="mr-2 h-4 w-4" />
                    )}
                    GitHub
                </Button>
            </div>
        </div>
    )
}
