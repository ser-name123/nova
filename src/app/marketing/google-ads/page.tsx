"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Megaphone,
  Pause,
  Pencil,
  Play,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Campaign = {
  id: string;
  name: string;
  type: string;
  client: string;
  spend: number;
  budget: number;
  clicks: string;
  conv: number;
  roas: string;
  active: boolean;
};

const INITIAL: Campaign[] = [
  { id: "GA-101", name: "Verve Dental — Search High Intent", type: "Search", client: "Verve Healthcare", spend: 142000, budget: 160000, clicks: "4,820", conv: 194, roas: "4.6x", active: true },
  { id: "GA-102", name: "Apex Infra — Brand + Commercial PMax", type: "Performance Max", client: "Apex Infra", spend: 185000, budget: 200000, clicks: "9,140", conv: 118, roas: "3.9x", active: true },
  { id: "GA-103", name: "Kroma Apparel — Shopping Feed Q4", type: "Shopping", client: "Kroma Apparel", spend: 153000, budget: 160000, clicks: "12,400", conv: 210, roas: "4.4x", active: false },
  { id: "GA-104", name: "FinEdge — Lead Gen Search", type: "Search", client: "FinEdge Advisory", spend: 68000, budget: 90000, clicks: "2,180", conv: 54, roas: "3.2x", active: true },
];

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function GoogleAdsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [newBudget, setNewBudget] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  const types = useMemo(() => ["All", ...Array.from(new Set(campaigns.map((c) => c.type)))], [campaigns]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      const mT = typeFilter === "All" || c.type === typeFilter;
      const mQ = !q || c.name.toLowerCase().includes(q) || c.client.toLowerCase().includes(q);
      return mT && mQ;
    });
  }, [campaigns, search, typeFilter]);

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);

  const KPIS = [
    { label: "Total Ad Spend", value: `₹${(totalSpend / 100000).toFixed(2)}L`, delta: "+9.8%", color: "#0f67a6", spend: true, spark: [3.2, 3.6, 4, 4.3, 4.6, totalSpend / 100000] },
    { label: "Total Clicks", value: "28.5K", delta: "+12%", color: "#1677e8", spark: [18, 20, 23, 25, 27, 28.5] },
    { label: "Conversions", value: `${campaigns.reduce((s, c) => s + c.conv, 0)}`, delta: "+14%", color: "#0eb57d", spark: [380, 420, 460, 500, 540, 576] },
    { label: "Blended ROAS", value: "4.3x", delta: "above target", color: "#0d9488", spark: [3.4, 3.7, 3.9, 4.1, 4.2, 4.3] },
  ];

  function toggleCampaign(id: string) {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
    const c = campaigns.find((x) => x.id === id);
    if (c) notify(`${c.name} ${c.active ? "paused" : "resumed"}.`);
  }

  function openEdit(c: Campaign) {
    setEditing(c);
    setNewBudget(String(c.budget));
  }

  function deleteCampaign(id: string) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    notify(`Campaign ${id} removed.`);
  }

  function submitBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    notify(`Budget change for ${editing.id} (${fmt(editing.budget)} → ${fmt(parseInt(newBudget) || editing.budget)}) sent for Manager Approval.`);
    setEditing(null);
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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 05 · Digital Advertising</span>
          <h1 className="mt-1 text-2xl font-bold">Google Ads Manager</h1>
          <p className="text-sm text-muted">Search, Display, Shopping, Video &amp; Performance Max with budget alerts &amp; approval workflows.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500">
          <ShieldAlert className="h-4 w-4" />
          Budget edits require Manager Approval
        </span>
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
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button key={t} type="button" onClick={() => setTypeFilter(t)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${typeFilter === t ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="border-b border-surface-border px-5 py-3.5 text-sm font-semibold">Connected Client Campaigns</div>
        <div className="divide-y divide-surface-border">
          {visible.map((c) => {
            const pacing = Math.round((c.spend / c.budget) * 100);
            return (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 hover:bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-brand-primary/10 p-2.5 text-brand-primary"><Megaphone className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">{c.client} · {c.type} · {c.id}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-background"><div className={`h-full rounded-full ${pacing > 90 ? "bg-rose-500" : "nova-gradient"}`} style={{ width: `${Math.min(100, pacing)}%` }} /></div>
                      <span className="text-[10px] text-muted">{fmt(c.spend)} / {fmt(c.budget)} ({pacing}%)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
                  <div><span className="text-muted">Clicks </span><span className="font-semibold">{c.clicks}</span></div>
                  <div><span className="text-muted">Conv </span><span className="font-semibold">{c.conv}</span></div>
                  <span className="font-bold text-brand-teal dark:text-brand-green">{c.roas} ROAS</span>
                  <button type="button" onClick={() => openEdit(c)} title="Edit budget (approval)" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => deleteCampaign(c.id)} title="Delete campaign" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => toggleCampaign(c.id)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold ${c.active ? "bg-brand-green/15 text-brand-teal dark:text-brand-green" : "bg-surface-border text-muted"}`}>
                    {c.active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {c.active ? "Active" : "Paused"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setEditing(null)}>
          <form onSubmit={submitBudget} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Edit Budget · {editing.id}</h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-muted">{editing.name}</p>
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-500">
              <ShieldAlert className="h-4 w-4 shrink-0" /> This is a sensitive change — it will be queued for Manager Approval before going live.
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Monthly Budget (₹)</label>
              <input autoFocus value={newBudget} onChange={(e) => setNewBudget(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">Submit for Approval</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
