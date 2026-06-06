// Demo/dummy data used as fallback when API is unavailable or returns empty.
import type { Message, UsageDay, Domain, Suppression, Webhook } from "./api-client";

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
const domains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com", "protonmail.com", "company.io"];
const tagsPool = ["transactional", "marketing", "welcome", "billing", "alerts", "newsletter", "onboarding", "receipts"];
const statuses = ["delivered", "delivered", "delivered", "delivered", "opened", "clicked", "queued", "bounced", "complained", "failed"];

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

export const demoMessages: Message[] = Array.from({ length: 48 }).map((_, i) => {
  const d = new Date(Date.now() - i * 1000 * 60 * (5 + Math.random() * 90));
  const user = `user${1000 + i}`;
  return {
    message_id: `msg_${Math.random().toString(36).slice(2, 10)}${i.toString(36)}`,
    to: `${user}@${rand(domains)}`,
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
    to: `${["sarah", "marco", "priya", "leo", "noah", "ava", "mia", "kai"][i]}@${rand(domains)}`,
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
