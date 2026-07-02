export interface Crumb { label: string; to?: string }

const MAP: Record<string, { section: string; label: string }> = {
  "/dashboard":      { section: "Overview", label: "Dashboard" },
  "/analytics":      { section: "Overview", label: "Analytics" },
  "/onboarding":     { section: "Overview", label: "Onboarding" },
  "/ai":             { section: "Overview", label: "Valasys AI" },
  "/send-email":     { section: "Sending",  label: "Send Email" },
  "/messages":       { section: "Sending",  label: "Messages" },
  "/templates":      { section: "Sending",  label: "Templates" },
  "/domains":        { section: "Sending",  label: "Domains" },
  "/logs":           { section: "Monitor",  label: "Event Logs" },
  "/usage":          { section: "Monitor",  label: "Usage & Quota" },
  "/suppressions":   { section: "Monitor",  label: "Suppressions" },
  "/webhooks":       { section: "Monitor",  label: "Webhooks" },
  "/admin/api-keys": { section: "Account",  label: "API Keys" },
  "/settings":       { section: "Account",  label: "Settings" },
  "/docs":           { section: "Account",  label: "Docs" },
  "/health":         { section: "Account",  label: "Health" },
};

export function crumbsFor(pathname: string): Crumb[] {
  // Match longest prefix
  const keys = Object.keys(MAP).sort((a, b) => b.length - a.length);
  const key = keys.find((k) => pathname === k || pathname.startsWith(k + "/"));
  const base: Crumb[] = [{ label: "Home", to: "/dashboard" }];
  if (!key) return base;
  const entry = MAP[key];
  base.push({ label: entry.section });
  base.push({ label: entry.label, to: key });
  if (pathname !== key && pathname.startsWith(key + "/")) {
    const rest = pathname.slice(key.length + 1);
    base.push({ label: rest });
  }
  return base;
}
