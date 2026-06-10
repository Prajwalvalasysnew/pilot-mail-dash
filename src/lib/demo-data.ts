// Demo/dummy data used as fallback when API is unavailable or returns empty.
import type { Message, Domain, Suppression, Webhook } from "./api-client";

export interface UsageDay { usage_date: string; sent: number; delivered: number; bounced: number; complained: number }

export const demoUsage: UsageDay[] = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const sent = 8500 + Math.round(Math.sin(i / 1.7) * 1800 + Math.random() * 1200);
  const delivered = Math.round(sent * (0.965 + Math.random() * 0.02));
  const bounced = Math.round(sent * (0.012 + Math.random() * 0.008));
  const complained = Math.round(sent * (0.0008 + Math.random() * 0.0008));
  return {
    usage_date: d.toISOString().slice(0, 10),
    sent, delivered, bounced, complained,
  };
});

const subjects = [
  "Welcome to Acme — let's get started",
  "Your weekly performance report",
  "Reset your password",
  "[Action required] Verify your email",
  "Invoice #INV-2089 is ready",
  "Your order has shipped",
  "New login from Chrome on macOS",
  "Reminder: Trial ends in 3 days",
  "You've got a new message from Sarah",
  "Payment receipt — $129.00",
  "Webhook delivery failed for endpoint",
  "Monthly newsletter — November edition",
];
const recipientDomains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com", "protonmail.com", "company.io"];
const tagsPool = ["transactional", "marketing", "welcome", "billing", "alerts", "newsletter", "onboarding", "receipts"];
const statuses = ["delivered", "delivered", "delivered", "delivered", "opened", "clicked", "queued", "bounced", "complained", "failed"];

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

export const demoMessages: Message[] = Array.from({ length: 48 }).map((_, i) => {
  const d = new Date(Date.now() - i * 1000 * 60 * (5 + Math.random() * 90));
  const user = `user${1000 + i}`;
  return {
    message_id: `msg_${Math.random().toString(36).slice(2, 10)}${i.toString(36)}`,
    to: `${user}@${rand(recipientDomains)}`,
    subject: rand(subjects),
    status: rand(statuses),
    attempts: 1 + Math.floor(Math.random() * 2),
    tags: [rand(tagsPool), ...(Math.random() > 0.6 ? [rand(tagsPool)] : [])],
    created_at: d.toISOString(),
    last_event: d.toISOString(),
  };
});

export const demoDomains: Domain[] = [
  { id: "d1", domain: "mail.acme.io", verified: true, status: "verified", created_at: new Date(Date.now() - 86400000 * 41).toISOString(),
    verification: { ownership: true, spf: true, dkim: true, dmarc: true } },
  { id: "d2", domain: "send.beta.app", verified: true, status: "verified", created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    verification: { ownership: true, spf: true, dkim: true, dmarc: false } },
  { id: "d3", domain: "notifications.valasys.io", verified: false, status: "pending", created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    verification: { ownership: true, spf: false, dkim: false, dmarc: false } },
];

export const demoSuppressions: Suppression[] = [
  { email: "bounce-test@example.com", reason: "hard_bounce", notes: "550 5.1.1 user unknown", created_at: new Date(Date.now() - 86400000).toISOString() },
  { email: "complainer@yahoo.com", reason: "complaint", notes: "FBL report", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { email: "old@deleted.com", reason: "unsubscribe", created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { email: "spamtrap@trap.net", reason: "spam_trap", created_at: new Date(Date.now() - 86400000 * 12).toISOString() },
];

export const demoWebhooks: Webhook[] = [
  { id: "wh_1", url: "https://api.acme.io/hooks/email", events: ["delivered", "bounced", "complained"], enabled: true, created_at: new Date(Date.now() - 86400000 * 20).toISOString() },
  { id: "wh_2", url: "https://hooks.zapier.com/abc123", events: ["opened", "clicked"], enabled: true, created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
];

export const demoQuota = {
  daily: { used: 12480, limit: 50000, remaining: 37520, pct: 24.96 },
  monthly: { used: 384210, limit: 1500000, remaining: 1115790, pct: 25.61 },
};

export const demoTopDomains = [
  { domain: "gmail.com", sent: 48210, delivered: 47650, opened: 32115, clicked: 8430, deliverability: 98.84 },
  { domain: "outlook.com", sent: 32540, delivered: 31800, opened: 18920, clicked: 4210, deliverability: 97.73 },
  { domain: "yahoo.com", sent: 18430, delivered: 17890, opened: 9210, clicked: 1820, deliverability: 97.07 },
  { domain: "icloud.com", sent: 12120, delivered: 11960, opened: 7340, clicked: 1530, deliverability: 98.68 },
  { domain: "hotmail.com", sent: 8210, delivered: 7960, opened: 3210, clicked: 540, deliverability: 96.95 },
  { domain: "protonmail.com", sent: 1230, delivered: 1218, opened: 870, clicked: 220, deliverability: 99.02 },
];

export const demoCountries = [
  { country: "United States", code: "US", sent: 62150, share: 48.2 },
  { country: "United Kingdom", code: "GB", sent: 18420, share: 14.3 },
  { country: "Germany", code: "DE", sent: 12100, share: 9.4 },
  { country: "India", code: "IN", sent: 9840, share: 7.6 },
  { country: "Canada", code: "CA", sent: 7320, share: 5.7 },
  { country: "Australia", code: "AU", sent: 5410, share: 4.2 },
  { country: "France", code: "FR", sent: 4120, share: 3.2 },
  { country: "Other", code: "··", sent: 9560, share: 7.4 },
];

export const demoEventStream = Array.from({ length: 8 }).map((_, i) => {
  const types = ["delivered", "opened", "clicked", "bounced", "queued", "complained"] as const;
  const t = types[i % types.length];
  return {
    id: `evt_${i}`,
    type: t,
    to: `${["sarah", "marco", "priya", "leo", "noah", "ava", "mia", "kai"][i]}@${rand(recipientDomains)}`,
    subject: rand(subjects),
    ago: `${(i + 1) * 7}s ago`,
  };
});

export const demoIpReputation = [
  { ip: "192.0.2.14",  pool: "Transactional", reputation: 98, sent24h: 12480, status: "excellent" },
  { ip: "192.0.2.15",  pool: "Transactional", reputation: 96, sent24h: 11210, status: "excellent" },
  { ip: "198.51.100.7", pool: "Marketing",    reputation: 89, sent24h: 28430, status: "good" },
  { ip: "198.51.100.8", pool: "Marketing",    reputation: 74, sent24h: 18120, status: "fair" },
  { ip: "203.0.113.21", pool: "Bulk",         reputation: 62, sent24h: 9840,  status: "watch" },
];

// ───── Analytics ─────
export const demoDevices = [
  { name: "Mobile", value: 58.3, color: "var(--color-chart-1)" },
  { name: "Desktop", value: 31.2, color: "var(--color-chart-2)" },
  { name: "Webmail", value: 8.4, color: "var(--color-chart-3)" },
  { name: "Tablet", value: 2.1, color: "var(--color-chart-4)" },
];

export const demoMailClients = [
  { name: "Apple Mail", share: 48.2, opens: 482140 },
  { name: "Gmail", share: 28.4, opens: 284033 },
  { name: "Outlook", share: 11.7, opens: 117204 },
  { name: "Yahoo Mail", share: 4.8, opens: 48120 },
  { name: "Samsung Mail", share: 3.2, opens: 32014 },
  { name: "Thunderbird", share: 1.9, opens: 19021 },
  { name: "Other", share: 1.8, opens: 18119 },
];

// 7 days × 24 hours heatmap of sending volume
export const demoHeatmap = Array.from({ length: 7 }).map((_, day) =>
  Array.from({ length: 24 }).map((_, hour) => {
    // business-hours-heavy distribution
    const bell = Math.exp(-Math.pow((hour - 14) / 5, 2));
    const weekdayMult = day < 5 ? 1 : 0.45;
    return Math.round(bell * weekdayMult * 1000 + Math.random() * 120);
  })
);

export const demoBounceReasons = [
  { reason: "Mailbox full", count: 412, pct: 28.4 },
  { reason: "User unknown", count: 384, pct: 26.5 },
  { reason: "Spam content", count: 218, pct: 15.0 },
  { reason: "Domain not found", count: 162, pct: 11.2 },
  { reason: "Greylisted", count: 138, pct: 9.5 },
  { reason: "Policy reject", count: 87, pct: 6.0 },
  { reason: "Other", count: 49, pct: 3.4 },
];

// ───── Logs (event-centric, Mailgun-style) ─────
const eventTypes = ["delivered", "opened", "clicked", "accepted", "failed", "bounced", "complained", "unsubscribed"] as const;
const ips = ["192.0.2.14", "192.0.2.15", "198.51.100.7", "198.51.100.8", "203.0.113.21"];
const senderDomains = ["mail.acme.io", "send.beta.app", "notifications.valasys.io"];

export const demoLogs = Array.from({ length: 120 }).map((_, i) => {
  const d = new Date(Date.now() - i * 1000 * 47);
  const t = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  return {
    id: `log_${i}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: d.toISOString(),
    event: t,
    from: `noreply@${rand(senderDomains)}`,
    to: `user${2000 + i}@${rand(recipientDomains)}`,
    subject: rand(subjects),
    ip: rand(ips),
    domain: rand(senderDomains),
    response: t === "delivered" ? "250 2.0.0 OK" : t === "bounced" ? "550 5.1.1 user unknown" : t === "failed" ? "421 4.7.0 try later" : "—",
    size_kb: Math.round(12 + Math.random() * 48),
    tag: rand(tagsPool),
  };
});

// ───── Templates ─────
export const demoTemplates = [
  { id: "tpl_welcome", name: "Welcome email", description: "Onboard new signups", version: 4, last_used: new Date(Date.now() - 3600_000 * 2).toISOString(), sends_30d: 12480, status: "active", category: "Transactional" },
  { id: "tpl_reset", name: "Password reset", description: "Secure password reset flow", version: 2, last_used: new Date(Date.now() - 3600_000 * 1).toISOString(), sends_30d: 8420, status: "active", category: "Transactional" },
  { id: "tpl_invoice", name: "Monthly invoice", description: "Billing & receipts", version: 7, last_used: new Date(Date.now() - 3600_000 * 12).toISOString(), sends_30d: 3210, status: "active", category: "Billing" },
  { id: "tpl_newsletter", name: "Product newsletter", description: "Monthly product updates", version: 11, last_used: new Date(Date.now() - 86400_000 * 3).toISOString(), sends_30d: 24820, status: "active", category: "Marketing" },
  { id: "tpl_alert", name: "Security alert", description: "Suspicious login alerts", version: 3, last_used: new Date(Date.now() - 3600_000 * 5).toISOString(), sends_30d: 1840, status: "active", category: "Transactional" },
  { id: "tpl_trial", name: "Trial ending soon", description: "3-day warning email", version: 5, last_used: new Date(Date.now() - 86400_000 * 1).toISOString(), sends_30d: 920, status: "draft", category: "Lifecycle" },
];
