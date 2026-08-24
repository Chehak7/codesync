# Archived SQL

These files are retained only as historical evidence of the manually assembled database state that existed on 2026-08-19.

They are not migrations, are not ordered, conflict with one another, and must never be executed against any environment. Several deliberately disable RLS, drop authentication triggers, expose tenant data, or contain one-off production identifiers.

Only SQL files directly under `supabase/migrations/` are deployable. The canonical schema and security model are documented in `/DATABASE.md`.
