// Centralized API client for V-Mail Pilot
// Reads base URL from VITE_API_BASE_URL, attaches Bearer token from localStorage.

export const API_KEY_STORAGE = "vmp_api_key";
export const API_BASE_STORAGE = "vmp_api_base";

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(API_BASE_STORAGE);
    if (stored) return stored.replace(/\/$/, "");
  }
  const env = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return (env || "http://localhost:3000").replace(/\/$/, "");
}

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(API_KEY_STORAGE);
}

export function setApiKey(key: string | null) {
  if (typeof window === "undefined") return;
  if (key) window.localStorage.setItem(API_KEY_STORAGE, key);
  else window.localStorage.removeItem(API_KEY_STORAGE);
}

export function setApiBase(base: string | null) {
  if (typeof window === "undefined") return;
  if (base) window.localStorage.setItem(API_BASE_STORAGE, base);
  else window.localStorage.removeItem(API_BASE_STORAGE);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = "GET", body, auth = true, query, signal } = opts;
  const base = getApiBase();
  const url = new URL(base + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const key = getApiKey();
    if (key) headers["Authorization"] = `Bearer ${key}`;
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    throw new ApiError(`Network error: ${(e as Error).message}`, 0, null);
  }
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    const msg = (data as any)?.error || (data as any)?.message || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

// ===== Typed endpoints =====

export interface HealthResponse { status: string; ts: string }
export const getHealth = () => apiRequest<HealthResponse>("/health", { auth: false });

export interface SignupResponse {
  customer: { id: string; email: string; tier: string; daily_quota: number };
  api_key: string;
  note: string;
}
export const signup = (body: { email: string; name: string }) =>
  apiRequest<SignupResponse>("/v1/signup", { method: "POST", body, auth: false });

export interface QuotaResponse {
  daily: { used: number; limit: number; remaining: number; pct: number };
  monthly: { used: number; limit: number; remaining: number; pct: number };
}
export const getQuota = () => apiRequest<QuotaResponse>("/v1/usage/quota");

export interface UsageDay { usage_date: string; sent: number; delivered: number; bounced: number; complained: number }
export interface UsageResponse { daily: UsageDay[] }
export const getUsage = () => apiRequest<UsageResponse>("/v1/usage");

export interface SendEmailBody {
  from: string; from_name?: string; to: string; reply_to?: string;
  subject: string; html?: string; text?: string;
  tags?: string[]; metadata?: Record<string, string>;
  tracking?: { opens?: boolean; clicks?: boolean };
  ip_pool?: string;
}
export interface SendEmailResponse {
  accepted: number; rejected: number; message_ids: string[]; suppressed: string[];
}
export const sendEmail = (body: SendEmailBody) =>
  apiRequest<SendEmailResponse>("/v1/send", { method: "POST", body });

export interface Message {
  message_id: string; to?: string; subject?: string;
  status: string; attempts: number;
  tags?: string[]; created_at?: string; last_event?: string;
}
export interface MessagesResponse { messages: Message[]; total?: number }
export const listMessages = (params?: { limit?: number; offset?: number; status?: string; tag?: string; to?: string }) =>
  apiRequest<MessagesResponse>("/v1/messages", { query: params });

export interface MessageEvent {
  event_type: string; occurred_at: string;
  payload?: Record<string, unknown>; ip?: string; user_agent?: string;
}
export interface MessageDetailResponse { message: Message; events: MessageEvent[] }
export const getMessage = (messageId: string) =>
  apiRequest<MessageDetailResponse>(`/v1/messages/${encodeURIComponent(messageId)}`);

export interface Domain {
  id: string; domain: string; verified?: boolean;
  status?: string; created_at?: string;
  dns_records?: DnsRecord[];
  verification?: { ownership: boolean; spf: boolean; dkim: boolean; dmarc: boolean };
}
export interface DnsRecord {
  type: string; host: string; value: string; purpose?: string; status?: string;
}
export interface DomainsResponse { domains: Domain[] }
export const listDomains = () => apiRequest<DomainsResponse>("/v1/domains");
export const createDomain = (domain: string) =>
  apiRequest<Domain>("/v1/domains", { method: "POST", body: { domain } });
export const verifyDomain = (id: string) =>
  apiRequest<{ id: string; results: Record<string, boolean>; verified: boolean }>(
    `/v1/domains/${encodeURIComponent(id)}/verify`, { method: "POST" });
export const deleteDomain = (id: string) =>
  apiRequest<void>(`/v1/domains/${encodeURIComponent(id)}`, { method: "DELETE" });

export interface Suppression {
  email: string; reason: string; notes?: string; created_at?: string;
}
export interface SuppressionsResponse { suppressions: Suppression[] }
export const listSuppressions = (params?: { reason?: string; email?: string }) =>
  apiRequest<SuppressionsResponse>("/v1/suppressions", { query: params });
export const addSuppression = (body: { email: string; reason: string; notes?: string }) =>
  apiRequest<Suppression>("/v1/suppressions", { method: "POST", body });
export const deleteSuppression = (email: string) =>
  apiRequest<void>(`/v1/suppressions/${encodeURIComponent(email)}`, { method: "DELETE" });

export interface Webhook {
  id: string; url: string; events: string[]; secret?: string; enabled: boolean;
  created_at?: string;
}
export interface WebhooksResponse { webhooks: Webhook[] }
export const listWebhooks = () => apiRequest<WebhooksResponse>("/v1/webhooks");
export const createWebhook = (body: { url: string; events: string[] }) =>
  apiRequest<Webhook>("/v1/webhooks", { method: "POST", body });
export const deleteWebhook = (id: string) =>
  apiRequest<void>(`/v1/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" });

export interface AdminApiKeyResponse {
  id: string; name: string; api_key: string; scopes: string[];
}
export const createAdminApiKey = (body: {
  customer_id: string; admin_token: string; name: string; scopes: string[];
}) => apiRequest<AdminApiKeyResponse>("/v1/admin/api-keys", { method: "POST", body, auth: false });
