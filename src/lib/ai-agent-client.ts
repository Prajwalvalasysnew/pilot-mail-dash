// Client for the self-hosted Valasys AI Agent
// Talks to the FastAPI service described in the agent README (POST /chat,
// /chat/stream, /actions/{token}/confirm|cancel, /feedback, /faq/reload, /health).

export const AGENT_BASE_STORAGE = "vmp_agent_base";
export const AGENT_KEY_STORAGE = "vmp_agent_key";

const DEFAULT_AGENT_BASE = "http://localhost:8200";

export function getAgentBase(): string {
  if (typeof window !== "undefined") {
    const s = window.localStorage.getItem(AGENT_BASE_STORAGE);
    if (s) return s.replace(/\/$/, "");
  }
  const env = (import.meta as { env?: { VITE_AGENT_BASE_URL?: string } }).env?.VITE_AGENT_BASE_URL;
  return (env || DEFAULT_AGENT_BASE).replace(/\/$/, "");
}
export function setAgentBase(v: string | null) {
  if (typeof window === "undefined") return;
  if (v) window.localStorage.setItem(AGENT_BASE_STORAGE, v);
  else window.localStorage.removeItem(AGENT_BASE_STORAGE);
}
export function getAgentKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AGENT_KEY_STORAGE);
}
export function setAgentKey(v: string | null) {
  if (typeof window === "undefined") return;
  if (v) window.localStorage.setItem(AGENT_KEY_STORAGE, v);
  else window.localStorage.removeItem(AGENT_KEY_STORAGE);
}

function headers(extra?: Record<string, string>): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json", ...extra };
  const k = getAgentKey();
  if (k) h["X-API-Key"] = k;
  return h;
}

export interface AgentStep {
  tool: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}
export interface PendingConfirmation {
  token: string;
  to?: string;
  subject?: string;
  body?: string;
  prospect_id?: string;
  expires_at?: string;
}
export interface ChatResponse {
  reply: string;
  steps?: AgentStep[];
  conversation_id?: string;
  request_id?: string;
  pending_confirmation?: PendingConfirmation;
}

export async function chat(body: { message: string; conversation_id?: string }): Promise<ChatResponse> {
  const res = await fetch(`${getAgentBase()}/chat`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Agent error ${res.status}: ${await res.text()}`);
  return res.json();
}

export interface StreamHandlers {
  onStatus?: (s: { tool?: string; message?: string; [k: string]: unknown }) => void;
  onToken?: (text: string) => void;
  onStep?: (step: AgentStep) => void;
  onPending?: (p: PendingConfirmation) => void;
  onDone?: (final: Partial<ChatResponse>) => void;
  onError?: (err: string) => void;
}

/** Stream /chat/stream as SSE. Returns abort function. */
export function chatStream(body: { message: string; conversation_id?: string }, h: StreamHandlers): () => void {
  const ctrl = new AbortController();
  (async () => {
    try {
      const res = await fetch(`${getAgentBase()}/chat/stream`, {
        method: "POST", headers: headers({ Accept: "text/event-stream" }),
        body: JSON.stringify(body), signal: ctrl.signal,
      });
      if (!res.ok || !res.body) { h.onError?.(`Stream error ${res.status}`); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const raw = buf.slice(0, idx); buf = buf.slice(idx + 2);
          const lines = raw.split("\n");
          let event = "message"; let data = "";
          for (const ln of lines) {
            if (ln.startsWith("event:")) event = ln.slice(6).trim();
            else if (ln.startsWith("data:")) data += ln.slice(5).trim();
          }
          if (!data) continue;
          let parsed: unknown = data;
          try { parsed = JSON.parse(data); } catch { /* keep string */ }
          const p = parsed as Record<string, unknown>;
          if (event === "status") h.onStatus?.(p);
          else if (event === "token") h.onToken?.(typeof p === "string" ? (p as unknown as string) : String((p as { text?: string }).text ?? ""));
          else if (event === "step") h.onStep?.(p as AgentStep);
          else if (event === "pending" || event === "pending_confirmation") h.onPending?.(p as PendingConfirmation);
          else if (event === "done") h.onDone?.(p as Partial<ChatResponse>);
          else if (event === "error") h.onError?.(typeof p === "string" ? (p as unknown as string) : String((p as { message?: string }).message ?? "stream error"));
        }
      }
      h.onDone?.({});
    } catch (e) {
      if ((e as Error).name !== "AbortError") h.onError?.((e as Error).message);
    }
  })();
  return () => ctrl.abort();
}

export async function confirmAction(token: string) {
  const res = await fetch(`${getAgentBase()}/actions/${encodeURIComponent(token)}/confirm`, { method: "POST", headers: headers() });
  if (!res.ok) throw new Error(`Confirm failed (${res.status})`);
  return res.json();
}
export async function cancelAction(token: string) {
  const res = await fetch(`${getAgentBase()}/actions/${encodeURIComponent(token)}/cancel`, { method: "POST", headers: headers() });
  if (!res.ok) throw new Error(`Cancel failed (${res.status})`);
  return res.json();
}
export async function sendFeedback(body: { conversation_id: string; rating: 1 | -1; comment?: string }) {
  const res = await fetch(`${getAgentBase()}/feedback`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Feedback failed (${res.status})`);
  return res.json();
}
export async function reloadFaq() {
  const res = await fetch(`${getAgentBase()}/faq/reload`, { method: "POST", headers: headers() });
  if (!res.ok) throw new Error(`FAQ reload failed (${res.status})`);
  return res.json();
}
export interface AgentHealth {
  status: "ok" | "degraded" | "down" | string;
  backend?: string;
  components?: Record<string, string>;
  [k: string]: unknown;
}
export async function getAgentHealth(): Promise<AgentHealth> {
  const res = await fetch(`${getAgentBase()}/health`, { headers: headers() });
  if (!res.ok) throw new Error(`Health ${res.status}`);
  return res.json();
}
