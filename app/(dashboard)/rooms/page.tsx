import { createClient } from "@/lib/supabase/server";
import { RoomList, RoomWithRole } from "@/components/rooms/RoomList";
import { CreateRoomDialog } from "@/components/rooms/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/rooms/JoinRoomDialog";
import { RealtimeRoomsListener } from "@/components/rooms/RealtimeRoomsListener";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RoomsPage() {
    try {
        const supabase = await createClient();
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (!user) {
            redirect("/auth");
        }

        // Fetch My Rooms (User is owner or member)
        const { data: myMemberships } = await supabase
            .from("room_members")
            .select("room_id, role")
            .eq("user_id", user.id);

        const myRoomIds = (myMemberships as { room_id: string }[] | null)?.map(m => m.room_id) || [];

        // Separate Query for My Rooms details
        let myRooms: RoomWithRole[] = [];
        if (myRoomIds.length > 0) {
            const { data: roomsData } = await supabase
                .from("rooms")
                .select("*, room_members(count)")
                .in("id", myRoomIds)
                .order("created_at", { ascending: false });

            // Map data to include user role and participant count
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            myRooms = (roomsData || []).map((room: any) => {
                const membership = (myMemberships as { room_id: string; role: string }[] | null)?.find(m => m.room_id === room.id);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const count = room.room_members ? (room.room_members[0] as any)?.count : 0;

                return {
                    ...room,
                    role: membership?.role as "owner" | "member",
                    participant_count: count
                };
            });
        }

        // Fetch Public Rooms
        const { data: publicRoomsData } = await supabase
            .from("rooms")
            .select("*, room_members(count)")
            .eq("is_public", true)
            .order("created_at", { ascending: false });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const publicRooms: RoomWithRole[] = (publicRoomsData || []).map((room: any) => {
            const membership = (myMemberships as { room_id: string; role: string }[] | null)?.find(m => m.room_id === room.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const count = room.room_members ? (room.room_members[0] as any)?.count : 0;
            return {
                ...room,
                role: membership?.role as "owner" | "member",
                participant_count: count
            };
        });

        return (
            <div className="flex-1 space-y-8 p-8 md:p-12 min-h-[calc(100vh-64px)] relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-5xl font-black tracking-tighter text-white leading-none drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">Rooms</h2>
                        <p className="text-white/40 font-semibold text-lg">Manage your collaborative workspaces</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <JoinRoomDialog />
                        <CreateRoomDialog />
                    </div>
                </div>

                <RealtimeRoomsListener />

                <div className="mt-8">
                    <RoomList
                        myRooms={myRooms}
                        publicRooms={publicRooms}
                        userId={user.id}
                    />
                </div>
            </div>
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.digest === 'DYNAMIC_SERVER_USAGE' || error.digest?.includes("NEXT_REDIRECT") || error.message?.includes('Dynamic server usage') || error.message === "NEXT_REDIRECT") throw error;
        console.error("Rooms Page Fatal Error:", error);
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-neon-void text-white p-4">
                <h1 className="text-4xl font-black tracking-tighter mb-4 text-neon-pink drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">System Failure</h1>
                <p className="text-white/40 mb-8 font-bold text-center max-w-md">An unexpected error occurred while loading your dashboard.</p>
                <Link href="/">
                    <Button className="bg-white text-black font-black px-12 h-16 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-glow">
                        Return to Base
                    </Button>
                </Link>
            </div>
        );
    }
}
