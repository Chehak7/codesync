"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkPermission } from "./permissions-actions";

export async function sendMessage(roomId: string, content: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Check permission
    const hasPermission = await checkPermission(roomId, "editor");
    if (!hasPermission) {
        return { error: "You don't have permission to send messages" };
    }

    // Verify user is a member of the room
    const { data: member } = await supabase
        .from("room_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!member) {
        return { error: "You are not a member of this room" };
    }

    const { data, error } = await supabase
        .from("messages")
        .insert({
            room_id: roomId,
            user_id: user.id,
            content: content.trim()
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function editMessage(messageId: string, content: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data, error } = await supabase
        .from("messages")
        .update({
            content: content.trim(),
            updated_at: new Date().toISOString()
        })
        .eq("id", messageId)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function deleteMessage(messageId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data, error } = await supabase
        .from("messages")
        .update({
            deleted_at: new Date().toISOString()
        })
        .eq("id", messageId)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function fetchMessages(roomId: string, limit: number = 50, offset: number = 0) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data, error } = await supabase
        .from("messages")
        .select(`
            *,
            user:profiles(id, display_name, avatar_url)
        `)
        .eq("room_id", roomId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1) as any;

    if (error) {
        return { error: error.message };
    }

    return { data: data.reverse() }; // Reverse to show oldest first
}
