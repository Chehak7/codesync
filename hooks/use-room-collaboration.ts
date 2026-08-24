"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { WebsocketProvider } from "y-websocket";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

const MESSAGE_PERSISTENCE = 4;
const MESSAGE_INITIALIZE_FILE = 5;
const PROTOCOL = "codesync-yjs-v1";

export type CollaborationState =
  | "connecting"
  | "reconnecting"
  | "syncing"
  | "saving"
  | "saved"
  | "save-error"
  | "auth-error";

export interface CollaborationParticipant {
  id: string;
  name: string;
  color: string;
  activeFileId: string | null;
}

interface UseRoomCollaborationOptions {
  roomId: string;
  userId: string;
  displayName: string;
  activeFileId: string | null;
  canWrite: boolean;
}

interface PersistenceMessage {
  status: "pending" | "saved" | "error";
  revision?: number;
  savedAt?: string | null;
  message?: string;
}

function collaborationUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_COLLABORATION_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return "ws://localhost:1234";
  return null;
}

function colorForUser(userId: string): string {
  const hue = [...userId].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360;
  return `hsl(${hue} 72% 55%)`;
}

export function useRoomCollaboration({
  roomId,
  userId,
  displayName,
  activeFileId,
  canWrite,
}: UseRoomCollaborationOptions) {
  const [doc] = useState(() => new Y.Doc());
  const [awareness] = useState(() => new Awareness(doc));
  const [supabase] = useState(() => createClient());
  const initializedFiles = useMemo(() => doc.getMap<boolean>("file-initialized"), [doc]);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const [durability, setDurability] = useState<"pending" | "saved" | "error">("pending");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<CollaborationParticipant[]>([]);
  const [initializedVersion, setInitializedVersion] = useState(0);
  const lifecycleGeneration = useRef(0);

  useEffect(() => {
    const updateParticipants = () => {
      const next = new Map<string, CollaborationParticipant>();
      for (const state of awareness.getStates().values()) {
        const user = state.user as { id?: unknown; name?: unknown; color?: unknown } | undefined;
        if (!user || typeof user.id !== "string") continue;
        next.set(user.id, {
          id: user.id,
          name: typeof user.name === "string" ? user.name : "Collaborator",
          color: typeof user.color === "string" ? user.color : colorForUser(user.id),
          activeFileId: typeof state.activeFileId === "string" ? state.activeFileId : null,
        });
      }
      setParticipants([...next.values()]);
    };
    awareness.on("change", updateParticipants);
    updateParticipants();
    return () => awareness.off("change", updateParticipants);
  }, [awareness]);

  useEffect(() => {
    awareness.setLocalStateField("user", {
      id: userId,
      name: displayName,
      color: colorForUser(userId),
    });
    awareness.setLocalStateField("activeFileId", activeFileId);
  }, [activeFileId, awareness, displayName, userId]);

  useEffect(() => {
    const observer = () => setInitializedVersion((value) => value + 1);
    initializedFiles.observe(observer);
    return () => initializedFiles.unobserve(observer);
  }, [initializedFiles]);

  useEffect(() => {
    const onDocumentUpdate = (_update: Uint8Array, origin: unknown) => {
      if (origin !== provider) {
        setHasUnsavedChanges(true);
        setDurability("pending");
      }
    };
    doc.on("update", onDocumentUpdate);
    return () => doc.off("update", onDocumentUpdate);
  }, [doc, provider]);

  useEffect(() => {
    const handleOffline = () => setConnected(false);
    const handleOnline = () => {
      if (provider && !provider.wsconnected) provider.connect();
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [provider]);

  useEffect(() => {
    let cancelled = false;
    let activeProvider: WebsocketProvider | null = null;
    const url = collaborationUrl();
    if (!url) {
      setAuthError("The collaboration service URL is not configured");
      return;
    }

    void supabase.auth.getSession().then(({
      data,
      error,
    }: { data: { session: Session | null }; error: Error | null }) => {
      if (cancelled) return;
      const accessToken = data.session?.access_token;
      if (error || !accessToken) {
        setAuthError("Sign in again to use real-time collaboration");
        return;
      }

      const nextProvider = new WebsocketProvider(url, `rooms/${roomId}`, doc, {
        awareness,
        connect: false,
        disableBc: true,
        maxBackoffTime: 10_000,
        protocols: [PROTOCOL, `supabase.jwt.${accessToken}`],
      });
      activeProvider = nextProvider;
      nextProvider.messageHandlers[MESSAGE_PERSISTENCE] = (_encoder, decoder) => {
        try {
          const message = JSON.parse(decoding.readVarString(decoder)) as PersistenceMessage;
          if (message.status === "saved") {
            setDurability("saved");
            setHasUnsavedChanges(false);
          } else if (message.status === "error") {
            setDurability("error");
            setHasUnsavedChanges(true);
          } else {
            setDurability("pending");
            setHasUnsavedChanges(true);
          }
        } catch {
          setDurability("error");
          setHasUnsavedChanges(true);
        }
      };
      nextProvider.on("status", ({ status }) => {
        const isConnected = status === "connected";
        setConnected(isConnected);
        if (isConnected) setHasConnected(true);
      });
      nextProvider.on("sync", (isSynced) => setSynced(isSynced));
      nextProvider.on("closed", ({ code, reason }) => {
        if (code === 4401 || code === 4403 || code === 4429) {
          setAuthError(reason || "Collaboration access was denied");
        }
      });
      setProvider(nextProvider);
      nextProvider.connect();
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent,
      session: Session | null,
    ) => {
      const accessToken = session?.access_token;
      if (!activeProvider || !accessToken) return;
      const protocol = `supabase.jwt.${accessToken}`;
      if (activeProvider.protocols[1] !== protocol) {
        activeProvider.protocols = [PROTOCOL, protocol];
        activeProvider.disconnect();
        activeProvider.connect();
      }
    });

    return () => {
      cancelled = true;
      authSubscription.subscription.unsubscribe();
      activeProvider?.destroy();
      setProvider(null);
      setConnected(false);
      setSynced(false);
    };
  }, [awareness, doc, roomId, supabase]);

  useEffect(() => {
    lifecycleGeneration.current += 1;
    const generation = lifecycleGeneration.current;
    return () => {
      queueMicrotask(() => {
        if (lifecycleGeneration.current === generation) {
          awareness.destroy();
          doc.destroy();
        }
      });
    };
  }, [awareness, doc]);

  const requestFile = useCallback(
    (fileId: string) => {
      if (!canWrite || !provider?.ws || provider.ws.readyState !== WebSocket.OPEN) return;
      if (initializedFiles.has(fileId)) return;
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_INITIALIZE_FILE);
      encoding.writeVarString(encoder, fileId);
      provider.ws.send(encoding.toUint8Array(encoder));
    },
    [canWrite, initializedFiles, provider],
  );

  useEffect(() => {
    if (synced && activeFileId && !initializedFiles.has(activeFileId)) requestFile(activeFileId);
  }, [activeFileId, initializedFiles, initializedVersion, requestFile, synced]);

  const getText = useCallback((fileId: string) => doc.getText(`file:${fileId}`), [doc]);
  const activeText = activeFileId && initializedFiles.has(activeFileId) ? getText(activeFileId) : null;

  let state: CollaborationState;
  if (authError) state = "auth-error";
  else if (!connected) state = hasConnected ? "reconnecting" : "connecting";
  else if (!synced || (activeFileId !== null && activeText === null)) state = "syncing";
  else if (durability === "error") state = "save-error";
  else if (hasUnsavedChanges || durability === "pending") state = "saving";
  else state = "saved";

  return {
    doc,
    awareness,
    activeText,
    getText,
    requestFile,
    state,
    connected,
    synced,
    hasUnsavedChanges,
    participants,
    error: authError,
  };
}
