import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/TableSkeleton";
import { CopyButton } from "@/components/CopyButton";
import { listMessages } from "@/lib/api-client";

export const Route = createFileRoute("/_app/messages/")({ component: MessagesPage });

const STATUSES = ["queued", "accepted", "delivered", "soft_bounced", "hard_bounced", "failed"];

function MessagesPage() {
  const [status, setStatus] = useState<string>("all");
  const [tag, setTag] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", { status, tag, to, limit, offset }],
    queryFn: () => listMessages({
      status: status === "all" ? undefined : status,
      tag: tag || undefined, to: to || undefined,
      limit, offset,
    }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Search and inspect every email you've sent." />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <Select value={status} onValueChange={(v) => { setStatus(v); setOffset(0); }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Tag" value={tag} onChange={(e) => setTag(e.target.value)} />
          <Input placeholder="Recipient" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setOffset(0); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[25, 50, 100, 250, 500].map(n => <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setStatus("all"); setTag(""); setTo(""); setOffset(0); }}>
            <Search className="mr-1.5 h-4 w-4" /> Reset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4"><TableSkeleton columns={6} /></div>
            : (data?.messages?.length ?? 0) === 0 ? (
              <EmptyState icon={Mail} title="No messages found"
                description="Try adjusting filters or send your first email." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Message ID</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last event</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.messages?.map((m) => (
                      <TableRow key={m.message_id}>
                        <TableCell className="max-w-[180px]">
                          <code className="block truncate font-mono text-xs">{m.message_id}</code>
                        </TableCell>
                        <TableCell className="text-sm">{m.to ?? "—"}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm">{m.subject ?? "(no subject)"}</TableCell>
                        <TableCell><StatusBadge status={m.status} /></TableCell>
                        <TableCell className="text-sm">{m.attempts}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {m.tags?.slice(0, 2).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.created_at ? format(new Date(m.created_at), "MMM d HH:mm") : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.last_event ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <CopyButton value={m.message_id} />
                            <Button asChild size="sm" variant="outline">
                              <Link to="/messages/$messageId" params={{ messageId: m.message_id }}>View</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {offset + 1}–{offset + (data?.messages?.length ?? 0)}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
          <Button variant="outline" size="sm" disabled={(data?.messages?.length ?? 0) < limit} onClick={() => setOffset(offset + limit)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
