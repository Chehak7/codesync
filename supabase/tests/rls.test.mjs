import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

assert(supabaseUrl, "SUPABASE_URL is required");
assert(anonKey, "SUPABASE_ANON_KEY is required");
assert(serviceRoleKey, "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required");

const target = new URL(supabaseUrl);
const isLocal = ["localhost", "127.0.0.1"].includes(target.hostname);

assert(
  isLocal || process.env.RLS_TEST_ALLOW_REMOTE === "true",
  "Refusing to create test users on a remote project. Set RLS_TEST_ALLOW_REMOTE=true for an isolated staging project.",
);

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = crypto.randomUUID();
const password = `Rls-${crypto.randomUUID()}-aA1!`;
const users = {};
const clients = {};
let room;
let publicRoom;
let storagePath;

async function succeed(label, operation) {
  const result = await operation;
  assert.equal(result.error, null, `${label}: ${result.error?.message ?? "failed"}`);
  return result.data;
}

async function deniedMutation(label, operation) {
  const result = await operation;
  const rows = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
  assert(
    result.error || rows.length === 0,
    `${label}: mutation unexpectedly affected a row`,
  );
}

async function noRows(label, operation) {
  const result = await operation;
  assert.equal(result.error, null, `${label}: ${result.error?.message ?? "query failed"}`);
  assert.equal(result.data?.length ?? 0, 0, `${label}: protected rows were visible`);
}

async function deniedRead(label, operation) {
  const result = await operation;
  assert(
    result.error || (result.data?.length ?? 0) === 0,
    `${label}: protected rows were visible`,
  );
}

async function createTestUser(roleName) {
  const email = `codesync-rls-${roleName}-${runId}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `RLS ${roleName}` },
  });
  assert.equal(error, null, `${roleName} user creation failed: ${error?.message}`);
  users[roleName] = data.user;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  assert.equal(signInError, null, `${roleName} sign-in failed: ${signInError?.message}`);
  clients[roleName] = client;
}

try {
  for (const roleName of ["owner", "editor", "viewer", "outsider"]) {
    await createTestUser(roleName);
  }

  const createdRoom = await succeed(
    "owner creates room atomically",
    clients.owner.rpc("create_room", { p_name: `RLS ${runId}`, p_is_public: false }),
  );
  room = Array.isArray(createdRoom) ? createdRoom[0] : createdRoom;
  assert(room?.id && room?.room_code, "create_room did not return a room");

  await succeed(
    "editor joins with room code",
    clients.editor.rpc("join_room", { p_code: room.room_code }),
  );

  const invitationToken = await succeed(
    "owner creates viewer invitation",
    clients.owner.rpc("create_room_invitation", {
      p_room_id: room.id,
      p_role: "viewer",
      p_invited_user_id: users.viewer.id,
    }),
  );
  await succeed(
    "viewer joins with invitation",
    clients.viewer.rpc("join_room", { p_invitation_token: invitationToken }),
  );

  await deniedMutation(
    "direct membership insert is denied",
    clients.outsider
      .from("room_members")
      .insert({ room_id: room.id, user_id: users.outsider.id, role: "owner" })
      .select("id"),
  );

  const publicCreated = await succeed(
    "owner creates public room",
    clients.owner.rpc("create_room", { p_name: `Public ${runId}`, p_is_public: true }),
  );
  publicRoom = Array.isArray(publicCreated) ? publicCreated[0] : publicCreated;
  await succeed(
    "public room eligibility grants viewer membership",
    clients.outsider.rpc("join_room", { p_room_id: publicRoom.id }),
  );
  await succeed(
    "public room code cannot elevate viewer membership",
    clients.outsider.rpc("join_room", { p_code: publicRoom.room_code }),
  );
  const publicRole = await succeed(
    "public membership remains viewer",
    clients.outsider
      .from("room_members")
      .select("role")
      .eq("room_id", publicRoom.id)
      .eq("user_id", users.outsider.id)
      .single(),
  );
  assert.equal(publicRole.role, "viewer", "public room code elevated the viewer role");

  await noRows(
    "non-member cannot read private room",
    clients.outsider.from("rooms").select("id").eq("id", room.id),
  );
  await noRows(
    "non-member cannot read room membership",
    clients.outsider.from("room_members").select("id").eq("room_id", room.id),
  );
  await succeed(
    "member can read room membership",
    clients.viewer.from("room_members").select("id").eq("room_id", room.id).limit(1),
  );

  const ownerProfile = await succeed(
    "public display profile is readable",
    clients.outsider.from("profiles").select("id, display_name, avatar_url").eq("id", users.owner.id),
  );
  assert.equal(ownerProfile.length, 1, "display profile was not readable");
  const leakedEmail = await clients.outsider.from("profiles").select("email").eq("id", users.owner.id);
  assert(leakedEmail.error, "profiles.email still exists or is selectable");
  await noRows(
    "private email is self-only",
    clients.outsider.from("private_profiles").select("email").eq("id", users.owner.id),
  );
  const ownPrivateProfile = await succeed(
    "user can read own private email",
    clients.owner.from("private_profiles").select("email").eq("id", users.owner.id),
  );
  assert.equal(ownPrivateProfile.length, 1, "owner could not read private identity");

  const files = await succeed(
    "editor creates file",
    clients.editor
      .from("code_sessions")
      .insert({ room_id: room.id, name: "rls-test.ts", type: "file", language: "typescript", code: "export {};" })
      .select("*")
      .single(),
  );
  await succeed(
    "viewer reads file",
    clients.viewer.from("code_sessions").select("id").eq("id", files.id),
  );
  await noRows(
    "non-member cannot read file",
    clients.outsider.from("code_sessions").select("id").eq("id", files.id),
  );
  await deniedMutation(
    "viewer cannot update file",
    clients.viewer.from("code_sessions").update({ code: "denied" }).eq("id", files.id).select("id"),
  );

  const collaborationRevision = await succeed(
    "service persists collaboration document",
    admin.rpc("persist_collaboration_document", {
      p_room_id: room.id,
      p_state_base64: "AAA=",
      p_state_bytes: 2,
      p_files: [{ id: files.id, content: "export {};" }],
    }),
  );
  assert(Number(collaborationRevision) >= 1, "collaboration persistence did not return a revision");
  await deniedRead(
    "member cannot read service-only Y.Doc snapshot",
    clients.editor.from("collaboration_documents").select("room_id").eq("room_id", room.id),
  );
  await deniedRead(
    "non-member cannot read service-only Y.Doc snapshot",
    clients.outsider.from("collaboration_documents").select("room_id").eq("room_id", room.id),
  );

  const version = await succeed(
    "editor creates version",
    clients.editor
      .from("code_versions")
      .insert({ room_id: room.id, code_session_id: files.id, user_id: users.editor.id, code: "export {};" })
      .select("id")
      .single(),
  );
  await succeed(
    "viewer reads version",
    clients.viewer.from("code_versions").select("id").eq("id", version.id),
  );
  await noRows(
    "non-member cannot read version",
    clients.outsider.from("code_versions").select("id").eq("id", version.id),
  );

  const message = await succeed(
    "editor sends message",
    clients.editor
      .from("messages")
      .insert({ room_id: room.id, user_id: users.editor.id, content: "RLS test" })
      .select("id")
      .single(),
  );
  await succeed(
    "viewer reads message",
    clients.viewer.from("messages").select("id").eq("id", message.id),
  );
  await noRows(
    "non-member cannot read message",
    clients.outsider.from("messages").select("id").eq("id", message.id),
  );
  await deniedMutation(
    "viewer cannot send message",
    clients.viewer
      .from("messages")
      .insert({ room_id: room.id, user_id: users.viewer.id, content: "denied" })
      .select("id"),
  );

  const history = await succeed(
    "editor records execution history",
    clients.editor
      .from("execution_history")
      .insert({ room_id: room.id, user_id: users.editor.id, language: "typescript", code: "export {};" })
      .select("id")
      .single(),
  );
  await succeed(
    "viewer reads room execution history",
    clients.viewer.from("execution_history").select("id").eq("id", history.id),
  );
  await noRows(
    "non-member cannot read execution history",
    clients.outsider.from("execution_history").select("id").eq("id", history.id),
  );

  const rateLimit = await succeed(
    "user writes own rate-limit record",
    clients.editor.from("execution_rate_limits").insert({ user_id: users.editor.id }).select("id").single(),
  );
  await noRows(
    "other user cannot read rate-limit record",
    clients.viewer.from("execution_rate_limits").select("id").eq("id", rateLimit.id),
  );

  const aiReservation = await succeed(
    "user atomically reserves AI usage",
    clients.editor.rpc("reserve_ai_usage", { p_action: "completion", p_input_chars: 100 }),
  );
  assert.equal(aiReservation[0]?.allowed, true, "AI usage reservation was unexpectedly denied");
  await succeed(
    "user can read own AI usage",
    clients.editor.from("ai_usage_events").select("id").limit(1),
  );
  await noRows(
    "other user cannot read AI usage",
    clients.viewer.from("ai_usage_events").select("id").eq("user_id", users.editor.id),
  );
  await deniedMutation(
    "direct AI usage insert is denied",
    clients.editor
      .from("ai_usage_events")
      .insert({ user_id: users.editor.id, action: "completion", input_chars: 1 })
      .select("id"),
  );

  const snippet = await succeed(
    "author creates private snippet",
    clients.editor
      .from("snippets")
      .insert({ title: "RLS test", language: "typescript", code: "export {};", author_id: users.editor.id })
      .select("id")
      .single(),
  );
  await noRows(
    "other user cannot read private snippet",
    clients.owner.from("snippets").select("id").eq("id", snippet.id),
  );

  await noRows(
    "non-participant cannot read invitation",
    clients.outsider.from("room_invitations").select("id").eq("room_id", room.id),
  );
  await succeed(
    "owner can read invitation",
    clients.owner.from("room_invitations").select("id").eq("room_id", room.id).limit(1),
  );

  storagePath = `${room.id}/${runId}.txt`;
  await succeed(
    "editor uploads room file",
    clients.editor.storage.from("project-files").upload(storagePath, new Blob(["RLS test"], { type: "text/plain" })),
  );
  await succeed(
    "viewer downloads room file",
    clients.viewer.storage.from("project-files").download(storagePath),
  );
  const outsiderDownload = await clients.outsider.storage.from("project-files").download(storagePath);
  assert(outsiderDownload.error, "non-member downloaded a room file");
  const viewerUpload = await clients.viewer.storage
    .from("project-files")
    .upload(`${room.id}/${runId}-denied.txt`, new Blob(["denied"], { type: "text/plain" }));
  assert(viewerUpload.error, "viewer uploaded a room file");

  console.log("RLS integration test passed");
} finally {
  if (storagePath) {
    await admin.storage.from("project-files").remove([storagePath]);
  }
  for (const roleName of ["outsider", "viewer", "editor", "owner"]) {
    if (users[roleName]?.id) {
      await admin.auth.admin.deleteUser(users[roleName].id);
    }
  }
}
