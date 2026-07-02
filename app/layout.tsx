import type { Metadata } from "next";
import localFont from "next/font/local";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { CommandMenu } from "@/components/command-menu";
import { ShortcutsModal } from "@/components/shortcuts-modal";
import { PageTransition } from "@/components/page-transition";
import { ErrorBoundary } from "@/components/error-boundary";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/sonner";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CodeSync - Collaborative Real-time Editor",
  description: "Real-time collaborative code editor powered by Next.js and Supabase.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${instrument.variable} font-sans antialiased bg-[#54444C]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col bg-[#050505] overflow-x-hidden selection:bg-neon-cyan/30 selection:text-neon-cyan">
            {/* Global Nebula Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neon-cyan/10 blur-[120px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-purple/10 blur-[120px]" />
              <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-neon-cyan/5 blur-[150px]" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <Navbar user={user} />
              <main className="flex-1 flex flex-col">
                <ErrorBoundary>
                  <PageTransition>{children}</PageTransition>
                </ErrorBoundary>
              </main>
            </div>
          </div>
          <CommandMenu />
          <ShortcutsModal />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
