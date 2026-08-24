# Dependency and AI Server Action remediation

Remediation date: 2026-08-19

## Audit result

The original lockfile produced 12 production findings from `npm audit --omit=dev`: 8 high, 3 moderate, and 1 low.

After the upgrades and lockfile refresh:

```text
info: 0
low: 0
moderate: 0
high: 0
critical: 0
total: 0
```

Both `npm audit` and `npm audit --omit=dev` now report zero vulnerabilities.

## Dependency changes

| Package | Before | Resolved | Reason |
|---|---:|---:|---|
| `next` | 16.1.6 | 16.3.1 | Current patched stable release for the affected Next.js 16 ranges |
| `eslint-config-next` | 16.1.6 | 16.3.1 | Keeps framework lint rules aligned with Next.js |
| `react` / `react-dom` | 19.0.0 | 19.2.8 | Aligns the React runtime with the current Next.js release |
| `@types/react` | 18.3.27 | 19.2.18 | Removes the React 18/19 runtime-type mismatch |
| `@types/react-dom` | 18.3.7 | 19.2.4 | Removes the React DOM 18/19 runtime-type mismatch |
| `@anthropic-ai/sdk` | 0.71.2 | 0.118.0 | Current SDK with supported model/API typings |
| direct `ws` | 8.19.0 | 8.21.3 | Fixes memory disclosure and memory-exhaustion advisories |
| `socket.io` / `socket.io-client` | 4.8.3 | removed | The unauthenticated relay was replaced by the authenticated Yjs WebSocket service |
| `engine.io` stack | vulnerable transitives | removed | No Engine.IO transport remains in the application graph |
| `postcss` / `nanoid` | vulnerable transitives | 8.5.23 / 3.3.18 | Removes source-map disclosure and generator-loop findings |
| `sharp` | vulnerable `<0.35.0` | 0.35.3 | Removes inherited libvips findings |
| `body-parser` / `qs` | vulnerable transitives | 2.3.0 / 6.15.3 | Removes request parsing denial-of-service findings |
| `dompurify` | 3.4.8 through Monaco | override to 3.4.14 | Removes the remaining sanitizer findings while Monaco pins an older patch |
| `eslint` | 9.19.0 | 9.39.5 | Removes the development-only plugin-kit ReDoS chain |

`.npmrc` was deleted, removing `legacy-peer-deps=true`. The final dependency installation succeeds with normal npm peer resolution and the React 19 type packages dedupe across the tree.

## Advisories resolved

### Next.js 16.1.6 to 16.3.1

The upgrade moves beyond all vulnerable Next.js ranges reported by the original audit, including:

- Proxy/authentication bypass: [GHSA-6gpp-xcg3-4w24](https://github.com/advisories/GHSA-6gpp-xcg3-4w24) / CVE-2026-64642, [GHSA-26hh-7cqf-hhc6](https://github.com/advisories/GHSA-26hh-7cqf-hhc6), [GHSA-267c-6grr-h53f](https://github.com/advisories/GHSA-267c-6grr-h53f), [GHSA-492v-c6pp-mqqv](https://github.com/advisories/GHSA-492v-c6pp-mqqv), and [GHSA-36qx-fr4f-26g5](https://github.com/advisories/GHSA-36qx-fr4f-26g5).
- Server Action/Component resource exhaustion: [GHSA-m99w-x7hq-7vfj](https://github.com/advisories/GHSA-m99w-x7hq-7vfj) / CVE-2026-64641, [GHSA-q4gf-8mx6-v5v3](https://github.com/advisories/GHSA-q4gf-8mx6-v5v3), [GHSA-8h8q-6873-q5fj](https://github.com/advisories/GHSA-8h8q-6873-q5fj), [GHSA-4c39-4ccg-62r3](https://github.com/advisories/GHSA-4c39-4ccg-62r3), and [GHSA-mg66-mrh9-m8jx](https://github.com/advisories/GHSA-mg66-mrh9-m8jx).
- SSRF: [GHSA-89xv-2m56-2m9x](https://github.com/advisories/GHSA-89xv-2m56-2m9x) / CVE-2026-64649, [GHSA-c4j6-fc7j-m34r](https://github.com/advisories/GHSA-c4j6-fc7j-m34r), and [GHSA-p9j2-gv94-2wf4](https://github.com/advisories/GHSA-p9j2-gv94-2wf4).
- Request/cache handling: [GHSA-ggv3-7p47-pfv8](https://github.com/advisories/GHSA-ggv3-7p47-pfv8), [GHSA-68g3-v927-f742](https://github.com/advisories/GHSA-68g3-v927-f742), [GHSA-4633-3j49-mh5q](https://github.com/advisories/GHSA-4633-3j49-mh5q), [GHSA-wfc6-r584-vfw7](https://github.com/advisories/GHSA-wfc6-r584-vfw7), [GHSA-3g8h-86w9-wvmq](https://github.com/advisories/GHSA-3g8h-86w9-wvmq), and [GHSA-vfv6-92ff-j949](https://github.com/advisories/GHSA-vfv6-92ff-j949).
- CSRF/XSS and endpoint disclosure: [GHSA-mq59-m269-xvcx](https://github.com/advisories/GHSA-mq59-m269-xvcx), [GHSA-jcc7-9wpm-mj36](https://github.com/advisories/GHSA-jcc7-9wpm-mj36), [GHSA-ffhc-5mcf-pf4q](https://github.com/advisories/GHSA-ffhc-5mcf-pf4q), [GHSA-gx5p-jg67-6x7h](https://github.com/advisories/GHSA-gx5p-jg67-6x7h), and [GHSA-955p-x3mx-jcvp](https://github.com/advisories/GHSA-955p-x3mx-jcvp).
- Image/cache storage exhaustion: [GHSA-3x4c-7xq6-9pq8](https://github.com/advisories/GHSA-3x4c-7xq6-9pq8), [GHSA-h27x-g6w4-24gq](https://github.com/advisories/GHSA-h27x-g6w4-24gq), [GHSA-h64f-5h5j-jqjh](https://github.com/advisories/GHSA-h64f-5h5j-jqjh), and [GHSA-q8wf-6r8g-63ch](https://github.com/advisories/GHSA-q8wf-6r8g-63ch).

The refreshed Next.js dependency graph also resolves the audited PostCSS advisories [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp), and [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849), plus Sharp/libvips [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj).

### WebSocket and former Socket.IO stack

- `ws` 8.21.3 resolves uninitialized-memory disclosure [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx) / CVE-2026-45736 and fragment/chunk memory exhaustion [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) / CVE-2026-48779.
- The Engine.IO and Socket.IO packages that previously carried [GHSA-r635-g3xr-vw7x](https://github.com/advisories/GHSA-r635-g3xr-vw7x), [GHSA-677m-j7p3-52f9](https://github.com/advisories/GHSA-677m-j7p3-52f9), and [GHSA-2m8v-j782-fhvr](https://github.com/advisories/GHSA-2m8v-j782-fhvr) were subsequently removed entirely.

### Other audited transitives

- Nano ID generator loops: [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) and [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8).
- Request parser denial of service: Body Parser [GHSA-v422-hmwv-36x6](https://github.com/advisories/GHSA-v422-hmwv-36x6), `path-to-regexp` [GHSA-j3q9-mxjg-w52f](https://github.com/advisories/GHSA-j3q9-mxjg-w52f) and [GHSA-27v5-c462-wpq7](https://github.com/advisories/GHSA-27v5-c462-wpq7), and `qs` [GHSA-w7fw-mjwx-w883](https://github.com/advisories/GHSA-w7fw-mjwx-w883) and [GHSA-q8mj-m7cp-5q26](https://github.com/advisories/GHSA-q8mj-m7cp-5q26).
- DOMPurify sanitizer bypass/state pollution: [GHSA-c2j3-45gr-mqc4](https://github.com/advisories/GHSA-c2j3-45gr-mqc4), [GHSA-cmwh-pvxp-8882](https://github.com/advisories/GHSA-cmwh-pvxp-8882), [GHSA-vxr8-fq34-vvx9](https://github.com/advisories/GHSA-vxr8-fq34-vvx9), and [GHSA-55q2-fjhq-7xh7](https://github.com/advisories/GHSA-55q2-fjhq-7xh7).

## AI Server Action hardening

Both exported actions now authenticate with `supabase.auth.getUser()` before inspecting or processing caller input. Unauthenticated requests receive `Authentication required` and never reach Anthropic.

Runtime input limits are enforced even when TypeScript and the UI are bypassed:

| Input | Maximum |
|---|---:|
| Completion prompt | 8,000 characters |
| Completion context | 32,000 characters |
| Inline prefix | 24,000 characters |
| Inline suffix | 12,000 characters |
| Language identifier | 64 restricted characters |

Migration `20260819000500_ai_usage_budget.sql` adds an RLS-protected `ai_usage_events` table and `reserve_ai_usage()` function. The function derives the user from `auth.uid()`, serializes concurrent reservations per user with a transaction advisory lock, and atomically enforces:

- 5 requests per rolling minute;
- 50 requests per rolling day;
- 250,000 submitted input characters per rolling day.

Clients have no direct INSERT permission. A quota-database error fails closed, so an unavailable budget store cannot turn into unlimited Anthropic usage. Reservations happen before the external API call, preventing failed-request floods from bypassing the budget.

Prompt, context, prefix, suffix, code, email, API responses, and exception messages are never logged. Logs contain only action name, status/reason, model, character/token counts, duration, and an error class/code. Anthropic calls also have a 30-second timeout.

## Anthropic model changes

- `claude-3-5-sonnet-20241022` was replaced with Anthropic's documented successor `claude-sonnet-4-6`.
- `claude-3-5-haiku-20241022` was replaced with `claude-haiku-4-5-20251001`.

Anthropic lists both 3.5 IDs as retired and states that requests to retired models fail. See [Anthropic model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations) and [model IDs and versioning](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions).

## Required deployment order

Apply `supabase/migrations/20260819000500_ai_usage_budget.sql` before deploying the updated Server Actions. Until the RPC exists, AI requests intentionally fail closed with a temporary-unavailable response.
