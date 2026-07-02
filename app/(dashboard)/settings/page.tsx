import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="container max-w-4xl py-20 px-8 mx-auto font-sans">
            <div className="flex flex-col gap-12">
                <div className="space-y-3">
                    <h1 className="text-6xl font-black tracking-tighter text-white">Settings</h1>
                    <p className="text-white/40 font-semibold text-xl">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="bg-transparent h-auto p-0 gap-10 mb-10 border-b border-white/5 w-full justify-start rounded-none">
                        <TabsTrigger
                            value="profile"
                            className="px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none text-white/30 data-[state=active]:text-white font-bold uppercase tracking-[0.2em] text-[11px] transition-all"
                        >
                            Profile
                        </TabsTrigger>
                        <TabsTrigger
                            value="preferences"
                            className="px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none text-white/30 data-[state=active]:text-white font-bold uppercase tracking-[0.2em] text-[11px] transition-all"
                        >
                            Preferences
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none text-white/30 data-[state=active]:text-white font-bold uppercase tracking-[0.2em] text-[11px] transition-all"
                        >
                            Security
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <Card className="rounded-[2.5rem] border-white/5 shadow-2xl bg-[#0B0B0B] p-10 text-white">
                            <CardHeader className="px-0 pt-0 mb-8">
                                <CardTitle className="text-3xl font-black tracking-tighter text-white">Profile</CardTitle>
                                <CardDescription className="text-white/40 font-semibold text-lg mt-2">
                                    Update your personal information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 space-y-8">
                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1">Email</Label>
                                    <Input id="email" value={user.email} disabled className="h-16 rounded-2xl bg-white/5 border-white/5 px-8 font-bold text-white/40 opacity-50 cursor-not-allowed" />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1">Full Name</Label>
                                    <Input id="name" placeholder="John Doe" defaultValue={user.user_metadata?.full_name} className="h-16 rounded-2xl bg-[#1A1A1A] border-white/5 px-8 font-bold text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/10" />
                                </div>
                                <Button className="h-16 px-10 rounded-2xl bg-white hover:bg-white/90 text-black font-black text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5">Save Changes</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="preferences">
                        <Card className="rounded-[2.5rem] border-white/5 shadow-2xl bg-[#0B0B0B] p-10 text-white">
                            <CardHeader className="px-0 pt-0 mb-8">
                                <CardTitle className="text-3xl font-black tracking-tighter text-white">Preferences</CardTitle>
                                <CardDescription className="text-white/40 font-semibold text-lg mt-2">
                                    Customize your experience.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 space-y-10">
                                <div className="flex items-center justify-between p-8 bg-white/5 border border-white/5 rounded-[2rem] transition-all hover:border-white/10 group">
                                    <div className="space-y-1">
                                        <Label className="text-lg font-black text-white group-hover:text-white/60 transition-colors">Notifications</Label>
                                        <p className="text-sm text-white/40 font-semibold">
                                            Enable email notifications for mentions and updates.
                                        </p>
                                    </div>
                                    <Switch className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/10" />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1">Editor Theme</Label>
                                    <Select defaultValue="vs-dark">
                                        <SelectTrigger className="h-16 rounded-2xl border-white/5 bg-[#1A1A1A] px-8 text-white font-black text-lg focus:ring-white/10">
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-white/5 bg-[#0B0B0B] text-white shadow-2xl p-2 min-w-[200px]">
                                            <SelectItem value="vs-dark" className="rounded-xl focus:bg-white/10 py-3 font-bold">VS Dark</SelectItem>
                                            <SelectItem value="light" className="rounded-xl focus:bg-white/10 py-3 font-bold">VS Light</SelectItem>
                                            <SelectItem value="hc-black" className="rounded-xl focus:bg-white/10 py-3 font-bold">High Contrast</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="h-16 px-10 rounded-2xl bg-white hover:bg-white/90 text-black font-black text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5">Save Preferences</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card className="rounded-[2.5rem] border-white/5 shadow-2xl bg-[#0B0B0B] p-10 text-white">
                            <CardHeader className="px-0 pt-0 mb-8">
                                <CardTitle className="text-3xl font-black tracking-tighter text-white">Security</CardTitle>
                                <CardDescription className="text-white/40 font-semibold text-lg mt-2">
                                    Manage your security settings.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 space-y-8">
                                <div className="space-y-3">
                                    <Label htmlFor="current-password" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1">Current Password</Label>
                                    <Input id="current-password" type="password" className="h-16 rounded-2xl bg-[#1A1A1A] border-white/5 px-8 font-bold text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/10" />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="new-password" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 ml-1">New Password</Label>
                                    <Input id="new-password" type="password" className="h-16 rounded-2xl bg-[#1A1A1A] border-white/5 px-8 font-bold text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/10" />
                                </div>
                                <Button className="h-16 px-10 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-lg transition-all shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95">Update Password</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
