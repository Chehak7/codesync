"use client"

import { motion } from "framer-motion"
import { Code2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AuthCardProps {
    children: React.ReactNode
    className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
                "w-full max-w-[480px] bg-neon-void/80 backdrop-blur-3xl rounded-[32px] p-[48px] shadow-[0_0_60px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden",
                className
            )}
        >
            <div className="absolute top-10 left-10">
                <Link href="/" className="group flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center transition-all duration-500 group-hover:rotate-12 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                        <Code2 className="h-7 w-7 text-white" />
                    </div>
                </Link>
            </div>
            <div className="mt-12 text-white">
                {children}
            </div>
        </motion.div>
    )
}
