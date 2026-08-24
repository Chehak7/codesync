const hasServerCredential = Boolean(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
);

if (!hasServerCredential) {
  console.warn([
    "Collaboration service disabled: no server-only Supabase credential is configured.",
    "Add SUPABASE_SECRET_KEY (preferred) or SUPABASE_SERVICE_ROLE_KEY to .env.local,",
    "then restart npm run dev. Next.js will continue without real-time collaboration.",
  ].join("\n"));
} else {
  await import("../collaboration/server.mts");
}
