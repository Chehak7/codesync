# Remote terminal RCE remediation

## Decision: remove, not redesign

The browser-accessible terminal was removed entirely. A remote shell is not required for CodeSync's core real-time editing workflow, and safely operating one would require a separate sandboxed execution service rather than a small Socket.IO handler inside the Next.js process.

### Server-side removal

- Removed `node-pty` and the OS-shell selection logic from `server.ts`.
- Removed the global terminal map and every terminal Socket.IO event: `terminal-spawn`, `terminal-input`, `terminal-resize`, and `terminal-close`, together with the dynamic output/exit events.
- Removed all caller-controlled executable and working-directory handling.
- Removed the only path that copied the complete `process.env` into a client-controlled child process.
- Removed the global, caller-controlled terminal ID namespace. There are no PTYs to scope, limit, reattach, or clean up after disconnect.

The custom `server.ts` and its Socket.IO relay have now also been removed. Real-time editing is handled by the isolated, authenticated Yjs service described in `ARCHITECTURE.md`; it has no process-spawn, shell, PTY, filesystem-working-directory, or environment-forwarding capability.

### Client-side and dependency removal

- Deleted `components/terminal/TerminalManager.tsx` and `components/terminal/XTermTerminal.tsx`.
- Removed the Terminal tab and terminal component import from `components/layout/Panel.tsx`; Output is now the default panel tab.
- Removed `node-pty`, all `@xterm/*` packages, and the native PTY helper `postinstall` script from `package.json` and `package-lock.json`.

## Collaboration origin policy

Socket.IO was removed. The replacement WebSocket service requires an explicit allowlist read from the server-only `COLLABORATION_ALLOWED_ORIGINS` environment variable.

Set it to a comma-separated list of exact browser origins, for example:

```dotenv
COLLABORATION_ALLOWED_ORIGINS=https://codesync.example.com,https://staging.codesync.example.com
```

In production, the service fails at startup if the variable is missing, empty, or contains `*`. The HTTP upgrade is rejected when `Origin` is missing or not an exact allowlist entry. Origin filtering is followed by Supabase JWT verification and an explicit room-membership check; it is not treated as authentication.

`NEXT_PUBLIC_COLLABORATION_URL` is the browser-visible WSS endpoint; it is separate from the server-side list of frontend origins permitted to connect.

## Secret reachability review

The terminal removal closes the confirmed secret-exfiltration path: a client can no longer spawn a process, choose a command or working directory, write shell input, or inherit/read the server environment. A repository scan found no remaining `node-pty`, child-process, terminal-event, or `process.env`-forwarding code outside the historical findings in `AUDIT.md`. No environment files are tracked by Git; `.env*` is ignored.

The collaboration process reads the Supabase service-role key only to authenticate handshakes, authorize membership, and persist documents. It never stores secrets in a Y.Doc or awareness state. The only other server-only application secret reference found is `ANTHROPIC_API_KEY` in `app/actions/ai.ts`; it is passed directly to the server-side Anthropic SDK and is never returned or placed in a client bundle.

Clients can invoke the authenticated AI Server Actions and thereby cause server-side use of the Anthropic credential, but those actions now enforce per-user budgets and input limits. No Socket.IO event handlers remain.

## Verification

- `npm run build` passes for both Next.js and the standalone collaboration service.
- `npx tsc --noEmit` passes.
- `npm audit` and `npm audit --omit=dev` report zero vulnerabilities.
- Static searches confirm there are no remaining Socket.IO, terminal client/server, process-spawn, or full-environment-forwarding paths in application code.
