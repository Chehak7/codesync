import { createClient } from "@/lib/supabase/server";
import { RoomEditor } from "@/components/editor/RoomEditor";
import { redirect } from "next/navigation";
import { fetchMessages } from "@/actions/chat-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    try {
        const { roomId } = await params;
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        const user = data?.user;

        if (!user) {
            redirect("/login");
        }

        // Verify membership and get role
        const { data: member, error: memberError } = await supabase
            .from("room_members")
            .select("role")
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (memberError || !member) {
            console.error("Room Access Error:", memberError);
            redirect("/rooms");
        }

        // Fetch initial files
        const { data: files } = await supabase
            .from("code_sessions")
            .select("*")
            .eq("room_id", roomId)
            .order("created_at", { ascending: true });

        // Fetch initial messages
        let initialMessages = [];
        try {
            const messagesResult = await fetchMessages(roomId, 50, 0);
            initialMessages = messagesResult.data || [];
        } catch (e) {
            console.error("Error fetching messages:", e);
        }

        // Fetch room data for breadcrumbs and invite code
        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("name, room_code")
            .eq("id", roomId)
            .maybeSingle();

        if (roomError || !room) {
            console.error("Room Data Error:", roomError);
            return redirect("/rooms");
        }

        return (
            <RoomEditor
                roomId={roomId}
                roomName={room?.name || "Untitled Room"}
                initialFiles={files || []}
                currentUser={user}
                initialMessages={initialMessages}
                userRole={member.role}
                roomCode={room?.room_code || ""}
            />
        );
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (error.digest === 'DYNAMIC_SERVER_USAGE' || error.digest?.includes("NEXT_REDIRECT") || error.message?.includes('Dynamic server usage') || error.message === "NEXT_REDIRECT") throw error;
        console.error("Room Page Fatal Error:", error);
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-neon-void text-white p-4">
                <h1 className="text-4xl font-black tracking-tighter mb-4 text-neon-pink">System Failure</h1>
                <p className="text-white/40 mb-8 font-bold">An unexpected error occurred while loading the room.</p>
                <Link href="/rooms">
                    <Button className="bg-white text-black font-black px-8 h-14 rounded-2xl hover:bg-white/90">
                        Return to Base
                    </Button>
                </Link>
            </div>
        );
    }
}
