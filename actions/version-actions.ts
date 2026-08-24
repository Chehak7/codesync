"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkPermission } from "./permissions-actions";

export async function createFileVersion(
    roomId: string,
    fileId: string,
    content: string,
    message: string
) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    const hasPermission = await checkPermission(roomId, "editor");
    if (!hasPermission) {
        return { error: "Insufficient permissions to create versions" };
    }

    const { data: file, error: fileError } = await supabase
        .from("code_sessions")
        .select("id")
        .eq("id", fileId)
        .eq("room_id", roomId)
        .eq("type", "file")
        .maybeSingle();

    if (fileError || !file) {
        return { error: fileError?.message || "File not found in this room" };
    }

    const { data, error } = await supabase
        .from("code_versions")
        .insert({
            room_id: roomId,
            code_session_id: fileId,
            user_id: user.id,
            code: content,
            message: message.trim()
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function fetchFileVersions(fileId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("code_versions")
        .select(`
            *,
            user:profiles(id, display_name, avatar_url)
        `)
        .eq("code_session_id", fileId)
        .order("created_at", { ascending: false });

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function restoreFileVersion(
    roomId: string,
    fileId: string,
    versionId: string
) {
    const supabase = await createClient();
    const hasPermission = await checkPermission(roomId, "editor");

    if (!hasPermission) {
        return { error: "Insufficient permissions to restore versions" };
    }

    const { data: version, error: fetchError } = await supabase
        .from("code_versions")
        .select("code")
        .eq("id", versionId)
        .eq("room_id", roomId)
        .eq("code_session_id", fileId)
        .single();

    if (fetchError || !version) {
        return { error: fetchError?.message || "Version not found" };
    }

    const { data: updatedFile, error: updateError } = await supabase
        .from("code_sessions")
        .update({ code: version.code })
        .eq("id", fileId)
        .eq("room_id", roomId)
        .eq("type", "file")
        .select("id")
        .maybeSingle();

    if (updateError || !updatedFile) {
        return { error: updateError?.message || "File not found in this room" };
    }

    revalidatePath(`/room/${roomId}`);
    return { success: true, data: { code: version.code } };
}

export async function deleteVersion(roomId: string, versionId: string) {
    const supabase = await createClient();
    const hasPermission = await checkPermission(roomId, "owner");

    if (!hasPermission) {
        return { error: "Only owners can delete versions" };
    }

    const { error } = await supabase
        .from("code_versions")
        .delete()
        .eq("id", versionId)
        .eq("room_id", roomId);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}
