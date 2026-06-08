import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { FileText, Plus, Search, MoreHorizontal, Copy, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/PageHeader";
import { demoTemplates } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/templates")({ component: TemplatesPage });

const CATEGORIES = ["All", "Transactional", "Marketing", "Billing", "Lifecycle"];

function TemplatesPage() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof demoTemplates[number] | null>(null);

  const filtered = demoTemplates.filter(t => {
    if (cat !== "All" && t.category !== cat) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates"
        description="Reusable email templates with versioning, variables and live preview."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 bg-gradient-primary text-white shadow-glow hover:opacity-95">
                <Plus className="mr-1.5 h-4 w-4" /> New template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create template</DialogTitle>
                <DialogDescription>Build a reusable template with handlebars-style variables.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5"><Label>Name</Label><Input placeholder="e.g. Welcome email" /></div>
                <div className="space-y-1.5"><Label>Subject</Label><Input placeholder="Welcome to {{company}}, {{first_name}}!" /></div>
                <div className="space-y-1.5"><Label>HTML body</Label><Textarea rows={8} className="font-mono text-[12px]" placeholder={`<h1>Hi {{first_name}},</h1>\n<p>Welcome aboard…</p>`} /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm">Save as draft</Button>
                  <Button size="sm" className="bg-gradient-primary text-white">Save & publish</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition ${
                cat === c ? "bg-gradient-primary-soft text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>{c}</button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" className="h-9 pl-9" />
        </div>
        <Select defaultValue="recent">
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently used</SelectItem>
            <SelectItem value="name">Name (A→Z)</SelectItem>
            <SelectItem value="sends">Most sends</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(t => (
          <Card key={t.id} className="group relative overflow-hidden border-border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-3 top-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => setSelected(t)}><Eye className="mr-2 h-3.5 w-3.5" /> Preview</DropdownMenuItem>
                  <DropdownMenuItem><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem><Copy className="mr-2 h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Preview thumbnail */}
            <div className="relative h-32 overflow-hidden border-b border-border bg-mesh">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="absolute inset-x-6 top-6 space-y-1.5">
                <div className="h-2 w-3/5 rounded-full bg-foreground/15" />
                <div className="h-1.5 w-full rounded-full bg-foreground/10" />
                <div className="h-1.5 w-4/5 rounded-full bg-foreground/10" />
                <div className="mt-3 h-5 w-20 rounded-md bg-gradient-primary shadow-glow" />
              </div>
              <Badge variant="outline" className="absolute bottom-2 right-2 rounded-full border-border bg-card/80 text-[10px] font-mono backdrop-blur">
                v{t.version}
              </Badge>
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-[14px] font-semibold">
                  <FileText className="h-3.5 w-3.5 text-primary" /> {t.name}
                </CardTitle>
                <Badge variant="secondary" className={`rounded-md text-[10px] font-medium ${t.status === "active" ? "bg-success/10 text-success border-success/25" : ""}`}>
                  {t.status}
                </Badge>
              </div>
              <CardDescription className="text-[12px]">{t.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <Stat label="Category" value={t.category} />
                <Stat label="30d sends" value={t.sends_30d.toLocaleString()} />
                <Stat label="Last used" value={format(new Date(t.last_used), "MMM d")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>Version {selected.version} · {selected.category}</DialogDescription>
              </DialogHeader>
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="border-b border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Subject:</span> Welcome to {`{{company}}`}, {`{{first_name}}`}!
                </div>
                <div className="bg-white p-8 text-slate-900 dark:bg-slate-50">
                  <div className="mx-auto max-w-md space-y-4 text-[13px]">
                    <div className="h-8 w-24 rounded bg-gradient-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Hi {`{{first_name}}`} 👋</h2>
                    <p className="text-slate-600">Welcome to V-Mail Pilot. We're thrilled to have you on board.</p>
                    <p className="text-slate-600">Click the button below to verify your account and start sending in under 5 minutes.</p>
                    <a className="inline-block rounded-md bg-gradient-primary px-4 py-2 text-[12.5px] font-semibold text-white shadow">Verify my account →</a>
                    <p className="pt-4 text-[11px] text-slate-400">Sent by V-Mail Pilot · Unsubscribe</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-[12px] font-semibold">{value}</p>
    </div>
  );
}
