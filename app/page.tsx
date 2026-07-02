import { LandingNavbar } from "../components/layout/LandingNavbar";
import { createClient } from "@/lib/supabase/server";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { CTASection } from "../components/landing/CTASection";
import { Footer } from "../components/layout/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    return (
      <div className="min-h-screen bg-[#050505] overflow-hidden flex flex-col relative">
        {/* Primary Background Layer */}
        <div className="fixed inset-0 z-0 bg-neon-void" />

        {/* Animated Swirling Orbs */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-neon-purple/20 rounded-full blur-[120px] animate-swirl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-neon-cyan/10 rounded-full blur-[120px] animate-swirl [animation-delay:5s]" />
          <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-neon-pink/10 rounded-full blur-[100px] animate-swirl [animation-delay:10s]" />
        </div>

        {/* Grainy Texture Overlay */}
        <div className="fixed inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        <LandingNavbar user={user} />
        <main className="flex-1 relative z-10">
          <Hero user={user} />
          <Features />

          <CTASection />
        </main>
        <Footer />
      </div>
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.digest === 'DYNAMIC_SERVER_USAGE' || error.digest?.includes('NEXT_REDIRECT') || error.message?.includes('Dynamic server usage')) throw error;
    console.error("Home Page Fatal Error:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neon-void text-white p-4">
        <h1 className="text-6xl font-black tracking-tighter mb-4 text-neon-purple drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">CodeSync</h1>
        <p className="text-white/40 mb-12 font-bold text-center max-w-md">Our systems are currently undergoing maintenance. Please check back shortly.</p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline" className="border-white/10 text-white font-bold px-8 h-14 rounded-2xl hover:bg-white/5">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-white text-black font-black px-8 h-14 rounded-2xl hover:bg-white/90">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}
