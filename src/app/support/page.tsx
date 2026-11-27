"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  LifeBuoy,
  MessageCircle,
  Plus,
  Search,
  Send,
  Star,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Status = "Open" | "In Progress" | "Waiting" | "Resolved";
type Priority = "Urgent" | "High" | "Normal" | "Low";
type Reply = { from: "client" | "agent"; text: string; time: string };
type Ticket = {
  id: string;
  subject: string;
  client: string;
  channel: string;
  priority: Priority;
  status: Status;
  assignee: string;
  sla: string;
  csat: number | null;
  thread: Reply[];
};

const STATUS_ORDER: Status[] = ["Open", "In Progress", "Waiting", "Resolved"];
const statusTone: Record<Status, string> = {
  Open: "bg-brand-primary/10 text-brand-primary",
  "In Progress": "bg-amber-500/10 text-amber-500",
  Waiting: "bg-violet-500/10 text-violet-500",
  Resolved: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
};
const prioTone: Record<Priority, string> = {
  Urgent: "bg-rose-500/10 text-rose-500",
  High: "bg-amber-500/10 text-amber-500",
  Normal: "bg-sky-500/10 text-sky-500",
  Low: "bg-muted/15 text-muted",
};

const INITIAL: Ticket[] = [
  { id: "TKT-5012", subject: "Website contact form not sending emails", client: "Apex Infra", channel: "Portal", priority: "Urgent", status: "Open", assignee: "Vikram Patel", sla: "1h 10m left", csat: null, thread: [{ from: "client", text: "Our contact form stopped sending leads since yesterday.", time: "10:20 AM" }] },
  { id: "TKT-5011", subject: "Add 2 users to Google Ads access", client: "Verve Healthcare", channel: "Email", priority: "Normal", status: "In Progress", assignee: "Neha Kapoor", sla: "4h left", csat: null, thread: [{ from: "client", text: "Please add two team members to our Ads account.", time: "09:05 AM" }, { from: "agent", text: "Sure, sending invites now.", time: "09:20 AM" }] },
  { id: "TKT-5010", subject: "Monthly SEO report clarification", client: "Kroma Apparel", channel: "WhatsApp", priority: "Low", status: "Waiting", assignee: "Aarav Sharma", sla: "On hold", csat: null, thread: [{ from: "client", text: "Can you explain the keyword drop on page 2?", time: "Yesterday" }] },
  { id: "TKT-5009", subject: "Invoice GST number correction", client: "FinEdge Advisory", channel: "Email", priority: "High", status: "Resolved", assignee: "Ishita Rao", sla: "Met", csat: 5, thread: [{ from: "client", text: "GSTIN on last invoice is wrong.", time: "2d ago" }, { from: "agent", text: "Corrected invoice re-issued. Apologies!", time: "2d ago" }] },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [subject, setSubject] = useState("");
  const [client, setClient] = useState("");
  const [priority, setPriority] = useState<Priority>("Normal");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      const mS = statusFilter === "All" || t.status === statusFilter;
      const mQ = !q || t.subject.toLowerCase().includes(q) || t.client.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
      return mS && mQ;
    });
  }, [tickets, search, statusFilter]);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status !== "Resolved").length;
    const urgent = tickets.filter((t) => t.priority === "Urgent" && t.status !== "Resolved").length;
    const resolved = tickets.filter((t) => t.status === "Resolved");
    const csat = resolved.filter((t) => t.csat).reduce((s, t) => s + (t.csat ?? 0), 0) / Math.max(1, resolved.filter((t) => t.csat).length);
    return { open, urgent, resolved: resolved.length, csat: csat.toFixed(1) };
  }, [tickets]);

  const KPIS = [
    { label: "Open Tickets", value: `${stats.open}`, delta: "needs action", color: "#0f67a6", spark: [5, 4, 6, 5, 4, stats.open] },
    { label: "Urgent", value: `${stats.urgent}`, delta: "SLA risk", color: "#e11d48", spark: [1, 2, 1, 2, 1, stats.urgent + 1] },
    { label: "Resolved (mo)", value: `${stats.resolved + 46}`, delta: "+12%", color: "#0eb57d", spark: [30, 34, 38, 42, 44, stats.resolved + 46] },
    { label: "Avg CSAT", value: `${stats.csat}/5`, delta: "satisfaction", color: "#1677e8", spark: [4.2, 4.4, 4.5, 4.6, 4.7, 4.8] },
  ];

  function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !client.trim()) return;
    setTickets((prev) => [{ id: `TKT-${5013 + prev.length}`, subject: subject.trim(), client: client.trim(), channel: "Portal", priority, status: "Open", assignee: "Unassigned", sla: "4h left", csat: null, thread: [{ from: "client", text: subject.trim(), time: "Just now" }] }, ...prev]);
    setSubject(""); setClient("");
    setModalOpen(false);
    notify("Ticket created & queued.");
  }

  function cycleStatus(id: string) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: STATUS_ORDER[(STATUS_ORDER.indexOf(t.status) + 1) % STATUS_ORDER.length] } : t)));
  }

  function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !detail) return;
    const text = reply.trim();
    setTickets((prev) => prev.map((t) => (t.id === detail.id ? { ...t, status: t.status === "Open" ? "In Progress" : t.status, thread: [...t.thread, { from: "agent", text, time: "Just now" }] } : t)));
    setDetail((d) => (d ? { ...d, thread: [...d.thread, { from: "agent", text, time: "Just now" }] } : d));
    setReply("");
    notify("Reply sent to client.");
  }

  function resolve(id: string) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Resolved", sla: "Met", csat: 5 } : t)));
    setDetail(null);
    notify("Ticket resolved · CSAT request sent.");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {toast && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Business · Support Desk</span>
          <h1 className="mt-1 text-2xl font-bold">Customer Support &amp; Tickets</h1>
          <p className="text-sm text-muted">Multi-channel tickets (Portal, Email, WhatsApp) with SLA tracking, assignment &amp; CSAT.</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95"><Plus className="h-4 w-4" /> New Ticket</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-surface-border bg-surface p-4 shadow-xs transition-colors hover:border-brand-primary/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted">{k.label}</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">{k.value}</p>
              </div>
              <MiniSparkline points={k.spark} color={k.color} />
            </div>
            <p className="mt-2 text-xs font-semibold" style={{ color: k.color }}>{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...STATUS_ORDER] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="divide-y divide-surface-border">
          {visible.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-background/50">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${prioTone[t.priority]}`}>{t.priority}</span>
                  <button type="button" onClick={() => setDetail(t)} className="truncate text-sm font-semibold text-foreground hover:text-brand-primary">{t.subject}</button>
                </div>
                <p className="mt-0.5 text-xs text-muted">{t.client} · {t.id} · {t.channel} · {t.assignee}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 text-[11px] ${t.sla.includes("left") && t.priority === "Urgent" ? "font-semibold text-rose-500" : "text-muted"}`}><Clock className="h-3 w-3" /> {t.sla}</span>
                <button type="button" onClick={() => cycleStatus(t.id)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-transform hover:scale-105 ${statusTone[t.status]}`}>{t.status}</button>
                <button type="button" onClick={() => setDetail(t)} className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><MessageCircle className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {visible.length === 0 && <p className="py-10 text-center text-sm text-muted">No tickets match your filters.</p>}
        </div>
      </div>

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={createTicket} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">New Support Ticket</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject / issue" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client" className="rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  <option>Urgent</option><option>High</option><option>Normal</option><option>Low</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">Create Ticket</button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" onClick={() => setDetail(null)}>
          <div className="flex h-full w-full max-w-md flex-col border-l border-surface-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-surface-border p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${prioTone[detail.priority]}`}>{detail.priority}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[detail.status]}`}>{detail.status}</span>
                </div>
                <h2 className="mt-1.5 text-sm font-bold">{detail.subject}</h2>
                <p className="text-xs text-muted">{detail.client} · {detail.id} · {detail.channel}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {detail.thread.map((m, i) => (
                <div key={i} className={`flex ${m.from === "agent" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs ${m.from === "agent" ? "nova-gradient text-white" : "border border-surface-border bg-background/70"}`}>
                    <p>{m.text}</p>
                    <p className="mt-1 text-[10px] opacity-75">{m.from === "agent" ? "Agent" : detail.client} · {m.time}</p>
                  </div>
                </div>
              ))}
              {detail.csat && (
                <div className="flex items-center justify-center gap-1 rounded-xl border border-brand-green/25 bg-brand-green/10 py-2 text-xs font-semibold text-brand-teal dark:text-brand-green">
                  CSAT {detail.csat}/5 {Array.from({ length: detail.csat }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                </div>
              )}
            </div>
            {detail.status !== "Resolved" ? (
              <div className="border-t border-surface-border p-3">
                <form onSubmit={sendReply} className="flex items-center gap-2">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to client..." className="flex-1 rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
                  <button type="submit" className="nova-gradient rounded-xl p-2 text-white"><Send className="h-4 w-4" /></button>
                </form>
                <button type="button" onClick={() => resolve(detail.id)} className="mt-2 w-full rounded-xl border border-brand-green/30 bg-brand-green/10 py-2 text-xs font-semibold text-brand-teal dark:text-brand-green">Mark Resolved</button>
              </div>
            ) : (
              <div className="border-t border-surface-border p-4 text-center text-xs font-semibold text-brand-teal dark:text-brand-green">✓ Ticket resolved</div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <LifeBuoy className="h-5 w-5 text-brand-primary" />
        <p className="text-xs text-muted">Tickets intake from Client Portal, Email &amp; WhatsApp · SLA breaches auto-escalate to managers · CSAT collected on resolution.</p>
      </div>
    </div>
  );
}
