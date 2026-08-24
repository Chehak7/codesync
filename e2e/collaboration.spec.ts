import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const runAgainstRemote = process.env.E2E_ALLOW_REMOTE_SUPABASE === "true";
const password = "Playwright-collaboration-93!";

let admin: SupabaseClient;
let roomId: string;
let ownerId: string;
let editorId: string;
let ownerEmail: string;
let editorEmail: string;
let ownerContext: BrowserContext;
let editorContext: BrowserContext;

async function login(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Verify Identity" }).click();
  await page.waitForURL(/\/rooms/);
}

async function editorContent(page: Page): Promise<string> {
  return (await page.getByTestId("editor-content").getAttribute("data-content")) ?? "";
}

async function waitForContent(page: Page, expected: string): Promise<void> {
  await expect.poll(() => editorContent(page), { timeout: 15_000 }).toBe(expected);
}

test.beforeAll(async () => {
  test.skip(!supabaseUrl || !serviceRoleKey, "Supabase service-role test credentials are required");
  const hostname = new URL(supabaseUrl!).hostname;
  test.skip(
    hostname !== "localhost" && hostname !== "127.0.0.1" && !runAgainstRemote,
    "Set E2E_ALLOW_REMOTE_SUPABASE=true to create isolated test fixtures in a hosted project",
  );

  admin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  ownerEmail = `collab-owner-${suffix}@example.test`;
  editorEmail = `collab-editor-${suffix}@example.test`;

  const [ownerResult, editorResult] = await Promise.all([
    admin.auth.admin.createUser({ email: ownerEmail, password, email_confirm: true }),
    admin.auth.admin.createUser({ email: editorEmail, password, email_confirm: true }),
  ]);
  if (ownerResult.error || !ownerResult.data.user) throw ownerResult.error ?? new Error("Owner setup failed");
  if (editorResult.error || !editorResult.data.user) throw editorResult.error ?? new Error("Editor setup failed");
  ownerId = ownerResult.data.user.id;
  editorId = editorResult.data.user.id;

  const { error: profileError } = await admin.from("profiles").upsert([
    { id: ownerId, display_name: "Collaboration Owner" },
    { id: editorId, display_name: "Collaboration Editor" },
  ]);
  if (profileError) throw profileError;

  const { data: room, error: roomError } = await admin
    .from("rooms")
    .insert({
      name: "Playwright collaboration",
      room_code: `E2E${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
      owner_id: ownerId,
      is_public: false,
    })
    .select("id")
    .single();
  if (roomError || !room) throw roomError ?? new Error("Room setup failed");
  roomId = room.id;

  const { error: membershipError } = await admin.from("room_members").upsert([
    { room_id: roomId, user_id: ownerId, role: "owner" },
    { room_id: roomId, user_id: editorId, role: "editor" },
  ], { onConflict: "room_id,user_id" });
  if (membershipError) throw membershipError;

  const { error: fileError } = await admin.from("code_sessions").insert({
    room_id: roomId,
    name: "convergence.ts",
    type: "file",
    language: "typescript",
    code: "seed",
  });
  if (fileError) throw fileError;
});

test.afterAll(async () => {
  await Promise.allSettled([ownerContext?.close(), editorContext?.close()]);
  if (admin && roomId) await admin.from("rooms").delete().eq("id", roomId);
  if (admin && ownerId) await admin.auth.admin.deleteUser(ownerId);
  if (admin && editorId) await admin.auth.admin.deleteUser(editorId);
});

test("two authenticated editors merge concurrent edits and converge", async ({ browser }) => {
  ownerContext = await browser.newContext();
  editorContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const editorPage = await editorContext.newPage();

  await Promise.all([login(ownerPage, ownerEmail), login(editorPage, editorEmail)]);
  await Promise.all([ownerPage.goto(`/room/${roomId}`), editorPage.goto(`/room/${roomId}`)]);

  const ownerStatus = ownerPage.getByTestId("collaboration-status");
  const editorStatus = editorPage.getByTestId("collaboration-status");
  await expect(ownerStatus).toHaveAttribute("data-state", "saved", { timeout: 20_000 });
  await expect(editorStatus).toHaveAttribute("data-state", "saved", { timeout: 20_000 });
  await Promise.all([waitForContent(ownerPage, "seed"), waitForContent(editorPage, "seed")]);

  const ownerInput = ownerPage.locator(".monaco-editor textarea.inputarea");
  const editorInput = editorPage.locator(".monaco-editor textarea.inputarea");
  await ownerInput.focus();
  await ownerPage.keyboard.press("ControlOrMeta+A");
  await ownerPage.keyboard.press("Backspace");
  await Promise.all([waitForContent(ownerPage, ""), waitForContent(editorPage, "")]);
  await expect(ownerStatus).toHaveAttribute("data-state", "saved", { timeout: 20_000 });
  await expect(editorStatus).toHaveAttribute("data-state", "saved", { timeout: 20_000 });

  await ownerContext.setOffline(true);
  await expect(ownerStatus).toHaveAttribute("data-state", "reconnecting", { timeout: 15_000 });
  await Promise.all([ownerInput.focus(), editorInput.focus()]);
  await Promise.all([
    ownerPage.keyboard.insertText("alpha"),
    editorPage.keyboard.insertText("beta"),
  ]);
  await expect.poll(() => editorContent(ownerPage)).toContain("alpha");
  await ownerContext.setOffline(false);

  await expect.poll(async () => {
    const [ownerContent, editorContentValue] = await Promise.all([
      editorContent(ownerPage),
      editorContent(editorPage),
    ]);
    return ownerContent === editorContentValue && ownerContent.includes("alpha") && ownerContent.includes("beta");
  }, { timeout: 20_000 }).toBe(true);
  await expect(ownerStatus).toHaveAttribute("data-state", "saved", { timeout: 20_000 });
  await expect(editorStatus).toHaveAttribute("data-state", "saved", { timeout: 20_000 });
});
