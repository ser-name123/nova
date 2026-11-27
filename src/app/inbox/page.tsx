"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock, Inbox, Mail, MessageCircle, Search, Send, Timer, Trash2, UserCheck } from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Msg = { from: "client" | "staff"; text: string; time: string };
type Thread = {
  id: string;
  name: string;
  company: string;
  channel: string;
  unread: boolean;
  priority: "High" | "Normal";
  assigned: string;
  preview: string;
  messages: Msg[];
};

const INITIAL_THREADS: Thread[] = [
  { id: "TH-1", name: "Rohan Mehta", company: "Apex Infra", channel: "WhatsApp", unread: true, priority: "High", assigned: "Aarav Sharma", preview: "Hi team, please share the updated SEO + website proposal.", messages: [{ from: "client", text: "Hi team, please share the updated SEO + website proposal.", time: "12:14 PM" }, { from: "staff", text: "Sure Rohan! Sending Proposal v2 with 3-month SEO roadmap.", time: "12:18 PM" }] },
  { id: "TH-2", name: "Ananya Verma", company: "Verve Dental", channel: "Email", unread: true, priority: "Normal", assigned: "Neha Kapoor", preview: "Re: Google Ads Q4 Budget Approval — Approved ₹1.2L/mo", messages: [{ from: "client", text: "Approved ₹1.2L/mo for Google Search + Local PMax.", time: "11:40 AM" }] },
  { id: "TH-3", name: "Kroma Support", company: "Kroma Apparel", channel: "Instagram", unread: false, priority: "Normal", assigned: "Vikram Patel", preview: "Can we pause the weekend reel ad set?", messages: [{ from: "client", text: "Can we pause the weekend reel ad set?", time: "Yesterday" }] },
  { id: "TH-4", name: "Dev Anand", company: "Nova Realty", channel: "Messenger", unread: true, priority: "High", assigned: "Aarav Sharma", preview: "Need a call about the landing page conversions.", messages: [{ from: "client", text: "Need a call about the landing page conversions.", time: "10:02 AM" }] },
];

const STAFF = ["Aarav Sharma", "Neha Kapoor", "Vikram Patel", "Sana Qureshi"];

export default function UnifiedInboxPage() {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [channel, setChannel] = useState("All");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState("TH-1");
  const [reply, setReply] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      const mC = channel === "All" || t.channel === channel;
      const mQ = !q || t.name.toLowerCase().includes(q) || t.company.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q);
      return mC && mQ;
    });
  }, [threads, channel, search]);

  const active = threads.find((t) => t.id === activeId) ?? threads[0];
  const unread = threads.filter((t) => t.unread).length;

  const KPIS = [
    { label: "Unread", value: `${unread}`, delta: "across channels", color: "#e11d48", spark: [2, 3, 4, 3, 4, unread + 1] },
    { label: "Open Conversations", value: `${threads.length}`, delta: "team inbox", color: "#0f67a6", spark: [6, 7, 8, 9, 9, threads.length + 5] },
    { label: "Avg Response", value: "8m", delta: "SLA 15m", color: "#0eb57d", spark: [14, 12, 11, 10, 9, 8] },
    { label: "SLA Met", value: "96%", delta: "this week", color: "#1677e8", spark: [88, 90, 92, 94, 95, 96] },
  ];

  function selectThread(id: string) {
    setActiveId(id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    const text = reply.trim();
    setThreads((prev) => prev.map((t) => (t.id === active.id ? { ...t, preview: text, messages: [...t.messages, { from: "staff", text, time: "Just now" }] } : t)));
    setReply("");
    notify(`Reply sent via ${active.channel}.`);
  }

  function cycleAssignee(id: string) {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, assigned: STAFF[(STAFF.indexOf(t.assigned) + 1) % STAFF.length] } : t)));
    notify("Conversation reassigned.");
  }

  function deleteThread(id: string) {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (id === activeId && next.length) setActiveId(next[0].id);
      return next;
    });
    notify("Conversation deleted.");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {toast && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div>
        <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 09 · Unified Communication Centre</span>
        <h1 className="mt-1 text-2xl font-bold">Omni-Channel Team Inbox</h1>
        <p className="text-sm text-muted">WhatsApp Business API, Email, Instagram, Facebook Messenger &amp; Website Live Chat in one place.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-surface-border bg-surface p-4 shadow-xs">
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
        <div className="flex flex-wrap gap-2">
          {["All", "WhatsApp", "Email", "Instagram", "Messenger", "Live Chat"].map((ch) => (
            <button key={ch} type="button" onClick={() => setChannel(ch)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${channel === ch ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>{ch}</button>
          ))}
        </div>
        <div className="relative w-52">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
      </div>

      <div className="grid min-h-[460px] overflow-hidden rounded-2xl border border-surface-border bg-surface lg:grid-cols-12">
        <div className="divide-y divide-surface-border border-b border-surface-border lg:col-span-4 lg:border-r lg:border-b-0">
          {filtered.map((t) => (
            <button key={t.id} type="button" onClick={() => selectThread(t.id)} className={`w-full p-4 text-left transition-colors ${t.id === active.id ? "bg-brand-primary/8" : "hover:bg-background/60"}`}>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  {t.unread && <span className="h-2 w-2 rounded-full bg-brand-green" />}
                  {t.name}
                  {t.priority === "High" && <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-rose-500">High</span>}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-brand-green/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-teal dark:text-brand-green">
                  {t.channel === "Email" ? <Mail className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                  {t.channel}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">{t.company}</p>
              <p className="mt-1.5 truncate text-xs text-muted">{t.preview}</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="p-6 text-center text-xs text-muted">No conversations match.</p>}
        </div>

        {!active ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-center lg:col-span-8">
            <Inbox className="h-7 w-7 text-muted/60" />
            <p className="text-sm font-semibold">No conversations</p>
            <p className="text-xs text-muted">Deleted all threads — new messages will appear here.</p>
          </div>
        ) : (
        <div className="flex flex-col lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold">{active.name} · {active.company}</p>
              <p className="text-xs text-muted">Channel: {active.channel} · Linked to CRM Profile</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1 text-[11px] text-muted"><Timer className="h-3 w-3 text-brand-primary" /> SLA 15m</span>
              <button type="button" onClick={() => cycleAssignee(active.id)} title="Click to reassign" className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-2.5 py-1 text-xs text-muted hover:border-brand-primary hover:text-foreground">
                <UserCheck className="h-3.5 w-3.5 text-brand-green" /> {active.assigned}
              </button>
              <button type="button" onClick={() => deleteThread(active.id)} title="Delete conversation" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {active.messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "staff" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-md rounded-2xl px-4 py-2.5 text-xs ${m.from === "staff" ? "nova-gradient text-white" : "border border-surface-border bg-background/70 text-foreground"}`}>
                  <p>{m.text}</p>
                  <p className="mt-1 text-[10px] opacity-75">{m.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-surface-border px-3.5 pt-2.5">
            <button type="button" onClick={() => notify("Internal note added (team-only).")} className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1 text-[11px] font-medium text-muted hover:text-foreground"><Inbox className="h-3 w-3" /> Internal note</button>
            <button type="button" onClick={() => notify("Conversation marked resolved.")} className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1 text-[11px] font-medium text-muted hover:text-brand-green"><Clock className="h-3 w-3" /> Resolve</button>
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2 p-3.5">
            <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply via ${active.channel}...`} className="flex-1 rounded-xl border border-surface-border bg-background px-3.5 py-2 text-xs focus:border-brand-primary focus:outline-none" />
            <button type="submit" className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"><Send className="h-3.5 w-3.5" /> Send</button>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
