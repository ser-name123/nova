"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  LayoutTemplate,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";
import { downloadPdf } from "@/lib/pdf";

type Status = "Sent" | "Under Review" | "Approved" | "Rejected";
type LineItem = { desc: string; qty: number; rate: number };
type Proposal = {
  id: string;
  client: string;
  title: string;
  version: string;
  valueNum: number;
  opens: number;
  status: Status;
  template?: string;
  items?: LineItem[];
  taxPct?: number;
  discountPct?: number;
  validity?: number;
  terms?: string;
};

const statusTone: Record<Status, string> = {
  Sent: "bg-brand-primary/10 text-brand-primary",
  "Under Review": "bg-amber-500/10 text-amber-500",
  Approved: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
  Rejected: "bg-rose-500/10 text-rose-500",
};

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const KNOWN_CLIENTS = ["Apex Infra Pvt Ltd", "Verve Healthcare", "Kroma Apparel", "FinEdge Advisory", "Bloom Interiors", "Jain Logistics"];

const TEMPLATES: { name: string; desc: string; items: LineItem[] }[] = [
  { name: "Website & SEO", desc: "Corporate website build + technical SEO", items: [
    { desc: "Discovery & Strategy Workshop", qty: 1, rate: 30000 },
    { desc: "Website Design & Development", qty: 1, rate: 120000 },
    { desc: "Technical SEO Setup", qty: 1, rate: 45000 },
    { desc: "Monthly SEO Retainer", qty: 3, rate: 15000 },
  ] },
  { name: "Digital Marketing Retainer", desc: "Full-funnel monthly retainer", items: [
    { desc: "Strategy & Account Setup", qty: 1, rate: 25000 },
    { desc: "Social Media Management", qty: 1, rate: 40000 },
    { desc: "Content Creation", qty: 1, rate: 30000 },
    { desc: "Monthly Reporting", qty: 1, rate: 10000 },
  ] },
  { name: "Paid Ads Scale", desc: "Google + Meta performance scaling", items: [
    { desc: "Ad Account Audit & Setup", qty: 1, rate: 20000 },
    { desc: "Google Ads Management", qty: 1, rate: 35000 },
    { desc: "Meta Ads Management", qty: 1, rate: 30000 },
    { desc: "Creative Production", qty: 1, rate: 25000 },
  ] },
  { name: "Blank / Custom", desc: "Start from scratch", items: [{ desc: "", qty: 1, rate: 0 }] },
];

const INITIAL: Proposal[] = [
  { id: "PR-2026-041", client: "Apex Infra Pvt Ltd", title: "Corporate Website + Tech SEO", version: "v2.1", valueNum: 240000, opens: 3, status: "Sent", template: "Website & SEO", items: TEMPLATES[0].items, taxPct: 18, discountPct: 0, validity: 30 },
  { id: "PR-2026-040", client: "Verve Healthcare", title: "Local SEO & Google Ads Retainer", version: "v1.0", valueNum: 180000, opens: 5, status: "Approved", template: "Digital Marketing Retainer", items: TEMPLATES[1].items, taxPct: 18, discountPct: 0, validity: 30 },
  { id: "PR-2026-039", client: "Kroma Apparel", title: "Q4 Meta & TikTok Scale Plan", version: "v3.0", valueNum: 310000, opens: 1, status: "Under Review", template: "Paid Ads Scale", items: TEMPLATES[2].items, taxPct: 18, discountPct: 5, validity: 15 },
  { id: "PR-2026-038", client: "FinEdge Advisory", title: "LinkedIn B2B Lead Engine", version: "v1.2", valueNum: 150000, opens: 0, status: "Sent" },
  { id: "PR-2026-037", client: "Jain Logistics", title: "Cloud Migration & Hosting", version: "v2.0", valueNum: 95000, opens: 2, status: "Rejected" },
];

function calcTotals(items: LineItem[], discountPct: number, taxPct: number) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0);
  const discount = (subtotal * discountPct) / 100;
  const taxable = subtotal - discount;
  const tax = (taxable * taxPct) / 100;
  return { subtotal, discount, tax, total: taxable + tax };
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [detail, setDetail] = useState<Proposal | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Builder wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState("Website & SEO");
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [items, setItems] = useState<LineItem[]>(TEMPLATES[0].items);
  const [taxPct, setTaxPct] = useState(18);
  const [discountPct, setDiscountPct] = useState(0);
  const [validity, setValidity] = useState(30);
  const [terms, setTerms] = useState("50% advance, 50% on delivery. Prices exclude third-party ad spend. Proposal valid for the period stated.");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const totals = useMemo(() => calcTotals(items, discountPct, taxPct), [items, discountPct, taxPct]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return proposals.filter((p) => {
      const mS = statusFilter === "All" || p.status === statusFilter;
      const mQ = !q || p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      return mS && mQ;
    });
  }, [proposals, search, statusFilter]);

  const stats = useMemo(() => {
    const sentValue = proposals.reduce((s, p) => s + p.valueNum, 0);
    const approved = proposals.filter((p) => p.status === "Approved").length;
    const win = Math.round((approved / Math.max(1, proposals.length)) * 100);
    const avgOpens = (proposals.reduce((s, p) => s + p.opens, 0) / Math.max(1, proposals.length)).toFixed(1);
    return { sentValue, approved, win, avgOpens };
  }, [proposals]);

  const KPIS = [
    { label: "Proposed Value", value: `₹${(stats.sentValue / 100000).toFixed(2)}L`, delta: `${proposals.length} active`, color: "#0f67a6", spark: [6, 7, 8, 9, 9.5, stats.sentValue / 100000] },
    { label: "Approved", value: `${stats.approved}`, delta: "signed", color: "#0eb57d", spark: [1, 2, 2, 3, 3, stats.approved + 2] },
    { label: "Win Rate", value: `${stats.win}%`, delta: "MTD", color: "#1677e8", spark: [18, 22, 26, 30, 34, stats.win] },
    { label: "Avg Opens", value: stats.avgOpens, delta: "engagement", color: "#0d9488", spark: [1, 1.5, 2, 2.2, 2.1, parseFloat(stats.avgOpens)] },
  ];

  function pickTemplate(name: string) {
    setTemplate(name);
    const t = TEMPLATES.find((x) => x.name === name);
    if (t) setItems(t.items.map((it) => ({ ...it })));
  }

  function openCreate() {
    setEditingId(null);
    setStep(1);
    setTemplate("Website & SEO");
    setItems(TEMPLATES[0].items.map((it) => ({ ...it })));
    setTitle(""); setClient(""); setTaxPct(18); setDiscountPct(0); setValidity(30);
    setTerms("50% advance, 50% on delivery. Prices exclude third-party ad spend. Proposal valid for the period stated.");
    setWizardOpen(true);
  }

  function openEdit(p: Proposal) {
    setEditingId(p.id);
    setStep(1);
    setTemplate(p.template ?? "Blank / Custom");
    setItems(p.items ? p.items.map((it) => ({ ...it })) : [{ desc: p.title, qty: 1, rate: p.valueNum }]);
    setTitle(p.title); setClient(p.client);
    setTaxPct(p.taxPct ?? 18); setDiscountPct(p.discountPct ?? 0); setValidity(p.validity ?? 30);
    setTerms(p.terms ?? "50% advance, 50% on delivery.");
    setDetail(null);
    setWizardOpen(true);
  }

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { desc: "", qty: 1, rate: 0 }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  function buildProposal(): Proposal {
    const t = calcTotals(items, discountPct, taxPct);
    return {
      id: editingId ?? `PR-2026-0${42 + proposals.length}`,
      client: client.trim() || "Unnamed Client",
      title: title.trim() || `${template} Proposal`,
      version: editingId ? "v1.1" : "v1.0",
      valueNum: t.total,
      opens: 0,
      status: "Sent",
      template, items: items.filter((it) => it.desc.trim()), taxPct, discountPct, validity, terms,
    };
  }

  function save(download: boolean) {
    const p = buildProposal();
    if (editingId) {
      setProposals((prev) => prev.map((x) => (x.id === editingId ? { ...x, ...p, opens: x.opens, status: x.status, version: x.version } : x)));
      notify(`Proposal ${editingId} updated.`);
    } else {
      setProposals((prev) => [p, ...prev]);
      notify(`Proposal "${p.title}" created.`);
    }
    setWizardOpen(false);
    if (download) downloadProposal(p);
  }

  function deleteProposal(id: string) {
    setProposals((prev) => prev.filter((p) => p.id !== id));
    setDetail(null);
    notify(`Proposal ${id} deleted.`);
  }

  function downloadProposal(p: Proposal) {
    const its = p.items && p.items.length ? p.items : TEMPLATES[0].items;
    const t = calcTotals(its, p.discountPct ?? 0, p.taxPct ?? 18);
    downloadPdf(p.id, {
      docType: "Proposal",
      title: p.title,
      subtitle: `Prepared for ${p.client}`,
      meta: [
        ["Proposal No", p.id],
        ["Version", p.version],
        ["Client", p.client],
        ["Template", p.template ?? "Custom"],
        ["Valid For", `${p.validity ?? 30} days`],
      ],
      columns: ["Scope of Work", "Qty", "Rate", "Amount"],
      alignRight: [1, 2, 3],
      rows: its.map((it) => [it.desc, String(it.qty), fmt(it.rate), fmt(it.qty * it.rate)]),
      totals: [
        ["Subtotal", fmt(t.subtotal)],
        ...(p.discountPct ? ([[`Discount ${p.discountPct}%`, `- ${fmt(t.discount)}`]] as [string, string][]) : []),
        [`GST ${p.taxPct ?? 18}%`, fmt(t.tax)],
        ["Total Investment", fmt(t.total)],
      ],
      note: `${p.terms ?? ""} This proposal is confidential. Digital acceptance available.`,
    });
    notify(`${p.id} PDF downloaded.`);
  }

  function setStatus(id: string, status: Status) {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  const STEPS = ["Template", "Client & Scope", "Pricing & Terms", "Review"];
  const canNext = step === 1 ? !!template : step === 2 ? !!client.trim() && items.some((it) => it.desc.trim()) : true;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {toast && (
        <div className="fixed right-5 bottom-5 z-[70] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 01 · Proposal Management</span>
          <h1 className="mt-1 text-2xl font-bold">Branded Service Proposals</h1>
          <p className="text-sm text-muted">Version-controlled proposals with PDF export, open tracking, e-signature &amp; 1-click conversion.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" />
          New from Template
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
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search proposals..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Sent", "Under Review", "Approved", "Rejected"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((p) => (
          <div key={p.id} className="flex flex-col rounded-2xl border border-surface-border bg-surface p-5 transition-colors hover:border-brand-primary/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-brand-primary">{p.id}</span>
              <span className="inline-flex items-center gap-1 rounded bg-background px-2 py-0.5 text-[11px] font-medium text-muted"><History className="h-3 w-3" /> {p.version}</span>
            </div>
            <button type="button" onClick={() => setDetail(p)} className="mt-3 text-left text-base font-semibold hover:text-brand-primary">{p.title}</button>
            <p className="text-xs text-muted">{p.client}{p.template ? ` · ${p.template}` : ""}</p>
            <p className="mt-3 text-lg font-bold tabular-nums">{fmt(p.valueNum)}</p>
            <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3 text-xs">
              <span className="inline-flex items-center gap-1 text-muted"><Eye className="h-3.5 w-3.5" /> {p.opens === 0 ? "Not opened" : `Opened ${p.opens}x`}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusTone[p.status]}`}>{p.status}</span>
            </div>
            <div className="mt-3 flex gap-1.5">
              <button type="button" onClick={() => downloadProposal(p)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-surface-border py-1.5 text-[11px] font-semibold text-muted hover:text-brand-primary"><Download className="h-3.5 w-3.5" /> PDF</button>
              <button type="button" onClick={() => notify(`Reminder sent for ${p.id}.`)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-surface-border py-1.5 text-[11px] font-semibold text-muted hover:text-brand-primary"><Send className="h-3.5 w-3.5" /> Remind</button>
              {p.status === "Approved" && (
                <button type="button" onClick={() => notify(`${p.id} converted to Quotation.`)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-green/15 py-1.5 text-[11px] font-semibold text-brand-teal dark:text-brand-green"><ArrowRightLeft className="h-3.5 w-3.5" /> Convert</button>
              )}
              <button type="button" onClick={() => openEdit(p)} title="Edit" className="rounded-lg border border-surface-border px-2 py-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => deleteProposal(p.id)} title="Delete" className="rounded-lg border border-surface-border px-2 py-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Advanced Builder Wizard ---------- */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-xs" onClick={() => setWizardOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
            {/* Header + steps */}
            <div className="border-b border-surface-border p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold"><FileText className="h-4 w-4 text-brand-primary" /> {editingId ? "Edit Proposal" : "Proposal Builder"}</h2>
                <button type="button" onClick={() => setWizardOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                {STEPS.map((s, i) => {
                  const n = i + 1;
                  return (
                    <div key={s} className="flex flex-1 items-center gap-1.5">
                      <button type="button" onClick={() => n < step && setStep(n)} className={`flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold ${n === step ? "text-brand-primary" : n < step ? "text-brand-teal dark:text-brand-green" : "text-muted"}`}>
                        <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${n === step ? "nova-gradient text-white" : n < step ? "bg-brand-green/20 text-brand-teal dark:text-brand-green" : "bg-background text-muted"}`}>{n < step ? "✓" : n}</span>
                        <span className="hidden sm:inline">{s}</span>
                      </button>
                      {i < STEPS.length - 1 && <div className={`h-px flex-1 ${n < step ? "bg-brand-green/40" : "bg-surface-border"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="min-h-[300px] flex-1 overflow-y-auto p-5">
              {/* Step 1 — Template */}
              {step === 1 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {TEMPLATES.map((t) => (
                    <button key={t.name} type="button" onClick={() => pickTemplate(t.name)} className={`rounded-xl border p-4 text-left transition-colors ${template === t.name ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/30" : "border-surface-border hover:border-brand-primary/40"}`}>
                      <div className="flex items-center justify-between">
                        <LayoutTemplate className="h-5 w-5 text-brand-primary" />
                        {template === t.name && <CheckCircle2 className="h-4 w-4 text-brand-green" />}
                      </div>
                      <p className="mt-2 text-sm font-semibold">{t.name}</p>
                      <p className="text-[11px] text-muted">{t.desc}</p>
                      <p className="mt-1.5 text-[11px] font-semibold text-brand-primary">{t.items.filter((i) => i.desc).length || "—"} line items</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2 — Client & Scope */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Proposal Title</label>
                      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${template} Proposal`} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Client (auto-fills from CRM)</label>
                      <input list="nova-clients" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Select or type client" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                      <datalist id="nova-clients">{KNOWN_CLIENTS.map((c) => <option key={c} value={c} />)}</datalist>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-muted">Scope of Work · Line Items</label>
                      <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"><Plus className="h-3 w-3" /> Add line</button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2 px-1 text-[10px] font-semibold text-muted uppercase">
                        <span className="flex-1">Description</span><span className="w-12 text-center">Qty</span><span className="w-24 text-right">Rate</span><span className="w-24 text-right">Amount</span><span className="w-6" />
                      </div>
                      {items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input value={it.desc} onChange={(e) => updateItem(i, { desc: e.target.value })} placeholder="Deliverable..." className="flex-1 rounded-lg border border-surface-border bg-background px-2.5 py-1.5 text-xs focus:border-brand-primary focus:outline-none" />
                          <input type="number" min={1} value={it.qty} onChange={(e) => updateItem(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })} className="w-12 rounded-lg border border-surface-border bg-background px-1.5 py-1.5 text-center text-xs focus:border-brand-primary focus:outline-none" />
                          <input type="number" min={0} value={it.rate} onChange={(e) => updateItem(i, { rate: Math.max(0, parseInt(e.target.value) || 0) })} className="w-24 rounded-lg border border-surface-border bg-background px-2 py-1.5 text-right text-xs focus:border-brand-primary focus:outline-none" />
                          <span className="w-24 text-right text-xs font-semibold tabular-nums">{fmt(it.qty * it.rate)}</span>
                          <button type="button" onClick={() => removeItem(i)} className="w-6 rounded p-1 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-end text-xs"><span className="text-muted">Subtotal:&nbsp;</span><span className="font-bold tabular-nums">{fmt(totals.subtotal)}</span></div>
                  </div>
                </div>
              )}

              {/* Step 3 — Pricing & Terms */}
              {step === 3 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Discount (%)</label>
                      <input type="number" min={0} max={100} value={discountPct} onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Tax / GST (%)</label>
                      <select value={taxPct} onChange={(e) => setTaxPct(parseInt(e.target.value))} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none">
                        <option value={18}>18% (CGST+SGST / IGST)</option><option value={0}>0% (Export / LUT)</option><option value={5}>5%</option><option value={12}>12%</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Validity (days)</label>
                      <input type="number" min={1} value={validity} onChange={(e) => setValidity(Math.max(1, parseInt(e.target.value) || 30))} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Terms &amp; Conditions</label>
                      <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} className="w-full resize-none rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
                    </div>
                    <div className="rounded-xl border border-surface-border bg-background/60 p-3 text-xs">
                      <div className="flex justify-between py-0.5"><span className="text-muted">Subtotal</span><span className="tabular-nums">{fmt(totals.subtotal)}</span></div>
                      <div className="flex justify-between py-0.5"><span className="text-muted">Discount ({discountPct}%)</span><span className="tabular-nums text-rose-500">- {fmt(totals.discount)}</span></div>
                      <div className="flex justify-between py-0.5"><span className="text-muted">GST ({taxPct}%)</span><span className="tabular-nums">{fmt(totals.tax)}</span></div>
                      <div className="mt-1 flex justify-between border-t border-surface-border pt-1.5 font-bold"><span>Total</span><span className="tabular-nums text-brand-primary">{fmt(totals.total)}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 — Review */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-surface-border bg-background/40 p-4">
                    <p className="text-[11px] font-semibold text-brand-teal uppercase dark:text-brand-green">{template}</p>
                    <h3 className="mt-0.5 text-lg font-bold">{title || `${template} Proposal`}</h3>
                    <p className="text-xs text-muted">Prepared for {client || "—"} · valid {validity} days</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-surface-border">
                    <table className="w-full text-left text-xs">
                      <thead><tr className="bg-background/60 text-muted"><th className="px-3 py-2 font-medium">Item</th><th className="px-3 py-2 text-center font-medium">Qty</th><th className="px-3 py-2 text-right font-medium">Rate</th><th className="px-3 py-2 text-right font-medium">Amount</th></tr></thead>
                      <tbody className="divide-y divide-surface-border">
                        {items.filter((it) => it.desc.trim()).map((it, i) => (
                          <tr key={i}><td className="px-3 py-2">{it.desc}</td><td className="px-3 py-2 text-center tabular-nums">{it.qty}</td><td className="px-3 py-2 text-right tabular-nums">{fmt(it.rate)}</td><td className="px-3 py-2 text-right font-semibold tabular-nums">{fmt(it.qty * it.rate)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-3">
                    <span className="text-xs font-semibold text-muted">Total Investment</span>
                    <span className="text-lg font-bold text-brand-primary tabular-nums">{fmt(totals.total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-surface-border p-4">
              <button type="button" onClick={() => (step === 1 ? setWizardOpen(false) : setStep(step - 1))} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> {step === 1 ? "Cancel" : "Back"}
              </button>
              {step < 4 ? (
                <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => save(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold hover:border-brand-primary">{editingId ? "Save" : "Create"}</button>
                  <button type="button" onClick={() => save(true)} className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" /> {editingId ? "Save" : "Create"} &amp; PDF</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-surface-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-brand-primary">{detail.id} · {detail.version}</p>
                <h2 className="text-lg font-bold">{detail.title}</h2>
                <p className="text-sm text-muted">{detail.client}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-surface-border bg-background/60 p-3"><p className="text-[10px] text-muted">Value</p><p className="text-sm font-bold">{fmt(detail.valueNum)}</p></div>
              <div className="rounded-xl border border-surface-border bg-background/60 p-3"><p className="text-[10px] text-muted">Status</p><p className="text-sm font-bold">{detail.status}</p></div>
            </div>
            {detail.items && detail.items.length > 0 && (
              <>
                <p className="mt-5 mb-2 text-xs font-semibold">Line Items</p>
                <div className="space-y-1.5">
                  {detail.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-surface-border bg-background/50 px-3 py-1.5 text-xs">
                      <span className="text-foreground">{it.desc} <span className="text-muted">× {it.qty}</span></span>
                      <span className="font-semibold tabular-nums">{fmt(it.qty * it.rate)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <p className="mt-5 mb-2 text-xs font-semibold">Version History</p>
            <ol className="relative space-y-3 border-l border-surface-border pl-4 text-xs">
              {["v1.0 — Initial draft sent", "v1.1 — Revised scope & timeline", "v2.0 — Pricing updated after call", detail.version + " — Current (latest)"].map((v, i, arr) => (
                <li key={v} className="relative">
                  <span className={`absolute -left-[18px] top-1 h-2 w-2 rounded-full border-2 border-surface ${i === arr.length - 1 ? "bg-brand-green" : "bg-brand-primary"}`} />
                  <p className="text-foreground">{v}</p>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setStatus(detail.id, "Approved"); setDetail(null); notify(`${detail.id} marked Approved.`); }} className="flex-1 rounded-xl border border-surface-border px-4 py-2.5 text-xs font-semibold hover:border-brand-green">Mark Approved</button>
              <button type="button" onClick={() => downloadProposal(detail)} className="nova-gradient inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" /> Download PDF</button>
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => openEdit(detail)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted hover:border-brand-primary hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /> Edit</button>
              <button type="button" onClick={() => deleteProposal(detail.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-rose-500 hover:border-rose-400"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
