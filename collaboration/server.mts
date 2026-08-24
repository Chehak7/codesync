import { createServer, type IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";

import { createClient, type User } from "@supabase/supabase-js";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const MESSAGE_QUERY_AWARENESS = 3;
const MESSAGE_PERSISTENCE = 4;
const MESSAGE_INITIALIZE_FILE = 5;
const PROTOCOL = "codesync-yjs-v1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Role = "owner" | "editor" | "viewer";
type PersistenceStatus = "pending" | "saved" | "error";

interface Connection {
  socket: WebSocket;
  user: User;
  role: Role;
  awarenessClientIds: Set<number>;
  connectedAt: number;
  reauthorizationTimer: NodeJS.Timeout;
  sessionRefreshTimer: NodeJS.Timeout;
  rateWindowStartedAt: number;
  rateWindowMessages: number;
  rateWindowBytes: number;
}

interface RoomState {
  id: string;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  files: Y.Map<boolean>;
  allowedFileIds: Set<string>;
  connections: Set<Connection>;
  dirty: boolean;
  changeClock: number;
  persisting: boolean;
  revision: number;
  savedAt: string | null;
  persistenceTimer: NodeJS.Timeout;
  cleanupTimer: NodeJS.Timeout | null;
}

function requiredEnv(name: string, fallbackName?: string): string {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function integerEnv(name: string, fallback: number, minimum: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw new Error(`${name} must be an integer greater than or equal to ${minimum}`);
  }
  return parsed;
}

function allowedOrigins(): Set<string> {
  const configured = process.env.COLLABORATION_ALLOWED_ORIGINS;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("COLLABORATION_ALLOWED_ORIGINS is required in production");
  }

  const values = (configured?.split(",") ?? ["http://localhost:3000", "http://127.0.0.1:3000"])
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.length === 0 || values.includes("*")) {
    throw new Error("COLLABORATION_ALLOWED_ORIGINS must contain exact origins and cannot contain '*'");
  }
  return new Set(values.map((value) => {
    const parsed = new URL(value);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(`Invalid collaboration origin: ${value}`);
    }
    return parsed.origin;
  }));
}

const config = {
  port: integerEnv("COLLABORATION_PORT", 1234, 1),
  persistIntervalMs: integerEnv("COLLABORATION_PERSIST_INTERVAL_MS", 5_000, 1_000),
  roomIdleMs: integerEnv("COLLABORATION_ROOM_IDLE_MS", 300_000, 10_000),
  maxConnectionsPerUser: integerEnv("COLLABORATION_MAX_CONNECTIONS_PER_USER", 5, 1),
  maxConnectionsPerRoom: integerEnv("COLLABORATION_MAX_CONNECTIONS_PER_ROOM", 50, 1),
  maxPayloadBytes: integerEnv("COLLABORATION_MAX_PAYLOAD_BYTES", 1_048_576, 1_024),
  maxDocumentBytes: integerEnv("COLLABORATION_MAX_DOCUMENT_BYTES", 5_242_880, 1_024),
  maxMessagesPerSecond: integerEnv("COLLABORATION_MAX_MESSAGES_PER_SECOND", 60, 1),
  maxBytesPerSecond: integerEnv("COLLABORATION_MAX_BYTES_PER_SECOND", 1_048_576, 1_024),
  allowedOrigins: allowedOrigins(),
};

class RateLimitError extends Error {}

const supabase = createClient(
  requiredEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const rooms = new Map<string, Promise<RoomState>>();
const userConnectionCounts = new Map<string, number>();

function fileText(doc: Y.Doc, fileId: string): Y.Text {
  return doc.getText(`file:${fileId}`);
}

function jwtExpiryMs(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1_000 : Date.now() + 15 * 60_000;
  } catch {
    return Date.now() + 15 * 60_000;
  }
}

function validateClientUpdate(room: RoomState, update: Uint8Array): void {
  const candidate = new Y.Doc();
  try {
    Y.applyUpdate(candidate, Y.encodeStateAsUpdate(room.doc));
    Y.applyUpdate(candidate, update);
    if (Y.encodeStateAsUpdate(candidate).byteLength > config.maxDocumentBytes) {
      throw new Error("The collaborative document exceeds its size limit");
    }

    let totalContentBytes = 0;
    for (const [name, sharedType] of candidate.share) {
      if (name === "file-initialized") {
        if (!(sharedType instanceof Y.Map)) throw new Error("Invalid file registry type");
        for (const [fileId, value] of sharedType.entries()) {
          if (!room.allowedFileIds.has(fileId) || value !== true) throw new Error("Invalid file registry entry");
        }
        for (const fileId of room.allowedFileIds) {
          if (sharedType.get(fileId) !== true) throw new Error("File registry entries cannot be removed by clients");
        }
        continue;
      }

      const match = /^file:([0-9a-f-]+)$/i.exec(name);
      if (!match || !room.allowedFileIds.has(match[1]) || !(sharedType instanceof Y.Text)) {
        throw new Error("Updates may only modify files in this room");
      }
      const contentBytes = Buffer.byteLength(sharedType.toString(), "utf8");
      if (contentBytes > 1_048_576) throw new Error("A file exceeds the 1 MiB limit");
      totalContentBytes += contentBytes;
    }
    if (totalContentBytes > config.maxDocumentBytes) throw new Error("Room content exceeds the size limit");
  } finally {
    candidate.destroy();
  }
}

function send(socket: WebSocket, bytes: Uint8Array): void {
  if (socket.readyState !== WebSocket.OPEN) return;
  if (socket.bufferedAmount > config.maxPayloadBytes * 2) {
    socket.terminate();
    return;
  }
  socket.send(bytes, { binary: true });
}

function encodePersistence(status: PersistenceStatus, room: RoomState, message?: string): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MESSAGE_PERSISTENCE);
  encoding.writeVarString(
    encoder,
    JSON.stringify({ status, revision: room.revision, savedAt: room.savedAt, message }),
  );
  return encoding.toUint8Array(encoder);
}

function broadcast(room: RoomState, bytes: Uint8Array): void {
  for (const connection of room.connections) send(connection.socket, bytes);
}

function broadcastPersistence(room: RoomState, status: PersistenceStatus, message?: string): void {
  broadcast(room, encodePersistence(status, room, message));
}

async function persistRoom(room: RoomState): Promise<void> {
  if (!room.dirty || room.persisting) return;
  room.persisting = true;
  const persistedClock = room.changeClock;

  try {
    const update = Y.encodeStateAsUpdate(room.doc);
    if (update.byteLength > config.maxDocumentBytes) {
      throw new Error("The collaborative document exceeds the configured size limit");
    }

    const files = [...room.files.keys()]
      .filter((id) => UUID_PATTERN.test(id))
      .map((id) => ({ id, content: fileText(room.doc, id).toString() }));

    const { data, error } = await supabase.rpc("persist_collaboration_document", {
      p_room_id: room.id,
      p_state_base64: Buffer.from(update).toString("base64"),
      p_state_bytes: update.byteLength,
      p_files: files,
    });
    if (error) throw error;

    room.revision = Number(data ?? room.revision + 1);
    room.savedAt = new Date().toISOString();
    if (room.changeClock === persistedClock) room.dirty = false;
    broadcastPersistence(room, room.dirty ? "pending" : "saved");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Persistence failed";
    console.error("collaboration persistence failed", { roomId: room.id, message });
    broadcastPersistence(room, "error", "The latest edits have not been saved yet");
  } finally {
    room.persisting = false;
  }
}

async function loadRoom(roomId: string): Promise<RoomState> {
  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  awareness.setLocalState(null);
  const files = doc.getMap<boolean>("file-initialized");
  let revision = 0;
  let savedAt: string | null = null;
  let dirty = false;

  const [{ data: snapshot, error: snapshotError }, { data: databaseFiles, error: filesError }] =
    await Promise.all([
      supabase
        .from("collaboration_documents")
        .select("state_base64, revision, updated_at")
        .eq("room_id", roomId)
        .maybeSingle(),
      supabase
        .from("code_sessions")
        .select("id, code")
        .eq("room_id", roomId)
        .eq("type", "file"),
    ]);

  if (snapshotError) throw snapshotError;
  if (filesError) throw filesError;
  if (snapshot?.state_base64) {
    const update = Buffer.from(snapshot.state_base64, "base64");
    if (update.byteLength > config.maxDocumentBytes) throw new Error("Persisted Y.Doc is too large");
    Y.applyUpdate(doc, update, "snapshot");
    revision = Number(snapshot.revision ?? 0);
    savedAt = snapshot.updated_at ?? null;
  }

  const databaseIds = new Set((databaseFiles ?? []).map((file) => file.id));
  doc.transact(() => {
    for (const file of databaseFiles ?? []) {
      if (!files.has(file.id)) {
        const text = fileText(doc, file.id);
        if (text.length === 0 && file.code) text.insert(0, file.code);
        files.set(file.id, true);
        dirty = true;
      }
    }
    for (const id of files.keys()) {
      if (!databaseIds.has(id)) {
        files.delete(id);
        dirty = true;
      }
    }
  }, "database-bootstrap");

  const room: RoomState = {
    id: roomId,
    doc,
    awareness,
    files,
    allowedFileIds: databaseIds,
    connections: new Set(),
    dirty: dirty || !snapshot,
    changeClock: 0,
    persisting: false,
    revision,
    savedAt,
    persistenceTimer: setInterval(() => void persistRoom(room), config.persistIntervalMs),
    cleanupTimer: null,
  };

  doc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === "snapshot" || origin === "database-bootstrap") return;
    room.dirty = true;
    room.changeClock += 1;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    broadcast(room, encoding.toUint8Array(encoder));
    broadcastPersistence(room, "pending");
  });

  awareness.on("update", (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => {
    const clients = added.concat(updated, removed) as number[];
    if (clients.length === 0) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, clients));
    const bytes = encoding.toUint8Array(encoder);
    for (const connection of room.connections) {
      if (connection !== origin) send(connection.socket, bytes);
    }
  });

  return room;
}

async function getRoom(roomId: string): Promise<RoomState> {
  let pending = rooms.get(roomId);
  if (!pending) {
    pending = loadRoom(roomId).catch((error) => {
      rooms.delete(roomId);
      throw error;
    });
    rooms.set(roomId, pending);
  }
  return pending;
}

function sanitizeAwareness(update: Uint8Array, connection: Connection): Uint8Array {
  const decoder = decoding.createDecoder(update);
  const count = decoding.readVarUint(decoder);
  const clientIds: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const clientId = decoding.readVarUint(decoder);
    decoding.readVarUint(decoder);
    decoding.readVarString(decoder);
    clientIds.push(clientId);
  }

  for (const clientId of clientIds) {
    if (!connection.awarenessClientIds.has(clientId) && connection.awarenessClientIds.size >= 1) {
      throw new Error("A connection may publish only one awareness identity");
    }
    connection.awarenessClientIds.add(clientId);
  }

  const displayName =
    connection.user.user_metadata?.full_name ??
    connection.user.user_metadata?.name ??
    "Collaborator";
  const color = `hsl(${[...connection.user.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360} 72% 55%)`;

  return awarenessProtocol.modifyAwarenessUpdate(update, (state: Record<string, unknown> | null) => {
    if (state === null) return null;
    const selection = state.selection;
    const activeFileId = typeof state.activeFileId === "string" && UUID_PATTERN.test(state.activeFileId)
      ? state.activeFileId
      : null;
    return {
      user: { id: connection.user.id, name: String(displayName).slice(0, 80), color },
      activeFileId,
      selection: JSON.stringify(selection).length <= 16_384 ? selection : null,
    };
  });
}

async function handleMessage(
  room: RoomState,
  connection: Connection,
  data: RawData,
  isBinary: boolean,
): Promise<void> {
  if (!isBinary) throw new Error("Only binary protocol messages are accepted");
  const now = Date.now();
  if (now - connection.rateWindowStartedAt >= 1_000) {
    connection.rateWindowStartedAt = now;
    connection.rateWindowMessages = 0;
    connection.rateWindowBytes = 0;
  }
  connection.rateWindowMessages += 1;
  connection.rateWindowBytes += data instanceof ArrayBuffer
    ? data.byteLength
    : Array.isArray(data)
      ? data.reduce((total, item) => total + item.byteLength, 0)
      : data.byteLength;
  if (
    connection.rateWindowMessages > config.maxMessagesPerSecond ||
    connection.rateWindowBytes > config.maxBytesPerSecond
  ) {
    throw new RateLimitError("Collaboration message rate exceeded");
  }
  const bytes = data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : Array.isArray(data)
      ? new Uint8Array(Buffer.concat(data))
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const decoder = decoding.createDecoder(bytes);
  const messageType = decoding.readVarUint(decoder);

  if (messageType === MESSAGE_SYNC) {
    const syncType = decoding.readVarUint(decoder);
    if (syncType === syncProtocol.messageYjsSyncStep1) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.readSyncStep1(decoder, encoder, room.doc);
      if (encoding.length(encoder) > 1) send(connection.socket, encoding.toUint8Array(encoder));
      return;
    }
    if (syncType === syncProtocol.messageYjsSyncStep2 || syncType === syncProtocol.messageYjsUpdate) {
      if (connection.role === "viewer") return;
      const update = decoding.readVarUint8Array(decoder);
      validateClientUpdate(room, update);
      Y.applyUpdate(room.doc, update, connection);
      return;
    }
    throw new Error("Unknown Yjs sync message");
  }

  if (messageType === MESSAGE_AWARENESS) {
    const update = decoding.readVarUint8Array(decoder);
    awarenessProtocol.applyAwarenessUpdate(room.awareness, sanitizeAwareness(update, connection), connection);
    return;
  }

  if (messageType === MESSAGE_QUERY_AWARENESS) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, [...room.awareness.getStates().keys()]),
    );
    send(connection.socket, encoding.toUint8Array(encoder));
    return;
  }

  if (messageType === MESSAGE_INITIALIZE_FILE) {
    if (connection.role === "viewer") return;
    const fileId = decoding.readVarString(decoder);
    if (!UUID_PATTERN.test(fileId)) throw new Error("Invalid file identifier");
    if (room.files.has(fileId)) return;

    const { data: databaseFile, error } = await supabase
      .from("code_sessions")
      .select("id, code")
      .eq("id", fileId)
      .eq("room_id", room.id)
      .eq("type", "file")
      .maybeSingle();
    if (error) throw error;
    if (!databaseFile || room.files.has(fileId)) return;

    room.allowedFileIds.add(fileId);
    room.doc.transact(() => {
      const text = fileText(room.doc, fileId);
      if (text.length === 0 && databaseFile.code) text.insert(0, databaseFile.code);
      room.files.set(fileId, true);
    }, connection);
    return;
  }

  throw new Error("Unknown collaboration message type");
}

function rejectUpgrade(socket: Duplex, status: number, message: string): void {
  const body = `${message}\n`;
  socket.write(
    `HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`,
  );
  socket.destroy();
}

function tokenFromProtocols(request: IncomingMessage): string | null {
  const values = request.headers["sec-websocket-protocol"]?.split(",").map((value) => value.trim()) ?? [];
  if (!values.includes(PROTOCOL)) return null;
  return values.find((value) => value.startsWith("supabase.jwt."))?.slice("supabase.jwt.".length) ?? null;
}

function roomIdFromRequest(request: IncomingMessage): string | null {
  const url = new URL(request.url ?? "/", "http://collaboration.invalid");
  const match = /^\/rooms\/([0-9a-f-]+)$/.exec(url.pathname);
  return match && UUID_PATTERN.test(match[1]) ? match[1] : null;
}

const websocketServer = new WebSocketServer({
  noServer: true,
  clientTracking: false,
  maxPayload: config.maxPayloadBytes,
  perMessageDeflate: false,
  handleProtocols: (protocols) => (protocols.has(PROTOCOL) ? PROTOCOL : false),
});

const httpServer = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  response.writeHead(404, { "content-type": "text/plain" });
  response.end("Not found\n");
});

httpServer.on("upgrade", (request, socket, head) => {
  void (async () => {
    const origin = request.headers.origin;
    if (!origin || !config.allowedOrigins.has(origin)) {
      rejectUpgrade(socket, 403, "Forbidden");
      return;
    }
    const roomId = roomIdFromRequest(request);
    if (!roomId) {
      rejectUpgrade(socket, 404, "Not Found");
      return;
    }
    const token = tokenFromProtocols(request);
    if (!token) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    const { data: membership, error: membershipError } = await supabase
      .from("room_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (membershipError || !membership || !["owner", "editor", "viewer"].includes(membership.role)) {
      rejectUpgrade(socket, 403, "Forbidden");
      return;
    }

    const userCount = userConnectionCounts.get(authData.user.id) ?? 0;
    if (userCount >= config.maxConnectionsPerUser) {
      rejectUpgrade(socket, 429, "Too Many Requests");
      return;
    }

    const room = await getRoom(roomId);
    if (room.connections.size >= config.maxConnectionsPerRoom) {
      rejectUpgrade(socket, 429, "Too Many Requests");
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      const connection: Connection = {
        socket: websocket,
        user: authData.user,
        role: membership.role as Role,
        awarenessClientIds: new Set(),
        connectedAt: Date.now(),
        reauthorizationTimer: setInterval(() => {
          void supabase
            .from("room_members")
            .select("role")
            .eq("room_id", roomId)
            .eq("user_id", authData.user.id)
            .maybeSingle()
            .then(({ data, error }) => {
              if (error) return;
              if (!data || !["owner", "editor", "viewer"].includes(data.role)) {
                websocket.close(4403, "Room membership was revoked");
                return;
              }
              connection.role = data.role as Role;
            });
        }, 60_000),
        sessionRefreshTimer: setTimeout(
          () => websocket.close(4001, "Refresh authentication"),
          Math.max(1_000, Math.min(jwtExpiryMs(token) - Date.now(), 15 * 60_000)),
        ),
        rateWindowStartedAt: Date.now(),
        rateWindowMessages: 0,
        rateWindowBytes: 0,
      };
      if (room.cleanupTimer) {
        clearTimeout(room.cleanupTimer);
        room.cleanupTimer = null;
      }
      room.connections.add(connection);
      userConnectionCounts.set(authData.user.id, userCount + 1);

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeSyncStep1(encoder, room.doc);
      send(websocket, encoding.toUint8Array(encoder));
      send(websocket, encodePersistence(room.dirty ? "pending" : "saved", room));

      const awarenessClients = [...room.awareness.getStates().keys()];
      if (awarenessClients.length > 0) {
        const awarenessEncoder = encoding.createEncoder();
        encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          awarenessEncoder,
          awarenessProtocol.encodeAwarenessUpdate(room.awareness, awarenessClients),
        );
        send(websocket, encoding.toUint8Array(awarenessEncoder));
      }

      websocket.on("message", (data, isBinary) => {
        void handleMessage(room, connection, data, isBinary).catch((error) => {
          const message = error instanceof Error ? error.message : "Malformed protocol message";
          console.warn("closing malformed collaboration connection", {
            roomId,
            userId: authData.user.id,
            message,
          });
          websocket.close(
            error instanceof RateLimitError ? 4429 : 4400,
            error instanceof RateLimitError ? "Collaboration rate limit exceeded" : "Malformed collaboration message",
          );
        });
      });
      websocket.on("error", (error) => {
        console.warn("collaboration socket error", { roomId, userId: authData.user.id, message: error.message });
      });
      websocket.on("close", () => {
        clearInterval(connection.reauthorizationTimer);
        clearTimeout(connection.sessionRefreshTimer);
        room.connections.delete(connection);
        awarenessProtocol.removeAwarenessStates(room.awareness, [...connection.awarenessClientIds], connection);
        const current = userConnectionCounts.get(authData.user.id) ?? 1;
        if (current <= 1) userConnectionCounts.delete(authData.user.id);
        else userConnectionCounts.set(authData.user.id, current - 1);

        if (room.connections.size === 0) {
          room.cleanupTimer = setTimeout(() => {
            if (room.connections.size > 0) return;
            void persistRoom(room).finally(() => {
              clearInterval(room.persistenceTimer);
              room.awareness.destroy();
              room.doc.destroy();
              rooms.delete(room.id);
            });
          }, config.roomIdleMs);
        }
      });
    });
  })().catch((error) => {
    console.error("collaboration upgrade failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    if (!socket.destroyed) rejectUpgrade(socket, 500, "Internal Server Error");
  });
});

const pingTimer = setInterval(() => {
  for (const pendingRoom of rooms.values()) {
    void pendingRoom.then((room) => {
      for (const connection of room.connections) connection.socket.ping();
    });
  }
}, 30_000);

async function shutdown(signal: string): Promise<void> {
  console.info("stopping collaboration service", { signal });
  clearInterval(pingTimer);
  httpServer.close();
  const activeRooms = await Promise.all(rooms.values());
  await Promise.all(activeRooms.map((room) => persistRoom(room)));
  for (const room of activeRooms) {
    clearInterval(room.persistenceTimer);
    if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
    for (const connection of room.connections) connection.socket.close(1012, "Service restarting");
    room.awareness.destroy();
    room.doc.destroy();
  }
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

httpServer.listen(config.port, () => {
  console.info("collaboration service listening", {
    port: config.port,
    allowedOrigins: [...config.allowedOrigins],
    persistenceIntervalMs: config.persistIntervalMs,
  });
});
