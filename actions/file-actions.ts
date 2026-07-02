"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import prettier from "prettier";
import { checkPermission } from "./permissions-actions";

export async function createFile(
    roomId: string,
    name: string,
    type: "file" | "folder",
    parentId: string | null = null,
    language: string | null = null,
    initialCode: string = ""
) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Check permission
    const hasPermission = await checkPermission(roomId, "editor");
    if (!hasPermission) {
        return { error: "You don't have permission to create files" };
    }

    const { data, error } = await supabase
        .from("code_sessions")
        .insert({
            room_id: roomId,
            name: name,
            type: type,
            parent_id: parentId,
            language: language,
            code: initialCode
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath(`/room/${roomId}`);
    return { data };
}

export async function deleteFile(fileId: string, roomId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Check permission
    const hasPermission = await checkPermission(roomId, "editor");
    if (!hasPermission) {
        return { error: "You don't have permission to delete files" };
    }

    const { error } = await supabase
        .from("code_sessions")
        .delete()
        .eq("id", fileId)
        .eq("room_id", roomId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/room/${roomId}`);
    return { success: true };
}

export async function saveFileContent(fileId: string, content: string, roomId: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        return { error: "Unauthorized" };
    }

    // Check permission
    const hasPermission = await checkPermission(roomId, "editor");
    if (!hasPermission) {
        return { error: "You don't have permission to edit files" };
    }

    const { error } = await supabase
        .from("code_sessions")
        .update({
            code: content,
            updated_at: new Date().toISOString()
        })
        .eq("id", fileId);

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function formatCode(code: string, language: string) {
    try {
        const parserMap: Record<string, string> = {
            "javascript": "babel",
            "typescript": "typescript",
            "json": "json",
            "css": "css",
            "html": "html",
            // Python/Java/C++ are not supported by Prettier out of the box without plugins and server config.
            // We'll support standard web languages for now.
        };

        const parser = parserMap[language.toLowerCase()];
        if (!parser) return { formatted: code }; // Return original if not supported

        const formatted = await prettier.format(code, {
            parser,
            semi: true,
            singleQuote: false,
            trailingComma: "es5",
        });

        return { formatted };
    } catch (e) {
        console.error("Formatting error:", e);
        return { error: "Failed to format code" };
    }
}

export async function updateEditorSettings(settings: any) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase.auth.updateUser({
        data: { editor_settings: settings }
    });

    if (error) return { error: error.message };
    return { success: true };
}
