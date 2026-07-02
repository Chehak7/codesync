"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreateSnippetInput, Snippet, UpdateSnippetInput } from "@/types/snippet";

export async function createSnippet(input: CreateSnippetInput) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "You must be logged in to create a snippet." };
    }

    const { data, error } = await supabase
        .from("snippets")
        .insert({
            ...input,
            author_id: user.id,
            variables: JSON.stringify(input.variables), // Ensure JSONB compatibility
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/snippets");
    return { data: data as Snippet };
}

export async function updateSnippet(id: string, input: UpdateSnippetInput) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return { error: "Unauthorized" };

    // Verify ownership
    const { data: existing } = await supabase
        .from("snippets")
        .select("author_id")
        .eq("id", id)
        .single();

    if (!existing || existing.author_id !== user.id) {
        return { error: "You are not the owner of this snippet." };
    }

    const updateData: any = { ...input };
    if (input.variables) {
        updateData.variables = JSON.stringify(input.variables);
    }
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("snippets")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/snippets");
    return { data: data as Snippet };
}

export async function deleteSnippet(id: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("snippets")
        .delete()
        .eq("id", id)
        .eq("author_id", user.id); // implicitly checks ownership

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/snippets");
    return { success: true };
}

export async function getSnippets(search?: string, language?: string, category?: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return { data: [] };

    let query = supabase
        .from("snippets")
        .select("*")
        .or(`author_id.eq.${user.id},is_public.eq.true`)
        .order("created_at", { ascending: false });

    if (search) {
        query = query.ilike("title", `%${search}%`);
    }
    if (language && language !== "all") {
        query = query.eq("language", language);
    }
    if (category && category !== "all") {
        query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching snippets:", error);
        return { data: [] };
    }

    return { data: data as Snippet[] };
}

export async function incrementUsageCount(id: string) {
    const supabase = await createClient();

    // We can use an RPC call for atomic increment if precise, or just fetch-update
    // For simplicity, let's use rpc if available, or just ignore race conditions for now as it's just stats
    // Ideally: await supabase.rpc('increment_snippet_usage', { row_id: id });

    // Fallback simple update (racey but acceptable for this MVP)
    const { data } = await supabase.from('snippets').select('usage_count').eq('id', id).single();
    if (data) {
        await supabase.from('snippets').update({ usage_count: (data.usage_count || 0) + 1 }).eq('id', id);
    }
}
