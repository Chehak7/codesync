# CodeSync collaboration architecture

## Overview

CodeSync uses one Yjs document per room and a dedicated authenticated WebSocket service. Next.js remains responsible for pages, Server Actions, and ordinary Supabase data access; it is not wrapped in a custom HTTP server.

```text
Monaco editor
    ↕ y-monaco
browser Y.Doc + awareness
    ↕ y-websocket protocol over authenticated WSS
collaboration/server.mts
    ↕ service-role RPC every 5 seconds while dirty
Supabase collaboration_documents + code_sessions projection
```

The service is intentionally separate from Next.js. It can be deployed, scaled, rate-limited, and monitored independently without reintroducing the former unauthenticated Socket.IO relay or making framework upgrades depend on a custom `server.ts`.

## Why Yjs

Yjs is a conflict-free replicated data type (CRDT). Concurrent insertions and deletions are represented as commutative updates, so replicas converge without last-write-wins overwrites or a central keystroke ordering API. This is the key distinction from the previous debounced Supabase save: two editors can work during a disconnect and merge their changes when connectivity returns.

The client uses:

- `Y.Doc` as the room replica;
- one `Y.Text` named `file:<file-uuid>` per file;
- `y-monaco`'s `MonacoBinding` to bind the active `Y.Text` directly to the Monaco model;
- Yjs awareness for ephemeral presence and cursor selections;
- `y-websocket` as the reconnecting client transport, with cross-tab BroadcastChannel transport disabled so every replica must pass server authentication.

There is no controlled-textarea or per-keystroke database save in the editor path.

## Authentication and authorization

The browser obtains its existing Supabase access token and opens:

```text
wss://<collaboration-host>/rooms/<room-uuid>
```

It offers two WebSocket subprotocols: the fixed `codesync-yjs-v1` protocol and `supabase.jwt.<access-token>`. The credential is not placed in the URL or query string. The service accepts an upgrade only after all of these checks succeed:

1. `Origin` exactly matches an entry in `COLLABORATION_ALLOWED_ORIGINS`; wildcard and missing origins are rejected.
2. The path contains a valid room UUID and the fixed protocol is offered.
3. `supabase.auth.getUser(token)` verifies the token with Supabase.
4. A service-role query confirms that the verified user has an `owner`, `editor`, or `viewer` row in `room_members` for that room.
5. Per-user and per-room connection limits have not been reached.

The service rechecks membership every minute and forces a token-refresh reconnect at least every 15 minutes. Owners and editors may submit document updates. Viewer updates are discarded server-side, regardless of client UI state. Awareness identity is rewritten from the verified Supabase user, preventing a client from impersonating another participant; only cursor/selection state and a valid active file id are accepted from the browser.

Client updates are applied to a temporary document first. The service rejects updates that create arbitrary shared types, refer to files outside the room, remove the authoritative file registry, exceed 1 MiB per file, or push the document past 5 MiB. WebSocket payloads, per-second message/byte rates, connections, and buffered outbound data are separately bounded.

The service-role key exists only in the collaboration process. It is never sent to Next.js client code, a Yjs document, awareness, logs, or a child process. The repository no longer has a browser-triggerable process-spawn/PTY path.

## Document layout and file lifecycle

`file-initialized`, a `Y.Map<boolean>`, records the room files represented by the document. On first room load the service:

1. applies the latest binary state from `collaboration_documents`, if present;
2. reads current `code_sessions` file rows;
3. initializes any missing `Y.Text` from the corresponding database content;
4. removes registry entries for files no longer present.

When an already-connected browser opens a newly created file, it sends only the file UUID. The service verifies that the file belongs to the room, reads its initial content itself, and initializes it once. The browser cannot supply a file id from another room or choose the initial database content.

## Durable persistence and save state

Yjs network synchronization and durable storage are deliberately separate states. While a room is dirty, the service snapshots it at `COLLABORATION_PERSIST_INTERVAL_MS` (5 seconds by default), not on every keystroke. The `persist_collaboration_document` service-only RPC commits both of these in one database transaction:

- the base64-encoded binary Yjs update, revision, byte count, and timestamp in `collaboration_documents`;
- the current plain-text projection for each file in `code_sessions.code`, preserving compatibility with version history, AI context, exports, and server-rendered initial data.

The RPC validates file UUIDs, counts, per-file sizes, total content size, and snapshot size. `collaboration_documents` has forced RLS and no `anon` or `authenticated` table privileges.

After each document update the service sends `pending`. It sends `saved` only after the atomic RPC succeeds and no newer update arrived during that write. Errors leave the room dirty and send `error`; the next interval retries. Consequently, the UI never marks a failed save clean. Empty strings are ordinary Yjs text states and are persisted, fixing the earlier bug where clearing a file was ignored.

## Disconnects and convergence

The browser keeps its `Y.Doc` alive when the WebSocket disconnects. Monaco continues writing local CRDT updates into that document, the status bar displays `Reconnecting — local edits buffered`, and the tab remains dirty. `y-websocket` reconnects with bounded exponential backoff. Its state-vector handshake exchanges only missing updates; Yjs merges offline and remote edits and each replica converges.

`Saved` means a collaboration-service persistence acknowledgement for the latest known document state. Network sync alone is never presented as durable storage. Permanent authentication, membership, and connection-limit failures stop reconnecting and are shown as collaboration errors.

## Running and deploying

Required server environment:

```dotenv
SUPABASE_URL=https://project.supabase.co
SUPABASE_SECRET_KEY=server-only-key
COLLABORATION_ALLOWED_ORIGINS=https://codesync.example.com
COLLABORATION_PORT=1234
```

Required browser environment:

```dotenv
NEXT_PUBLIC_COLLABORATION_URL=wss://collaboration.example.com
```

`SUPABASE_SERVICE_ROLE_KEY` is also accepted for projects still using the legacy server key. Never expose either credential through a `NEXT_PUBLIC_` variable.

`npm run dev` runs Next.js and the collaboration service together when a server credential is configured. Without one, it prints a warning and keeps Next.js running with collaboration disabled. `npm run dev:collaboration` remains strict and fails fast when configuration is incomplete. Production should run `npm start` and `npm run start:collaboration` as distinct processes/services and route WSS traffic directly to the latter. Deploy migration `20260819000600_collaboration_documents.sql` before starting the service.

The service is currently stateful: all connections for a room must reach the same instance. A multi-instance deployment therefore needs room-sticky routing, or a shared Yjs update/awareness backplane before horizontal scaling.

## Verification

`e2e/collaboration.spec.ts` creates two disposable authenticated users in the same room, opens two isolated Playwright browser contexts, verifies that clearing a file converges to an empty string and becomes durably saved, takes one context offline, edits from both contexts, reconnects, and asserts both Monaco/Yjs replicas converge and are acknowledged as saved. It requires service-role fixture credentials and refuses hosted Supabase projects unless `E2E_ALLOW_REMOTE_SUPABASE=true` is explicitly set.
