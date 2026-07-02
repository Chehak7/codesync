"use client"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-neon-void">
            {/* Animated Swirling Orbs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-neon-purple/20 rounded-full blur-[140px] animate-swirl" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-neon-cyan/20 rounded-full blur-[140px] animate-swirl [animation-delay:5s]" />
            </div>

            {/* Grainy Texture Overlay */}
            <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

            <main className="relative z-10 w-full flex justify-center">
                {children}
            </main>
        </div>
    )
}
