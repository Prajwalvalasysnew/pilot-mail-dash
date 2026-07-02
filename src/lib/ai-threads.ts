import type { AgentStep, PendingConfirmation } from "./ai-agent-client";

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  steps?: AgentStep[];
  pending?: PendingConfirmation;
  feedback?: 1 | -1;
  ts: number;
}
export interface Thread {
  id: string;
  title: string;
  conversationId?: string;
  updatedAt: number;
  messages: ThreadMessage[];
}

const KEY = "vmp_ai_threads_v1";

export function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Thread[];
    return arr.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}
export function saveThreads(threads: Thread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(threads));
}
export function upsertThread(t: Thread) {
  const all = loadThreads().filter((x) => x.id !== t.id);
  all.unshift({ ...t, updatedAt: Date.now() });
  saveThreads(all);
}
export function deleteThread(id: string) {
  saveThreads(loadThreads().filter((t) => t.id !== id));
}
export function newThread(title = "New conversation"): Thread {
  return { id: crypto.randomUUID(), title, updatedAt: Date.now(), messages: [] };
}
export function deriveTitle(firstUserText: string) {
  const t = firstUserText.trim().replace(/\s+/g, " ");
  return t.length > 48 ? t.slice(0, 45) + "…" : t || "New conversation";
}
