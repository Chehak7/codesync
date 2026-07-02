import { UserRole } from "@/actions/permissions-actions";

export interface DBFile {
    id: string;
    name: string;
    language: string;
    code: string;
    created_at: string;
}

export interface File {
    id: string;
    name: string;
    language: string;
    code: string;
    isDirty?: boolean;
}

export interface Message {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    user: {
        id: string;
        email?: string;
        avatar_url?: string;
    };
}

export interface RoomEditorProps {
    roomId: string;
    roomName?: string;
    initialFiles: DBFile[];
    currentUser: {
        id: string;
        email?: string;
        user_metadata?: {
            avatar_url?: string;
            editor_settings?: {
                fontSize?: number;
                minimap?: boolean;
                lineNumbers?: "on" | "off";
            };
        };
    };
    initialMessages: Message[];
    userRole: UserRole;
    roomCode: string;
}
