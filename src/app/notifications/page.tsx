"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  Target,
  TrendingDown,
  Trash2,
  Zap,
} from "lucide-react";

type Category = "Lead" | "Payment" | "Renewal" | "SEO" | "SLA" | "Automation";
type Notif = {
  id: number;
  category: Category;
  title: string;
  detail: string;
  time: string;
  read: boolean;
};

const META: Record<Category, { icon: React.ElementType; tone: string }> = {
  Lead: { icon: Target, tone: "bg-brand-primary/10 text-brand-primary" },
  Payment: { icon: CreditCard, tone: "bg-rose-500/10 text-rose-500" },
  Renewal: { icon: RefreshCw, tone: "bg-amber-500/10 text-amber-500" },
  SEO: { icon: TrendingDown, tone: "bg-violet-500/10 text-violet-500" },
  SLA: { icon: AlertTriangle, tone: "bg-rose-500/10 text-rose-500" },
  Automation: { icon: Zap, tone: "bg-brand-green/15 text-brand-teal dark:text-brand-green" },
};

const INITIAL: Notif[] = [
  { id: 1, category: "Lead", title: "New Meta lead assigned", detail: "Rohan Mehta (Apex Infra) routed to you — follow up within 2 days.", time: "2m ago", read: false },
  { id: 2, category: "Renewal", title: "Domain expiring in 3 days", detail: "apexinfra.in renews 30 Nov. Urgent WhatsApp + Email reminder sent.", time: "1h ago", read: false },
  { id: 3, category: "Automation", title: "Quotation accepted → Project created", detail: "QT-218 accepted by client. 14 SEO & Web tasks auto-generated.", time: "3h ago", read: false },
  { id: 4, category: "SEO", title: "Technical SEO issue detected", detail: "12 new 404s on apexinfra.in in last crawl — task auto-assigned.", time: "5h ago", read: false },
  { id: 5, category: "Payment", title: "Payment overdue", detail: "Kroma Apparel invoice ($2,400) overdue 41 days — Stripe link resent.", time: "Yesterday", read: true },
  { id: 6, category: "SLA", title: "Support ticket nearing SLA breach", detail: "TKT-5012 (Apex Infra) has 1h 10m left — escalate if unresolved.", time: "Yesterday", read: true },
  { id: 7, category: "Lead", title: "LinkedIn Lead Gen form submission", detail: "Priya Nair (FinEdge Advisory) — B2B inquiry added to CRM.", time: "2d ago", read: true },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL);
  const [filter, setFilter] = useState<"All" | "Unread" | Category>("All");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  const unread = notifs.filter((n) => !n.read).length;
  const visible = useMemo(() => {
    if (filter === "All") return notifs;
    if (filter === "Unread") return notifs.filter((n) => !n.read);
    return notifs.filter((n) => n.category === filter);
  }, [notifs, filter]);

  const cats: ("All" | "Unread" | Category)[] = ["All", "Unread", "Lead", "Payment", "Renewal", "SEO", "SLA", "Automation"];

  function markRead(id: number) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  function markAll() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    notify("All notifications marked read.");
  }
  function remove(id: number) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }
  function clearAll() {
    setNotifs([]);
    notify("Notifications cleared.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {toast && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Overview · Notification Center</span>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            Notifications
            {unread > 0 && <span className="rounded-full bg-brand-green px-2 py-0.5 text-xs font-bold text-white">{unread} new</span>}
          </h1>
          <p className="text-sm text-muted">In-App, Email, WhatsApp &amp; browser alerts across leads, payments, renewals, SEO &amp; SLA.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={markAll} disabled={unread === 0} className="rounded-xl border border-surface-border bg-surface px-3.5 py-2 text-xs font-semibold text-muted hover:text-foreground disabled:opacity-50">Mark all read</button>
          <button type="button" onClick={clearAll} disabled={notifs.length === 0} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 py-2 text-xs font-semibold text-muted hover:text-rose-500 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Clear</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => {
          const count = c === "All" ? notifs.length : c === "Unread" ? unread : notifs.filter((n) => n.category === c).length;
          return (
            <button key={c} type="button" onClick={() => setFilter(c)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${filter === c ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>
              {c} <span className={`rounded-full px-1.5 text-[10px] ${filter === c ? "bg-white/20" : "bg-background"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {visible.map((n) => {
          const Icon = META[n.category].icon;
          return (
            <div key={n.id} className={`group flex items-start gap-3 rounded-2xl border p-4 transition-colors ${n.read ? "border-surface-border bg-surface" : "border-brand-primary/30 bg-brand-primary/5"}`}>
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${META[n.category].tone}`}><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />}
                  <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted">{n.category}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{n.detail}</p>
                <p className="mt-1 text-[10px] text-muted/70">{n.time}</p>
              </div>
              <div className="flex items-center gap-1">
                {!n.read && <button type="button" onClick={() => markRead(n.id)} title="Mark read" className="rounded-lg border border-surface-border px-2 py-1 text-[10px] font-semibold text-muted hover:text-brand-primary">Read</button>}
                <button type="button" onClick={() => remove(n.id)} title="Dismiss" className="rounded-lg p-1.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-surface-border bg-surface py-16 text-center">
            <Bell className="h-8 w-8 text-muted/50" />
            <p className="text-sm font-semibold">{notifs.length === 0 ? "No notifications" : "Nothing here"}</p>
            <p className="text-xs text-muted">You&apos;re all caught up 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
}
