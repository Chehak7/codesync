"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRoom(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get("name") as string;
    const isPublic = formData.get("isPublic") === "on";

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "You must be logged in to create a room." };
    }

    const { data: room, error } = await supabase
        .rpc("create_room", {
            p_name: name,
            p_is_public: isPublic,
        })
        .single();

    if (error) {
        return { error: error.message };
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

    const { data: roomId, error } = await supabase
        .rpc("join_room", {
            p_code: code,
            p_room_id: undefined,
            p_invitation_token: undefined,
        });

    if (error || !roomId) {
        return { error: error?.message || "Room not found or invalid code." };
    }

    revalidatePath("/rooms");
    redirect(`/room/${roomId}`);
}

export async function joinPublicRoom(roomId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
        return { error: "You must be logged in to join a room." };
    }

    const { data: joinedRoomId, error } = await supabase
        .rpc("join_public_room", { p_room_id: roomId });

    if (error || !joinedRoomId) {
        return { error: "This room is not public or no longer exists." };
    }

    revalidatePath("/rooms");
    redirect(`/room/${joinedRoomId}`);
}

export async function createRoomInvite(roomId: string, role: "editor" | "viewer") {
    if (role !== "editor" && role !== "viewer") {
        return { error: "Invitation role must be editor or viewer." };
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { error: "Unauthorized" };

    const { data: token, error } = await supabase.rpc("create_room_invitation", {
        p_room_id: roomId,
        p_role: role,
    });

    if (error || !token) {
        return { error: error?.message || "Unable to create invitation." };
    }

    return { data: { token } };
}

export async function leaveRoom(roomId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase.rpc("leave_room", { p_room_id: roomId });

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
