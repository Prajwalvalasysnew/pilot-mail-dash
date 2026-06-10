// Centralized API client for V-Mail Pilot
// Matches the public REST API spec under https://api.mailplatform.example/v1
// All paths include the /v1 prefix; /health is unversioned.

export const API_KEY_STORAGE = "vmp_api_key";
export const API_BASE_STORAGE = "vmp_api_base";

const DEFAULT_BASE = "https://api.mailplatform.example";

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(API_BASE_STORAGE);
    if (stored) return stored.replace(/\/$/, "");
  }
  const env = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL;
  return (env || DEFAULT_BASE).replace(/\/$/, "");
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
  code?: string;
  constructor(message: string, status: number, data: unknown, code?: string) {
    super(message);
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, unknown> | object;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Return raw Response (e.g. for CSV downloads). */
  raw?: boolean;
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = "GET", body, auth = true, query, signal, headers: extraHeaders, raw } = opts;
  const base = getApiBase();
  const url = new URL(base + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json", ...extraHeaders };
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
  if (raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    const errObj = (data as { error?: { message?: string; code?: string } | string; message?: string }) || {};
    const errBlock = typeof errObj.error === "object" ? errObj.error : undefined;
    const msg = errBlock?.message || (typeof errObj.error === "string" ? errObj.error : undefined) || errObj.message || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data, errBlock?.code);
  }
  return data as T;
}

// ───────────── Health ─────────────
export interface HealthResponse { status: string }
export const getHealth = () => apiRequest<HealthResponse>("/health", { auth: false });

// ───────────── Auth / Account ─────────────
export interface Customer {
  id: string;
  email: string;
  name?: string;
  physical_address?: string | null;
  tier: string;
  daily_quota: number;
  monthly_quota?: number;
  billing_status?: string;
  status?: string;
  created_at?: string;
}
export interface SignupResponse {
  customer: Pick<Customer, "id" | "email" | "tier" | "daily_quota">;
  api_key: string;
  note: string;
}
export const signup = (body: { email: string; name: string }) =>
  apiRequest<SignupResponse>("/v1/signup", { method: "POST", body, auth: false });

export const getProfile = () => apiRequest<{ customer: Customer }>("/v1/profile");
export const updateProfile = (body: { name?: string; physical_address?: string | null }) =>
  apiRequest<{ ok: true }>("/v1/profile", { method: "PATCH", body });

// API keys
export type ApiKeyScope = "send" | "domains" | "suppressions" | "messages" | "templates" | "webhooks";
export interface ApiKey {
  id: string;
  name: string;
  scopes: ApiKeyScope[];
  expires_at?: string | null;
  created_at: string;
  last_used_at?: string | null;
  prefix?: string;
}
export interface ApiKeyCreated extends ApiKey { key: string; note: string }
export const listApiKeys = () => apiRequest<{ api_keys: ApiKey[] }>("/v1/account/api-keys");
export const createApiKey = (body: { name: string; scopes: ApiKeyScope[]; expires_at?: string }) =>
  apiRequest<ApiKeyCreated>("/v1/account/api-keys", { method: "POST", body });
export const rotateApiKey = (id: string) =>
  apiRequest<{ id: string; key: string; note: string }>(
    `/v1/account/api-keys/${encodeURIComponent(id)}/rotate`, { method: "POST" });
export const deleteApiKey = (id: string) =>
  apiRequest<void>(`/v1/account/api-keys/${encodeURIComponent(id)}`, { method: "DELETE" });

// ───────────── Sending ─────────────
export interface SendEmailBody {
  from: string;
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  reply_to?: string;
  from_name?: string;
  template_id?: string;
  variables?: Record<string, unknown>;
  tags?: string[];
  tracking_opens?: boolean;
  tracking_clicks?: boolean;
  unsubscribe_group_id?: string;
  headers?: Record<string, string>;
  metadata?: Record<string, string>;
  ip_pool?: string;
}
export interface SendResult { index: number; accepted: boolean; message_id?: string; reason?: string }
export interface SendEmailResponse {
  accepted: number;
  rejected: number;
  message_ids: string[];
  results: SendResult[];
}
export const sendEmail = (body: SendEmailBody, opts?: { idempotencyKey?: string }) =>
  apiRequest<SendEmailResponse>("/v1/send", {
    method: "POST", body,
    headers: opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined,
  });

export const sendBatch = (messages: SendEmailBody[], opts?: { idempotencyKey?: string }) =>
  apiRequest<SendEmailResponse>("/v1/send/batch", {
    method: "POST", body: { messages },
    headers: opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : undefined,
  });

// ───────────── Messages ─────────────
export type MessageStatus =
  | "queued" | "sending" | "accepted" | "delivered"
  | "soft_bounced" | "hard_bounced" | "failed"
  | "opened" | "clicked" | "complained";

export interface Message {
  message_id: string;
  from_address?: string;
  to_address?: string;
  subject?: string;
  status: string;
  tags?: string[];
  attempts?: number;
  queued_at?: string;
  accepted_at?: string;
  delivered_at?: string;
  opened_at?: string | null;
  human_opened_at?: string | null;
  first_clicked_at?: string | null;
  smtp_response?: string;
  metadata?: Record<string, unknown>;

  // UI conveniences (mirrors of the above)
  to?: string;
  from?: string;
  created_at?: string;
  last_event?: string;
}

function normalizeMessage(m: Message): Message {
  return {
    ...m,
    to: m.to ?? m.to_address,
    from: m.from ?? m.from_address,
    created_at: m.created_at ?? m.queued_at,
    last_event:
      m.last_event ??
      m.first_clicked_at ?? m.opened_at ?? m.delivered_at ?? m.accepted_at ?? m.queued_at ?? undefined,
    attempts: m.attempts ?? 1,
  };
}

export interface MessagesResponse {
  messages: Message[];
  next_cursor?: string | null;
}
export interface ListMessagesParams {
  limit?: number;
  cursor?: string;
  status?: string;
  to?: string;
  from_address?: string;
  tag?: string;
  subject_contains?: string;
  since?: string;
  until?: string;
}
export const listMessages = async (params?: ListMessagesParams) => {
  const data = await apiRequest<MessagesResponse>("/v1/messages", { query: params });
  return { ...data, messages: (data.messages ?? []).map(normalizeMessage) };
};

export interface MessageEvent {
  event_type: string;
  occurred_at: string;
  payload?: Record<string, unknown>;
  ip?: string;
  user_agent?: string;
}
export interface MessageDetailResponse { message: Message; events: MessageEvent[] }
export const getMessage = async (messageId: string) => {
  const data = await apiRequest<MessageDetailResponse>(`/v1/messages/${encodeURIComponent(messageId)}`);
  return { ...data, message: normalizeMessage(data.message) };
};

// ───────────── Domains ─────────────
export type DomainStatus = "pending" | "verified" | "failed";
export interface DnsRecord {
  type: string; host: string; value: string;
  purpose?: string; status?: string;
}
export interface Domain {
  id: string;
  domain: string;
  status: DomainStatus;
  dmarc_policy?: string;
  created_at?: string;
  dns_records?: DnsRecord[];
  // Backwards-compat helper for UI:
  verified?: boolean;
  verification?: { ownership: boolean; spf: boolean; dkim: boolean; dmarc?: boolean };
}
function normalizeDomain(d: Domain): Domain {
  return { ...d, verified: d.verified ?? d.status === "verified" };
}
export const listDomains = async () => {
  const data = await apiRequest<{ domains: Domain[] }>("/v1/domains");
  return { domains: (data.domains ?? []).map(normalizeDomain) };
};
export const createDomain = async (domain: string) => {
  const data = await apiRequest<{ domain: Domain }>("/v1/domains", { method: "POST", body: { domain } });
  return normalizeDomain(data.domain);
};
export const getDomain = async (id: string) => {
  const data = await apiRequest<{ domain: Domain }>(`/v1/domains/${encodeURIComponent(id)}`);
  return normalizeDomain(data.domain);
};
export interface VerifyDomainResponse {
  status: DomainStatus;
  checks: { ownership: boolean; spf: boolean; dkim: boolean; dmarc?: boolean };
  verified?: boolean;
}
export const verifyDomain = async (id: string) => {
  const data = await apiRequest<VerifyDomainResponse>(
    `/v1/domains/${encodeURIComponent(id)}/verify`, { method: "POST" });
  return { ...data, verified: data.status === "verified" };
};
export const deleteDomain = (id: string) =>
  apiRequest<void>(`/v1/domains/${encodeURIComponent(id)}`, { method: "DELETE" });

// ───────────── Templates ─────────────
export interface Template {
  id: string;
  name: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  created_at?: string;
  updated_at?: string;
}
export const listTemplates = () => apiRequest<{ templates: Template[] }>("/v1/templates");
export const createTemplate = (body: { name: string; subject: string; html_body?: string; text_body?: string }) =>
  apiRequest<{ template: Template }>("/v1/templates", { method: "POST", body });
export const getTemplate = (id: string) =>
  apiRequest<{ template: Template }>(`/v1/templates/${encodeURIComponent(id)}`);
export const updateTemplate = (id: string, body: Partial<Omit<Template, "id" | "created_at" | "updated_at">>) =>
  apiRequest<{ template: Template }>(`/v1/templates/${encodeURIComponent(id)}`, { method: "PATCH", body });
export const deleteTemplate = (id: string) =>
  apiRequest<void>(`/v1/templates/${encodeURIComponent(id)}`, { method: "DELETE" });

// ───────────── Suppressions ─────────────
export type SuppressionReason = "hard_bounce" | "complaint" | "unsubscribe" | "manual" | "invalid";
export interface Suppression {
  email: string;
  reason: string;
  notes?: string | null;
  created_at?: string;
}
export interface SuppressionsResponse { suppressions: Suppression[] }
export interface ListSuppressionsParams { limit?: number; offset?: number; reason?: string }
export const listSuppressions = (params?: ListSuppressionsParams) =>
  apiRequest<SuppressionsResponse>("/v1/suppressions", { query: params });
export const addSuppression = (body: { email: string; reason?: SuppressionReason; notes?: string }) =>
  apiRequest<{ email: string }>("/v1/suppressions", { method: "POST", body });
export const deleteSuppression = (email: string) =>
  apiRequest<void>(`/v1/suppressions/${encodeURIComponent(email)}`, { method: "DELETE" });
export interface SuppressionImportResponse {
  imported: number;
  quality: {
    total: number; valid: number; spam_traps: number; disposable: number;
    recommendation: "accept" | "reject" | string;
  };
}
export const importSuppressions = (body: { emails: string[]; reason?: SuppressionReason; force?: boolean }) =>
  apiRequest<SuppressionImportResponse>("/v1/suppressions/import", { method: "POST", body });
export async function exportSuppressionsCsv(params?: { reason?: string; since?: string }): Promise<string> {
  const res = await apiRequest<Response>("/v1/suppressions/export", { query: params, raw: true });
  if (!res.ok) throw new ApiError(`Export failed (${res.status})`, res.status, null);
  return res.text();
}

// ───────────── Unsubscribe groups ─────────────
export interface UnsubscribeGroup {
  id: string; name: string; description?: string;
  is_default: boolean; created_at?: string;
}
export const listUnsubscribeGroups = () =>
  apiRequest<{ groups: UnsubscribeGroup[] }>("/v1/unsubscribe-groups");
export const createUnsubscribeGroup = (body: { name: string; description?: string; is_default?: boolean }) =>
  apiRequest<{ group: UnsubscribeGroup }>("/v1/unsubscribe-groups", { method: "POST", body });
export const updateUnsubscribeGroup = (id: string, body: Partial<Pick<UnsubscribeGroup, "name" | "description" | "is_default">>) =>
  apiRequest<{ group: UnsubscribeGroup }>(`/v1/unsubscribe-groups/${encodeURIComponent(id)}`, { method: "PATCH", body });
export const deleteUnsubscribeGroup = (id: string) =>
  apiRequest<void>(`/v1/unsubscribe-groups/${encodeURIComponent(id)}`, { method: "DELETE" });
export const listGroupMembers = (id: string, params?: { limit?: number; offset?: number }) =>
  apiRequest<{ members: { email: string; unsubscribed_at: string }[] }>(
    `/v1/unsubscribe-groups/${encodeURIComponent(id)}/members`, { query: params });
export const addGroupMembers = (id: string, emails: string[]) =>
  apiRequest<{ added: number }>(`/v1/unsubscribe-groups/${encodeURIComponent(id)}/members`,
    { method: "POST", body: { emails } });
export const removeGroupMember = (id: string, email: string) =>
  apiRequest<void>(`/v1/unsubscribe-groups/${encodeURIComponent(id)}/members/${encodeURIComponent(email)}`,
    { method: "DELETE" });

// ───────────── Webhooks ─────────────
export interface Webhook {
  id: string;
  url: string;
  events: string[];
  created_at?: string;
  // Returned only on create:
  signing_secret?: string;
  // UI compatibility:
  secret?: string;
  enabled?: boolean;
}
function normalizeWebhook(w: Webhook): Webhook {
  return { ...w, secret: w.secret ?? w.signing_secret, enabled: w.enabled ?? true };
}
export const listWebhooks = async () => {
  const data = await apiRequest<{ webhooks: Webhook[] }>("/v1/webhooks");
  return { webhooks: (data.webhooks ?? []).map(normalizeWebhook) };
};
export const createWebhook = async (body: { url: string; events: string[] }) => {
  const data = await apiRequest<Webhook>("/v1/webhooks", { method: "POST", body });
  return normalizeWebhook(data);
};
export const deleteWebhook = (id: string) =>
  apiRequest<void>(`/v1/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" });
export const rotateWebhookSecret = (id: string) =>
  apiRequest<{ id: string; signing_secret: string; note: string }>(
    `/v1/webhooks/${encodeURIComponent(id)}/rotate-secret`, { method: "POST" });
export interface WebhookDelivery {
  id: number;
  event_type: string;
  attempt: number;
  status_code: number;
  outcome: string;
  duration_ms: number;
  delivered_at: string;
}
export const listWebhookDeliveries = (id: string, params?: { limit?: number; before?: number }) =>
  apiRequest<{ deliveries: WebhookDelivery[]; next_cursor?: number | null }>(
    `/v1/webhooks/${encodeURIComponent(id)}/deliveries`, { query: params });
export const testWebhook = (id: string) =>
  apiRequest<{ outcome: string; status_code: number; duration_ms: number }>(
    `/v1/webhooks/${encodeURIComponent(id)}/test`, { method: "POST" });

// ───────────── Privacy / GDPR ─────────────
export const deleteRecipientData = (email: string) =>
  apiRequest<{
    email: string;
    deleted: { messages: number; events: number; tracked_links: number; soft_bounces: number };
    audit_id: string;
  }>("/v1/privacy/delete-recipient", { method: "POST", body: { email } });
export const exportRecipientData = (email: string) =>
  apiRequest<{ email: string; messages: unknown[]; events: unknown[]; suppression?: unknown }>(
    "/v1/privacy/export-recipient", { query: { email } });

// ───────────── Usage ─────────────
export interface UsageResponse {
  daily_used: number;
  daily_limit: number;
  monthly_used: number;
  monthly_limit: number;
  period: string;
}
export const getUsage = () => apiRequest<UsageResponse>("/v1/usage");

/**
 * Convenience wrapper that shapes /v1/usage into a quota object used by the
 * dashboard and usage screens. The underlying API only exposes scalar values.
 */
export interface QuotaResponse {
  daily: { used: number; limit: number; remaining: number; pct: number };
  monthly: { used: number; limit: number; remaining: number; pct: number };
  period: string;
}
export const getQuota = async (): Promise<QuotaResponse> => {
  const u = await getUsage();
  const pct = (used: number, limit: number) => (limit > 0 ? used / limit : 0);
  return {
    daily: {
      used: u.daily_used, limit: u.daily_limit,
      remaining: Math.max(0, u.daily_limit - u.daily_used),
      pct: pct(u.daily_used, u.daily_limit),
    },
    monthly: {
      used: u.monthly_used, limit: u.monthly_limit,
      remaining: Math.max(0, u.monthly_limit - u.monthly_used),
      pct: pct(u.monthly_used, u.monthly_limit),
    },
    period: u.period,
  };
};

// ───────────── Support tickets ─────────────
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export interface SupportTicket {
  id: string;
  subject: string;
  status: TicketStatus | string;
  priority: TicketPriority | string;
  category?: string;
  created_at: string;
  updated_at?: string;
}
export interface TicketMessage {
  id: string;
  ticket_id?: string;
  body: string;
  author: "customer" | "agent" | string;
  created_at: string;
}
export const listTickets = () =>
  apiRequest<{ tickets: SupportTicket[] }>("/v1/support/tickets");
export const createTicket = (body: {
  subject: string; body: string;
  priority?: TicketPriority; category?: string;
}) => apiRequest<{ ticket: SupportTicket }>("/v1/support/tickets", { method: "POST", body });
export const getTicket = (id: string) =>
  apiRequest<{ ticket: SupportTicket; messages: TicketMessage[] }>(
    `/v1/support/tickets/${encodeURIComponent(id)}`);
export const replyTicket = (id: string, body: string) =>
  apiRequest<{ message: TicketMessage }>(
    `/v1/support/tickets/${encodeURIComponent(id)}/messages`, { method: "POST", body: { body } });
export const rateTicket = (id: string, rating: number, comment?: string) =>
  apiRequest<{ ok: true }>(
    `/v1/support/tickets/${encodeURIComponent(id)}/rate`, { method: "POST", body: { rating, comment } });

// ───────────── OpenAPI spec ─────────────
export const getOpenApiSpec = () =>
  apiRequest<Record<string, unknown>>("/v1/openapi.json", { auth: false });
