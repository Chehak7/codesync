"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

// We'll use a custom nanoid or just random string since 'nanoid' package import might vary in server components.
// Actually, simple random string is enough for room codes.
function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export async function createRoom(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    const isPublic = formData.get("isPublic") === "on";

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "You must be logged in to create a room." };
    }

    const roomCode = generateRoomCode();

    const { data: room, error } = await supabase
        .from("rooms")
        .insert({
            name,
            room_code: roomCode,
            owner_id: user.id,
            is_public: isPublic,
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    // Add owner to room_members
    const { error: memberError } = await supabase
        .from("room_members")
        .insert({
            room_id: room.id,
            user_id: user.id,
            role: "owner"
        });

    if (memberError) {
        // Rollback? Ideally yes, but for now just report. RLS should allow this.
        console.error("Failed to add owner member:", memberError);
    }

    revalidatePath("/rooms");
    redirect(`/room/${room.id}`);
}

export async function joinRoom(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "You must be logged in to join a room." };
    }

    // Find room by code using RPC to bypass RLS for non-members
    const { data: rooms, error: roomError } = await supabase
        .rpc("find_room_by_code", { p_code: code });

    if (roomError || !rooms || rooms.length === 0) {
        return { error: "Room not found or invalid code." };
    }

    const roomId = rooms[0].id;

    // Check if already a member
    const { data: member } = await supabase
        .from("room_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .maybeSingle(); // Use maybeSingle for better error handling

    if (member) {
        // Already joined, just redirect
        redirect(`/room/${roomId}`);
    }

    const { error: joinError } = await supabase
        .from("room_members")
        .insert({
            room_id: roomId,
            user_id: user.id,
            role: "editor"
        });

    if (joinError) {
        return { error: joinError.message };
    }

    revalidatePath("/rooms");
    redirect(`/room/${roomId}`);
}

export async function leaveRoom(roomId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/rooms");
}

export async function deleteRoom(roomId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return { error: "Unauthorized" };

    // Check ownership
    const { data: room } = await supabase
        .from("rooms")
        .select("owner_id")
        .eq("id", roomId)
        .single();

    if (!room || room.owner_id !== user.id) {
        return { error: "You are not the owner of this room." };
    }

    const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/rooms");
}

export async function updateRoom(roomId: string, data: { name: string }) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return { error: "Unauthorized" };

    // Check ownership
    const { data: room } = await supabase
        .from("rooms")
        .select("owner_id")
        .eq("id", roomId)
        .single();

    if (!room || room.owner_id !== user.id) {
        return { error: "You are not the owner of this room." };
    }

    const { error } = await supabase
        .from("rooms")
        .update({ name: data.name })
        .eq("id", roomId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/rooms");
}
