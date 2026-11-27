"use client";

import { useMemo, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Plug,
  RefreshCw,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Status = "Connected" | "Error" | "Disconnected";
type Integration = {
  name: string;
  purpose: string;
  group: string;
  status: Status;
  lastSync: string;
  rate: number; // % of rate limit used
};

const INITIAL: Integration[] = [
  { name: "Google Ads", purpose: "Ads management & reporting", group: "Advertising", status: "Connected", lastSync: "2m ago", rate: 42 },
  { name: "Google Analytics 4", purpose: "GA4 traffic reporting", group: "Analytics", status: "Connected", lastSync: "5m ago", rate: 28 },
  { name: "Search Console", purpose: "Search performance & indexing", group: "Analytics", status: "Connected", lastSync: "11m ago", rate: 19 },
  { name: "Meta Marketing", purpose: "FB & IG ads + lead forms", group: "Advertising", status: "Connected", lastSync: "4m ago", rate: 61 },
  { name: "TikTok Marketing", purpose: "TikTok ads & reporting", group: "Advertising", status: "Error", lastSync: "Token expired", rate: 0 },
  { name: "LinkedIn Marketing", purpose: "B2B ads & lead gen forms", group: "Advertising", status: "Connected", lastSync: "19m ago", rate: 12 },
  { name: "WhatsApp Business", purpose: "Templates, inbox & automation", group: "Communication", status: "Connected", lastSync: "1m ago", rate: 74 },
  { name: "Gmail API", purpose: "Email sync & logging", group: "Communication", status: "Connected", lastSync: "3m ago", rate: 33 },
  { name: "Bing Webmaster", purpose: "Bing search & crawl", group: "Analytics", status: "Disconnected", lastSync: "Never", rate: 0 },
  { name: "Stripe", purpose: "International payments", group: "Payments", status: "Connected", lastSync: "8m ago", rate: 9 },
  { name: "Razorpay", purpose: "India payment collection", group: "Payments", status: "Connected", lastSync: "6m ago", rate: 15 },
  { name: "Google Calendar", purpose: "Meeting scheduling sync", group: "Communication", status: "Error", lastSync: "Needs re-auth", rate: 0 },
];

const statusTone: Record<Status, string> = {
  Connected: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
  Error: "bg-rose-500/10 text-rose-500",
  Disconnected: "bg-muted/15 text-muted",
};

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>(INITIAL);
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const groups = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.group)))], [items]);
  const visible = useMemo(() => (filter === "All" ? items : items.filter((i) => i.group === filter)), [items, filter]);

  const stats = useMemo(() => {
    const connected = items.filter((i) => i.status === "Connected").length;
    const errors = items.filter((i) => i.status === "Error").length;
    const avgRate = Math.round(items.filter((i) => i.status === "Connected").reduce((s, i) => s + i.rate, 0) / Math.max(1, items.filter((i) => i.status === "Connected").length));
    return { connected, errors, avgRate };
  }, [items]);

  const KPIS = [
    { label: "Connected", value: `${stats.connected}`, delta: `${items.length} total`, color: "#0eb57d", spark: [6, 7, 8, 9, 9, stats.connected] },
    { label: "Needs Attention", value: `${stats.errors}`, delta: "re-auth required", color: "#e11d48", spark: [0, 1, 1, 2, 1, stats.errors + 1] },
    { label: "API Calls (24h)", value: "48.2K", delta: "+9%", color: "#0f67a6", spark: [30, 34, 38, 42, 45, 48.2] },
    { label: "Avg Rate-Limit", value: `${stats.avgRate}%`, delta: "healthy headroom", color: "#1677e8", spark: [20, 24, 28, 30, 32, stats.avgRate] },
  ];

  function connect(name: string) {
    setItems((prev) => prev.map((i) => (i.name === name ? { ...i, status: "Connected", lastSync: "Just now", rate: 10 } : i)));
    notify(`${name} connected via OAuth.`);
  }

  function disconnect(name: string) {
    setItems((prev) => prev.map((i) => (i.name === name ? { ...i, status: "Disconnected", lastSync: "Never", rate: 0 } : i)));
    notify(`${name} disconnected.`);
  }

  function reconnect(name: string) {
    setItems((prev) => prev.map((i) => (i.name === name ? { ...i, status: "Connected", lastSync: "Just now", rate: 14 } : i)));
    notify(`${name} token refreshed.`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {toast && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div>
        <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Administration · Integrations</span>
        <h1 className="mt-1 text-2xl font-bold">OAuth Connections &amp; API Health</h1>
        <p className="text-sm text-muted">Centralized token management, secure refresh, rate-limit handling &amp; connection health across every platform.</p>
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

      {stats.errors > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-500">
          <ShieldAlert className="h-4 w-4 shrink-0" /> {stats.errors} integration(s) need re-authentication. Automated reconnection alerts have been sent to the admin.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <button key={g} type="button" onClick={() => setFilter(g)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${filter === g ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>{g}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((i) => (
          <div key={i.name} className="flex flex-col rounded-2xl border border-surface-border bg-surface p-5 transition-colors hover:border-brand-primary/40">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-primary/10 text-brand-primary"><Plug className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-semibold">{i.name}</p>
                  <p className="text-[11px] text-muted">{i.group}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[i.status]}`}>{i.status}</span>
            </div>
            <p className="mt-3 text-xs text-muted">{i.purpose}</p>

            {i.status === "Connected" && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-muted"><span>Rate-limit used</span><span className="tabular-nums">{i.rate}%</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background"><div className={`h-full rounded-full ${i.rate > 80 ? "bg-rose-500" : "nova-gradient"}`} style={{ width: `${i.rate}%` }} /></div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted"><Activity className="h-3 w-3" /> {i.lastSync}</span>
              {i.status === "Connected" ? (
                <button type="button" onClick={() => disconnect(i.name)} className="rounded-lg border border-surface-border px-3 py-1 text-[11px] font-semibold text-muted hover:text-rose-500">Disconnect</button>
              ) : i.status === "Error" ? (
                <button type="button" onClick={() => reconnect(i.name)} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-500"><RefreshCw className="h-3 w-3" /> Re-auth</button>
              ) : (
                <button type="button" onClick={() => connect(i.name)} className="nova-gradient inline-flex items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-semibold text-white"><Zap className="h-3 w-3" /> Connect</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <Plug className="h-5 w-5 text-brand-primary" />
        <p className="text-xs text-muted">Not every platform exposes every feature via API — availability depends on account type, approvals &amp; quotas. NOVA ONE tracks per-platform feature availability &amp; logs API errors.</p>
      </div>
    </div>
  );
}
