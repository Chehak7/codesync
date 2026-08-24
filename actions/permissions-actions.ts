"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UserRole = "owner" | "editor" | "viewer";

export async function getUserRole(roomId: string): Promise<{ role: UserRole | null; error?: string }> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { role: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
        .from("room_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (error) {
        return { role: null, error: error.message };
    }

    return { role: data.role as UserRole };
}

export async function getRoomMembers(roomId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Verify user is a member
    const { data: member } = await supabase
        .from("room_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!member) {
        return { error: "Not a member of this room" };
    }

    const { data, error } = await supabase
        .from("room_members")
        .select(`
            id,
            user_id,
            role,
            joined_at,
            user:profiles(id, display_name, avatar_url)
        `)
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true }) as any;

    if (error) {
        return { error: error.message };
    }

    return { data };
}

export async function updateMemberRole(roomId: string, userId: string, newRole: UserRole) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Verify current user is owner
    const { data: currentMember } = await supabase
        .from("room_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!currentMember || currentMember.role !== "owner") {
        return { error: "Only owners can change member roles" };
    }

    // Prevent changing own role
    if (userId === user.id) {
        return { error: "Cannot change your own role" };
    }

    // Prevent removing last owner
    if (newRole !== "owner") {
        const { data: owners } = await supabase
            .from("room_members")
            .select("id")
            .eq("room_id", roomId)
            .eq("role", "owner");

        if (owners && owners.length === 1) {
            const { data: targetMember } = await supabase
                .from("room_members")
                .select("role")
                .eq("room_id", roomId)
                .eq("user_id", userId)
                .single();

            if (targetMember?.role === "owner") {
                return { error: "Cannot remove the last owner" };
            }
        }
    }

    const { data, error } = await supabase
        .from("room_members")
        .update({ role: newRole })
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/room/${roomId}`);
    return { data };
}

export async function removeMember(roomId: string, userId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Verify current user is owner
    const { data: currentMember } = await supabase
        .from("room_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

    if (!currentMember || currentMember.role !== "owner") {
        return { error: "Only owners can remove members" };
    }

    // Prevent removing self
    if (userId === user.id) {
        return { error: "Cannot remove yourself from the room" };
    }

    // Prevent removing last owner
    const { data: targetMember } = await supabase
        .from("room_members")
        .select("role")
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .single();

    if (targetMember?.role === "owner") {
        const { data: owners } = await supabase
            .from("room_members")
            .select("id")
            .eq("room_id", roomId)
            .eq("role", "owner");

        if (owners && owners.length === 1) {
            return { error: "Cannot remove the last owner" };
        }
    }

    const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", userId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/room/${roomId}`);
    return { success: true };
}

export async function checkPermission(roomId: string, requiredRole: UserRole): Promise<boolean> {
    const { role } = await getUserRole(roomId);

    if (!role) return false;

    const roleHierarchy: Record<UserRole, number> = {
        owner: 3,
        editor: 2,
        viewer: 1
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
}
