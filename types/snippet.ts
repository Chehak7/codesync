export interface SnippetVariable {
    name: string;
    default: string;
    placeholder: string;
}

export interface Snippet {
    id: string;
    title: string;
    description: string | null;
    language: string;
    category: string | null;
    code: string;
    variables: SnippetVariable[];
    shortcuts: string | null;
    author_id: string;
    is_public: boolean;
    usage_count: number;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
}

export type CreateSnippetInput = Omit<Snippet, "id" | "author_id" | "usage_count" | "created_at" | "updated_at">;
export type UpdateSnippetInput = Partial<CreateSnippetInput>;
