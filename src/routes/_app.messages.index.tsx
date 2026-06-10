import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search, Filter, Download, ChevronLeft, ChevronRight, RefreshCw, X } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/TableSkeleton";
import { CopyButton } from "@/components/CopyButton";
import { listMessages } from "@/lib/api-client";
import { demoMessages } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/messages/")({ component: MessagesPage });

const STATUSES = ["queued", "accepted", "delivered", "opened", "clicked", "soft_bounced", "hard_bounced", "complained", "failed"];

function MessagesPage() {
  const [status, setStatus] = useState<string>("all");
  const [tag, setTag] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["messages", { status, tag, to, limit }],
    queryFn: () => listMessages({
      status: status === "all" ? undefined : status,
      tag: tag || undefined, to: to || undefined,
      limit,
    }),
    retry: false,
  });

  // Fallback to demo data, client-side filtered
  const raw = data?.messages?.length ? data.messages : demoMessages;
  const filtered = useMemo(() => {
    return raw.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (tag && !m.tags?.some((t) => t.toLowerCase().includes(tag.toLowerCase()))) return false;
      if (to && !m.to?.toLowerCase().includes(to.toLowerCase())) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!m.subject?.toLowerCase().includes(s) && !m.message_id.toLowerCase().includes(s) && !m.to?.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [raw, status, tag, to, search]);

  const page = filtered.slice(offset, offset + limit);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: raw.length };
    for (const s of STATUSES) c[s] = 0;
    for (const m of raw) c[m.status] = (c[m.status] ?? 0) + 1;
    return c;
  }, [raw]);

  const reset = () => { setStatus("all"); setTag(""); setTo(""); setSearch(""); setOffset(0); };
  const hasFilter = status !== "all" || tag || to || search;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Messages"
        description="Search, filter and inspect every email sent through V-Mail Pilot."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </>
        }
      />

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
        <StatusTab label="All" value="all" active={status === "all"} count={counts.all} onClick={() => { setStatus("all"); setOffset(0); }} />
        {STATUSES.map((s) => (
          <StatusTab key={s} label={s.replace("_", " ")} value={s} active={status === s} count={counts[s] ?? 0}
            onClick={() => { setStatus(s); setOffset(0); }} />
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardContent className="grid gap-3 p-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
              placeholder="Search by subject, recipient, message ID…"
              className="h-9 pl-9"
            />
          </div>
          <Input placeholder="Recipient" value={to} onChange={(e) => { setTo(e.target.value); setOffset(0); }} className="h-9 w-full md:w-44" />
          <Input placeholder="Tag" value={tag} onChange={(e) => { setTag(e.target.value); setOffset(0); }} className="h-9 w-full md:w-32" />
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setOffset(0); }}>
            <SelectTrigger className="h-9 w-full md:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[25, 50, 100, 250].map(n => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={reset} className="h-9 text-muted-foreground hover:text-foreground">
              <X className="mr-1 h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><TableSkeleton columns={6} /></div>
            : page.length === 0 ? (
              <div className="p-10">
                <EmptyState icon={Mail} title="No messages found" description="Try adjusting filters or send your first email." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead className="sticky top-0 z-10 border-b border-border bg-muted/40 backdrop-blur">
                    <tr className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-muted-foreground">
                      <th className="px-4 py-2.5 text-left">Status</th>
                      <th className="px-2 py-2.5 text-left">Recipient</th>
                      <th className="px-2 py-2.5 text-left">Subject</th>
                      <th className="px-2 py-2.5 text-left">Tags</th>
                      <th className="px-2 py-2.5 text-right">Attempts</th>
                      <th className="px-2 py-2.5 text-left">Message ID</th>
                      <th className="px-2 py-2.5 text-right">Created</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {page.map((m) => (
                      <tr key={m.message_id} className="group transition hover:bg-muted/40">
                        <td className="px-4 py-2.5"><StatusBadge status={m.status} /></td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary-soft text-[10px] font-bold uppercase text-primary">
                              {m.to?.[0] ?? "·"}
                            </div>
                            <span className="font-medium">{m.to ?? "—"}</span>
                          </div>
                        </td>
                        <td className="max-w-[280px] truncate px-2 py-2.5 text-foreground/90">{m.subject ?? "(no subject)"}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {m.tags?.slice(0, 2).map(t => (
                              <Badge key={t} variant="secondary" className="rounded-md font-mono text-[10px] font-medium">{t}</Badge>
                            ))}
                            {(m.tags?.length ?? 0) > 2 && (
                              <Badge variant="outline" className="rounded-md text-[10px]">+{m.tags!.length - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono tabular-nums">{m.attempts}</td>
                        <td className="px-2 py-2.5">
                          <code className="block max-w-[180px] truncate font-mono text-[11px] text-muted-foreground">{m.message_id}</code>
                        </td>
                        <td className="px-2 py-2.5 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                          {m.created_at ? format(new Date(m.created_at), "MMM d, HH:mm") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                            <CopyButton value={m.message_id} />
                            <Button asChild size="sm" variant="outline" className="h-7 px-2.5 text-[11px]">
                              <Link to="/messages/$messageId" params={{ messageId: m.message_id }}>View</Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>

        {/* Pagination */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-border bg-muted/20 px-4 py-2.5 sm:flex-row sm:items-center">
          <p className="text-[11.5px] text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{total === 0 ? 0 : offset + 1}</span>–
            <span className="font-semibold text-foreground">{Math.min(offset + limit, total)}</span> of{" "}
            <span className="font-semibold text-foreground">{total.toLocaleString()}</span> messages
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 px-2" disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (p > totalPages) return null;
              const active = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => setOffset((p - 1) * limit)}
                  className={`h-8 min-w-8 rounded-md px-2 text-[11.5px] font-semibold tabular-nums transition ${
                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >{p}</button>
              );
            })}
            <Button variant="outline" size="sm" className="h-8 px-2" disabled={currentPage >= totalPages}
              onClick={() => setOffset(offset + limit)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatusTab({ label, active, count, onClick }: { label: string; value: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium capitalize transition ${
        active
          ? "bg-gradient-primary-soft text-primary shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${
        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background"
      }`}>{count}</span>
    </button>
  );
}
