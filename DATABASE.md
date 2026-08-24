# CodeSync database

## Source of truth

Only the timestamped files directly under `supabase/migrations/` define the deployable database:

1. `20260819000100_canonical_schema.sql` — tables, constraints, data-preserving profile/email migration, and indexes.
2. `20260819000200_database_functions.sql` — authorization helpers, transactional room/join/invitation RPCs, and maintenance triggers.
3. `20260819000300_row_level_security.sql` — grants and the complete RLS policy set.
4. `20260819000400_storage_and_realtime.sql` — private room-scoped storage and idempotent Realtime publication membership.
5. `20260819000500_ai_usage_budget.sql` — private per-user AI usage accounting and atomic request budgets.
6. `20260819000600_collaboration_documents.sql` — durable Y.Doc snapshots and the atomic snapshot/file-projection persistence RPC.

Everything under `supabase/archive/` is historical, contradictory, and non-deployable. Never run archived SQL.

## Live-state determination

The production project `lauyhfbidncsfwixslec` was inspected read-only through the authenticated Supabase dashboard and public GraphQL metadata on 2026-08-19. No migration was executed against it during this work.

The live migration ledger was empty, confirming that the database had been assembled manually rather than through an ordered migration chain. The live public schema had nine empty tables:

- `profiles(id, email, avatar_url, updated_at)`
- `rooms(id, name, room_code, owner_id, is_public, created_at, updated_at)`
- `room_members(id, room_id, user_id, role, joined_at)`
- `messages(id, room_id, user_id, content, created_at, updated_at, deleted_at)`
- `code_sessions(id, room_id, name, language, code, created_at, updated_at, type, parent_id)`
- `code_versions(id, room_id, code_session_id, user_id, code, message, created_at)`
- `execution_history(id, user_id, room_id, language, code, stdin, stdout, stderr, exit_code, execution_time, created_at)`
- `execution_rate_limits(id, user_id, executed_at)`
- `snippets(id, title, description, language, category, code, variables, shortcuts, author_id, is_public, usage_count, tags, created_at, updated_at)`

RLS was enabled on rooms, memberships, messages, files, and versions. It was disabled on `profiles`, `snippets`, `execution_history`, and `execution_rate_limits`, even though policy objects existed. The `project-files` bucket was private but had three policies allowing every authenticated user to upload/read objects without a room check. No public-schema data triggers were attached. The dashboard exposed multiple manually created helper functions, and the migration ledger contained no record of them.

The canonical migrations preserve and normalize the confirmed tables, add the two relations required for private identity and invitations, replace all application policies, and remove obsolete helpers.

## Canonical tables

| Table | Purpose | Read rule | Write rule |
|---|---|---|---|
| `profiles` | Public display identity: `display_name`, avatar | Authenticated users | Self updates display fields |
| `private_profiles` | Private email identity | Self only | Auth trigger only |
| `rooms` | Collaboration room metadata and join code | Members; authenticated users may discover public rooms | Primary owner updates/deletes; creation only through `create_room()` |
| `room_members` | User-to-room role | Members of that room | No direct INSERT; owners assign editor/viewer to non-primary members; non-owner members may leave |
| `room_invitations` | Expiring editor/viewer invitations | Room owners and the specifically invited user | Creation through `create_room_invitation()`; owners may revoke |
| `code_sessions` | Room file/folder tree and current contents | Any room member | Owner/editor only |
| `code_versions` | Immutable file snapshots | Any room member | Owner/editor creates their own snapshot; owner deletes |
| `messages` | Room chat with soft deletion | Any room member | Owner/editor authors; owners may moderate |
| `execution_history` | Code-execution record scoped to a room | Any room member | Owner/editor records their own execution |
| `execution_rate_limits` | Per-user execution timestamps | Self only | Self only |
| `snippets` | Personal or published snippets | Author or any authenticated user when public | Author only |
| `ai_usage_events` | Per-user AI request and input budget | Self only | Only through `reserve_ai_usage()` |
| `collaboration_documents` | Binary room-level Y.Doc snapshots | Service role only | Only through `persist_collaboration_document()` |

Foreign keys ensure that a file version's file belongs to the same room and that a file's parent folder belongs to the same room. Membership roles are exactly `owner`, `editor`, or `viewer`; legacy `member` values are migrated to `editor`.

## Membership boundary

Authenticated clients have neither an INSERT grant nor an INSERT policy on `room_members`.

- `create_room(name, is_public)` creates the room and primary-owner membership atomically.
- `join_room(p_code => ...)` proves possession of a private room code and grants `editor`; a public room's visible code grants only `viewer`.
- `join_room(p_room_id => ...)` verifies the room is public and grants `viewer`.
- `join_room(p_invitation_token => ...)` locks and validates an unused, unexpired invitation, verifies its optional target user, applies its stored editor/viewer role, and marks it accepted.
- `create_room_invitation(...)` is executable only by an authenticated room owner and never permits the `owner` role.

All RPCs derive the user from `auth.uid()`; callers cannot supply a membership user id or role. Security-definer helpers use an empty `search_path`, are not executable by `anon`, and expose only boolean/role results needed by RLS.

## Profile privacy

`profiles.email` is copied into `private_profiles` and then dropped. Existing and new client joins use only `profiles(id, display_name, avatar_url)`. A user can select only their own `private_profiles` row. The canonical auth trigger maintains both public display identity and private email identity without swallowing database errors.

The current user's email remains available through their own Supabase Auth session; it is never exposed through public profile joins.

## Storage

`project-files` remains a private bucket with a 5 MiB object limit. Every object key must use this form:

```text
<room-uuid>/<file-name-or-subpath>
```

The first path segment is parsed as the owning room id. Room members may read objects; only owners/editors may insert, update, or delete them. Missing, malformed, or unauthorized room prefixes fail RLS. The migration removes every existing `storage.objects` policy tied to `project-files` before creating the four canonical policies.

## Applying the migrations

Back up the database first. The production migration ledger is currently empty, so review all six migrations as a baseline adoption before the first push.

```bash
supabase link --project-ref lauyhfbidncsfwixslec
supabase db push --dry-run
supabase db push
```

The migrations are forward-only and preserve the confirmed live table data. Applying them will intentionally remove `profiles.email`, replace all application RLS policies/grants, remove obsolete database helpers, replace project-file storage policies, and add service-only Yjs persistence. Application code in this repository already uses the new RPCs and display-profile fields.

## RLS integration test

`supabase/tests/rls.test.mjs` uses the anonymous client for owner/editor/viewer/non-member requests and a service client only to create and clean up disposable auth users. It verifies every canonical table plus Storage, including direct-membership denial, private email isolation, AI usage isolation/reservation, and role-specific file/message/storage writes.

Run it against local Supabase or an isolated staging project after applying the migrations:

```bash
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_ANON_KEY=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run test:rls
```

The test refuses remote targets unless `RLS_TEST_ALLOW_REMOTE=true` is explicitly set. Do not run destructive fixture tests against production.
