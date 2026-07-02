export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            rooms: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string | null
                    name: string
                    room_code: string
                    owner_id: string | null
                    is_public: boolean
                    max_participants: number | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string | null
                    name: string
                    room_code: string
                    owner_id?: string | null
                    is_public?: boolean
                    max_participants?: number | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string | null
                    name?: string
                    room_code?: string
                    owner_id?: string | null
                    is_public?: boolean
                    max_participants?: number | null
                }
            }
            room_members: {
                Row: {
                    id: string
                    room_id: string | null
                    user_id: string | null
                    joined_at: string
                    role: string | null
                }
                Insert: {
                    id?: string
                    room_id?: string | null
                    user_id?: string | null
                    joined_at?: string
                    role?: string | null
                }
                Update: {
                    id?: string
                    room_id?: string | null
                    user_id?: string | null
                    joined_at?: string
                    role?: string | null
                }
            }
            code_sessions: {
                Row: {
                    id: string
                    room_id: string | null
                    file_name: string
                    language: string | null
                    code: string | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    room_id?: string | null
                    file_name: string
                    language?: string | null
                    code?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    room_id?: string | null
                    file_name?: string
                    language?: string | null
                    code?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
            }
            chat_messages: {
                Row: {
                    id: string
                    room_id: string | null
                    user_id: string | null
                    message: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    room_id?: string | null
                    user_id?: string | null
                    message: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    room_id?: string | null
                    user_id?: string | null
                    message?: string
                    created_at?: string
                }
            }
            code_versions: {
                Row: {
                    id: string
                    code_session_id: string | null
                    code: string
                    user_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    code_session_id?: string | null
                    code: string
                    user_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    code_session_id?: string | null
                    code?: string
                    user_id?: string | null
                    created_at?: string
                }
            }
        }
    }
}
