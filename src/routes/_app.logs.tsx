import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Download, RefreshCw, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { demoLogs } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/logs")({ component: LogsPage });

const EVENTS = ["accepted", "delivered", "opened", "clicked", "failed", "bounced", "complained", "unsubscribed"];

function LogsPage() {
  const [event, setEvent] = useState("all");
  const [domain, setDomain] = useState("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => demoLogs.filter(l => {
    if (event !== "all" && l.event !== event) return false;
    if (domain !== "all" && l.domain !== domain) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!l.to.includes(s) && !l.subject.toLowerCase().includes(s) && !l.id.includes(s) && !l.ip.includes(s)) return false;
    }
    return true;
  }), [event, domain, search]);

  const page = filtered.slice(offset, offset + limit);
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: demoLogs.length };
    for (const e of EVENTS) c[e] = demoLogs.filter(l => l.event === e).length;
    return c;
  }, []);

  const reset = () => { setEvent("all"); setDomain("all"); setSearch(""); setOffset(0); };
  const hasFilter = event !== "all" || domain !== "all" || search;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Event Logs"
        description="Inspect every email event in real-time — accepted, delivered, opened, bounced, complained."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9"><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Live</Button>
            <Button variant="outline" size="sm" className="h-9"><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
          </>
        }
      />

      {/* Event tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
        <EventTab label="All events" active={event === "all"} count={counts.all} onClick={() => { setEvent("all"); setOffset(0); }} />
        {EVENTS.map(e => (
          <EventTab key={e} label={e} active={event === e} count={counts[e] ?? 0} onClick={() => { setEvent(e); setOffset(0); }} />
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardContent className="grid gap-3 p-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }} placeholder="Search by recipient, subject, IP, event ID…" className="h-9 pl-9" />
          </div>
          <Select value={domain} onValueChange={(v) => { setDomain(v); setOffset(0); }}>
            <SelectTrigger className="h-9 w-full md:w-56"><SelectValue placeholder="All domains" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sending domains</SelectItem>
              <SelectItem value="mail.acme.io">mail.acme.io</SelectItem>
              <SelectItem value="send.beta.app">send.beta.app</SelectItem>
              <SelectItem value="notifications.valasys.io">notifications.valasys.io</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setOffset(0); }}>
            <SelectTrigger className="h-9 w-full md:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{[25, 50, 100, 250].map(n => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}</SelectContent>
          </Select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={reset} className="h-9 text-muted-foreground hover:text-foreground">
              <X className="mr-1 h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Logs table */}
      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted/40 backdrop-blur">
                <tr className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-muted-foreground">
                  <th className="w-10 px-3 py-2.5"></th>
                  <th className="px-2 py-2.5 text-left">Timestamp</th>
                  <th className="px-2 py-2.5 text-left">Event</th>
                  <th className="px-2 py-2.5 text-left">Recipient</th>
                  <th className="px-2 py-2.5 text-left">Subject</th>
                  <th className="px-2 py-2.5 text-left">Domain</th>
                  <th className="px-2 py-2.5 text-left">Sending IP</th>
                  <th className="px-4 py-2.5 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {page.map(l => (
                  <FragmentRow key={l.id}>
                    <tr
                      onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                      className="group cursor-pointer transition hover:bg-muted/40"
                    >
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        <ChevronRight className={`h-3.5 w-3.5 transition ${expanded === l.id ? "rotate-90" : ""}`} />
                      </td>
                      <td className="px-2 py-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {format(new Date(l.timestamp), "MMM d, HH:mm:ss")}
                      </td>
                      <td className="px-2 py-2"><StatusBadge status={l.event} /></td>
                      <td className="px-2 py-2 font-medium">{l.to}</td>
                      <td className="max-w-[260px] truncate px-2 py-2 text-foreground/85">{l.subject}</td>
                      <td className="px-2 py-2">
                        <Badge variant="secondary" className="rounded-md font-mono text-[10.5px] font-medium">{l.domain}</Badge>
                      </td>
                      <td className="px-2 py-2 font-mono text-[11px] text-muted-foreground">{l.ip}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">{l.size_kb} KB</td>
                    </tr>
                    {expanded === l.id && (
                      <tr key={`${l.id}_exp`} className="bg-muted/20">
                        <td colSpan={8} className="px-12 py-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <KV label="Event ID" value={l.id} mono copy />
                            <KV label="From" value={l.from} mono />
                            <KV label="To" value={l.to} mono />
                            <KV label="SMTP response" value={l.response} mono />
                            <KV label="Sending IP" value={l.ip} mono />
                            <KV label="Tag" value={l.tag} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5 sm:flex-row sm:items-center">
          <p className="text-[11.5px] text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{offset + 1}</span>–
            <span className="font-semibold text-foreground">{Math.min(offset + limit, filtered.length)}</span> of{" "}
            <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span> events
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 px-2" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (p > totalPages) return null;
              const active = p === currentPage;
              return (
                <button key={p} onClick={() => setOffset((p - 1) * limit)}
                  className={`h-8 min-w-8 rounded-md px-2 text-[11.5px] font-semibold tabular-nums transition ${
                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}>{p}</button>
              );
            })}
            <Button variant="outline" size="sm" className="h-8 px-2" disabled={currentPage >= totalPages} onClick={() => setOffset(offset + limit)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function EventTab({ label, active, count, onClick }: { label: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`group inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium capitalize transition ${
        active ? "bg-gradient-primary-soft text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}>
      {label}
      <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${
        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
      }`}>{count}</span>
    </button>
  );
}

function KV({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
      <span className="w-28 shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-muted-foreground">{label}</span>
      <span className={`flex-1 truncate text-[12px] ${mono ? "font-mono" : ""}`}>{value}</span>
      {copy && <CopyButton value={value} />}
    </div>
  );
}
