"use client";

import { useMemo, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  KeyRound,
  Pencil,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";
import { downloadPdf } from "@/lib/pdf";

type Client = {
  name: string;
  manager: string;
  services: string;
  mrrNum: number;
  portal: "Active" | "Invited" | "Disabled";
  margin: number;
  projects: number;
  openInvoices: number;
  credentials: number;
  health: "Healthy" | "Watch" | "At Risk";
};

const INITIAL: Client[] = [
  { name: "Apex Infra Pvt Ltd", manager: "Aarav Sharma", services: "Website, Tech SEO, Hosting", mrrNum: 65000, portal: "Active", margin: 44, projects: 2, openInvoices: 1, credentials: 6, health: "Healthy" },
  { name: "Verve Healthcare", manager: "Neha Kapoor", services: "Local SEO, Google Ads, M365", mrrNum: 82000, portal: "Active", margin: 51, projects: 1, openInvoices: 2, credentials: 4, health: "Healthy" },
  { name: "Kroma Apparel", manager: "Vikram Patel", services: "Meta Ads, TikTok Ads, Email", mrrNum: 110000, portal: "Active", margin: 39, projects: 2, openInvoices: 0, credentials: 5, health: "Watch" },
  { name: "FinEdge Advisory", manager: "Aarav Sharma", services: "LinkedIn Ads, Content SEO", mrrNum: 55000, portal: "Invited", margin: 48, projects: 1, openInvoices: 1, credentials: 3, health: "At Risk" },
  { name: "Bloom Interiors", manager: "Sana Qureshi", services: "Branding, Website, SEO", mrrNum: 48000, portal: "Active", margin: 46, projects: 1, openInvoices: 1, credentials: 2, health: "Healthy" },
];

const healthTone = { Healthy: "bg-brand-green/15 text-brand-teal dark:text-brand-green", Watch: "bg-amber-500/10 text-amber-500", "At Risk": "bg-rose-500/10 text-rose-500" };
const portalTone = { Active: "bg-brand-green/15 text-brand-teal dark:text-brand-green", Invited: "bg-amber-500/10 text-amber-500", Disabled: "bg-muted/20 text-muted" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [managerFilter, setManagerFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [detail, setDetail] = useState<Client | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState("");
  const [manager, setManager] = useState("Aarav Sharma");
  const [services, setServices] = useState("SEO & Website");
  const [mrr, setMrr] = useState("50000");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const managers = useMemo(() => ["All", ...Array.from(new Set(clients.map((c) => c.manager)))], [clients]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const mM = managerFilter === "All" || c.manager === managerFilter;
      const mQ = !q || c.name.toLowerCase().includes(q) || c.services.toLowerCase().includes(q);
      return mM && mQ;
    });
  }, [clients, search, managerFilter]);

  const stats = useMemo(() => {
    const mrr = clients.reduce((s, c) => s + c.mrrNum, 0);
    const avgMargin = Math.round(clients.reduce((s, c) => s + c.margin, 0) / Math.max(1, clients.length));
    const active = clients.filter((c) => c.portal === "Active").length;
    return { mrr, avgMargin, active };
  }, [clients]);

  const KPIS = [
    { label: "Active Clients", value: `${clients.length}`, delta: `${stats.active} portals live`, color: "#0f67a6", spark: [34, 38, 41, 44, 46, clients.length + 43] },
    { label: "Monthly Recurring", value: `₹${(stats.mrr / 100000).toFixed(2)}L`, delta: "+12.4%", color: "#0eb57d", spark: [2.4, 2.8, 3.1, 3.3, 3.5, stats.mrr / 100000] },
    { label: "Avg Margin", value: `${stats.avgMargin}%`, delta: "healthy", color: "#1677e8", spark: [40, 42, 44, 45, 46, stats.avgMargin] },
    { label: "At-Risk Accounts", value: `${clients.filter((c) => c.health === "At Risk").length}`, delta: "needs attention", color: "#d97706", spark: [2, 1, 2, 1, 1, clients.filter((c) => c.health === "At Risk").length + 1] },
  ];

  function openCreate() {
    setEditingName(null);
    setName("");
    setManager("Aarav Sharma");
    setServices("SEO & Website");
    setMrr("50000");
    setModalOpen(true);
  }

  function openEdit(c: Client) {
    setEditingName(c.name);
    setName(c.name);
    setManager(c.manager);
    setServices(c.services);
    setMrr(String(c.mrrNum));
    setDetail(null);
    setModalOpen(true);
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingName) {
      setClients((prev) => prev.map((c) => (c.name === editingName ? { ...c, name: name.trim(), manager, services, mrrNum: parseInt(mrr) || c.mrrNum } : c)));
      setModalOpen(false);
      notify(`Client "${name.trim()}" updated.`);
      return;
    }
    setClients((prev) => [
      { name: name.trim(), manager, services, mrrNum: parseInt(mrr) || 50000, portal: "Active", margin: 45, projects: 0, openInvoices: 0, credentials: 0, health: "Healthy" },
      ...prev,
    ]);
    setModalOpen(false);
    notify(`Client "${name.trim()}" registered · onboarding checklist created.`);
  }

  function deleteClient(cname: string) {
    setClients((prev) => prev.filter((c) => c.name !== cname));
    setDetail(null);
    notify(`Client "${cname}" removed.`);
  }

  function downloadClientReport(c: Client) {
    const month = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    downloadPdf(`${c.name.replace(/\s+/g, "-")}-Report`, {
      docType: "Client Report",
      title: c.name,
      subtitle: `Monthly performance summary — ${month}`,
      meta: [
        ["Account Manager", c.manager],
        ["Services", c.services],
        ["Health", c.health],
        ["Portal", c.portal],
      ],
      columns: ["Metric", "Value"],
      alignRight: [1],
      rows: [
        ["Active Projects", String(c.projects)],
        ["Open Invoices", String(c.openInvoices)],
        ["Stored Credentials", String(c.credentials)],
        ["Monthly Retainer", `Rs.${c.mrrNum.toLocaleString("en-IN")}`],
        ["Profit Margin", `${c.margin}%`],
      ],
      note: "This report summarizes account activity for the period. Full dashboards available in the client portal.",
    });
    notify(`Monthly report for ${c.name} downloaded.`);
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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 02 · Client Management &amp; Portal</span>
          <h1 className="mt-1 text-2xl font-bold">360° Client Directory</h1>
          <p className="text-sm text-muted">One client, one complete record — projects, invoices, credentials, marketing &amp; portal access.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" />
          Register Client
        </button>
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
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients or services..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
        <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)} className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-muted focus:border-brand-primary focus:outline-none">
          {managers.map((m) => <option key={m}>{m === "All" ? "All Managers" : m}</option>)}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((c) => (
          <div key={c.name} className="rounded-2xl border border-surface-border bg-surface p-5 transition-colors hover:border-brand-primary/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-primary/10 p-2.5 text-brand-primary"><Building2 className="h-5 w-5" /></div>
                <div>
                  <button type="button" onClick={() => setDetail(c)} className="text-left text-base font-semibold hover:text-brand-primary">{c.name}</button>
                  <p className="text-xs text-muted">Account Manager: {c.manager}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${healthTone[c.health]}`}>{c.health}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${portalTone[c.portal]}`}><ShieldCheck className="h-2.5 w-2.5" />{c.portal}</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted">{c.services}</p>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-surface-border bg-background/50 py-1.5"><p className="text-sm font-bold">{c.projects}</p><p className="text-[10px] text-muted">Projects</p></div>
              <div className="rounded-lg border border-surface-border bg-background/50 py-1.5"><p className="text-sm font-bold">{c.openInvoices}</p><p className="text-[10px] text-muted">Open Inv.</p></div>
              <div className="rounded-lg border border-surface-border bg-background/50 py-1.5"><p className="text-sm font-bold">{c.credentials}</p><p className="text-[10px] text-muted">Secrets</p></div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-3 text-xs">
              <div>
                <span className="text-muted">Retainer: </span>
                <span className="font-bold text-foreground">₹{c.mrrNum.toLocaleString("en-IN")}</span>
                <span className="ml-2 text-brand-teal dark:text-brand-green">({c.margin}% margin)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => openEdit(c)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => deleteClient(c.name)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setDetail(c)} className="inline-flex items-center gap-1 font-semibold text-brand-primary hover:underline">
                  <Globe className="h-3.5 w-3.5" /> 360° View <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Register modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleRegister} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editingName ? "Edit Client" : "Register New Client"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Company / Client Name" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <input value={services} onChange={(e) => setServices(e.target.value)} placeholder="Services (e.g. SEO, Ads, Hosting)" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Account Manager" className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
                <input value={mrr} onChange={(e) => setMrr(e.target.value)} placeholder="Monthly Retainer (₹)" className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">{editingName ? "Save Changes" : "Save Client"}</button>
            </div>
          </form>
        </div>
      )}

      {/* 360 detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-surface-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{detail.name}</h2>
                <p className="text-sm text-muted">{detail.manager} · {detail.services}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${healthTone[detail.health]}`}>{detail.health}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${portalTone[detail.portal]}`}>Portal {detail.portal}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-surface-border bg-background/60 p-3"><p className="text-[10px] text-muted">Retainer</p><p className="text-sm font-bold">₹{detail.mrrNum.toLocaleString("en-IN")}/mo</p></div>
              <div className="rounded-xl border border-surface-border bg-background/60 p-3"><p className="text-[10px] text-muted">Margin</p><p className="text-sm font-bold text-brand-teal dark:text-brand-green">{detail.margin}%</p></div>
            </div>

            <p className="mt-5 mb-2 text-xs font-semibold">Linked Records</p>
            <div className="space-y-2">
              {[
                { icon: FolderKanban, label: "Active Projects", n: detail.projects },
                { icon: Receipt, label: "Open Invoices", n: detail.openInvoices },
                { icon: KeyRound, label: "Stored Credentials", n: detail.credentials },
                { icon: FileText, label: "Proposals & Quotations", n: 3 },
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <button key={r.label} type="button" onClick={() => notify(`Opening ${r.label} for ${detail.name}…`)} className="flex w-full items-center justify-between rounded-xl border border-surface-border bg-background/50 px-3.5 py-2.5 text-left hover:border-brand-primary/40">
                    <span className="inline-flex items-center gap-2 text-xs font-medium"><Icon className="h-4 w-4 text-brand-primary" /> {r.label}</span>
                    <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-semibold text-brand-primary">{r.n}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-surface-border bg-background/50 p-4">
              <p className="mb-1 text-xs font-semibold">Client Portal Access</p>
              <p className="text-[11px] text-muted">Can view: Projects &amp; Milestones · Approved Quotations · GST Invoices · SEO/Ads Reports · Support Tickets.</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => notify(`Portal preview opened for ${detail.name}.`)} className="flex-1 rounded-xl border border-surface-border px-4 py-2.5 text-xs font-semibold hover:border-brand-primary">Preview Portal</button>
              <button type="button" onClick={() => downloadClientReport(detail)} className="nova-gradient inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white"><TrendingUp className="h-3.5 w-3.5" /> Download Report</button>
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => openEdit(detail)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted hover:border-brand-primary hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /> Edit</button>
              <button type="button" onClick={() => deleteClient(detail.name)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-rose-500 hover:border-rose-400"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <Users className="h-5 w-5 text-brand-primary" />
        <p className="text-xs text-muted">{clients.length} clients · ₹{(stats.mrr / 100000).toFixed(2)}L total MRR · every record links to projects, finance, vault &amp; marketing.</p>
      </div>
    </div>
  );
}
