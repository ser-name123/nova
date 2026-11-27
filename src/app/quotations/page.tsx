"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LayoutTemplate,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";
import { downloadPdf } from "@/lib/pdf";

type Status = "Sent" | "Pending" | "Accepted" | "Rejected";
type LineItem = { desc: string; qty: number; rate: number; recurring: boolean };
type Milestone = { name: string; pct: number };
type Quote = {
  id: string;
  client: string;
  type: string;
  currency: string;
  symbol: string;
  fx: number;
  items: LineItem[];
  milestones: Milestone[];
  taxPct: number;
  discountPct: number;
  validUntil: string;
  status: Status;
};

const CURRENCIES = [
  { code: "INR", symbol: "₹", fx: 1 },
  { code: "USD", symbol: "$", fx: 83 },
  { code: "GBP", symbol: "£", fx: 105 },
  { code: "AED", symbol: "AED ", fx: 22.6 },
  { code: "EUR", symbol: "€", fx: 90 },
];

const TEMPLATES: { name: string; desc: string; items: LineItem[] }[] = [
  { name: "One-Time Project", desc: "Fixed-scope delivery", items: [
    { desc: "Website Design & Development", qty: 1, rate: 120000, recurring: false },
    { desc: "Technical SEO Setup", qty: 1, rate: 45000, recurring: false },
    { desc: "Content & Copywriting", qty: 1, rate: 35000, recurring: false },
  ] },
  { name: "Monthly Retainer", desc: "Recurring services", items: [
    { desc: "SEO Management (monthly)", qty: 1, rate: 25000, recurring: true },
    { desc: "Social Media Management (monthly)", qty: 1, rate: 30000, recurring: true },
    { desc: "Monthly Reporting", qty: 1, rate: 8000, recurring: true },
  ] },
  { name: "Recurring + One-Time", desc: "Setup + monthly", items: [
    { desc: "Account Setup & Strategy", qty: 1, rate: 40000, recurring: false },
    { desc: "Ads Management (monthly)", qty: 1, rate: 35000, recurring: true },
    { desc: "Creative Production (monthly)", qty: 1, rate: 20000, recurring: true },
  ] },
  { name: "Custom", desc: "Start blank", items: [{ desc: "", qty: 1, rate: 0, recurring: false }] },
];

const statusTone: Record<Status, string> = {
  Sent: "bg-brand-primary/10 text-brand-primary",
  Pending: "bg-amber-500/10 text-amber-500",
  Accepted: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
  Rejected: "bg-rose-500/10 text-rose-500",
};

function money(n: number, sym: string) {
  const v = sym === "₹" ? Math.round(n).toLocaleString("en-IN") : Math.round(n).toLocaleString("en-US");
  return `${sym}${v}`;
}
function calc(items: LineItem[], discountPct: number, taxPct: number) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0);
  const discount = (subtotal * discountPct) / 100;
  const taxable = subtotal - discount;
  const tax = (taxable * taxPct) / 100;
  return { subtotal, discount, tax, total: taxable + tax };
}
const KNOWN_CLIENTS = ["Apex Infra Pvt Ltd", "Verve Healthcare", "Kroma Apparel", "FinEdge Advisory", "Bloom Interiors", "Jain Logistics"];

const INITIAL: Quote[] = [
  { id: "QT-2026-218", client: "Verve Healthcare", type: "Recurring + One-Time", currency: "INR", symbol: "₹", fx: 1, items: TEMPLATES[2].items, milestones: [{ name: "Advance", pct: 50 }, { name: "On Delivery", pct: 50 }], taxPct: 18, discountPct: 0, validUntil: "05 Dec 2026", status: "Accepted" },
  { id: "QT-2026-219", client: "Apex Infra Pvt Ltd", type: "One-Time Project", currency: "INR", symbol: "₹", fx: 1, items: TEMPLATES[0].items, milestones: [{ name: "Advance", pct: 50 }, { name: "On Delivery", pct: 50 }], taxPct: 18, discountPct: 0, validUntil: "10 Dec 2026", status: "Pending" },
  { id: "QT-2026-220", client: "Kroma Apparel", type: "Monthly Retainer", currency: "USD", symbol: "$", fx: 83, items: TEMPLATES[1].items.map((i) => ({ ...i, rate: Math.round(i.rate / 83) })), milestones: [{ name: "Monthly in advance", pct: 100 }], taxPct: 0, discountPct: 0, validUntil: "15 Dec 2026", status: "Sent" },
];

export default function QuotationsPage() {
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState("One-Time Project");
  const [currency, setCurrency] = useState("INR");
  const [client, setClient] = useState("");
  const [items, setItems] = useState<LineItem[]>(TEMPLATES[0].items);
  const [milestones, setMilestones] = useState<Milestone[]>([{ name: "Advance", pct: 50 }, { name: "On Delivery", pct: 50 }]);
  const [taxPct, setTaxPct] = useState(18);
  const [discountPct, setDiscountPct] = useState(0);
  const [validUntil, setValidUntil] = useState("25 Dec 2026");

  const cur = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const totals = useMemo(() => calc(items, discountPct, taxPct), [items, discountPct, taxPct]);
  const milestoneSum = milestones.reduce((s, m) => s + m.pct, 0);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((x) => {
      const mS = statusFilter === "All" || x.status === statusFilter;
      const mQ = !q || x.client.toLowerCase().includes(q) || x.id.toLowerCase().includes(q);
      return mS && mQ;
    });
  }, [quotes, search, statusFilter]);

  const stats = useMemo(() => {
    const inr = (q: Quote) => calc(q.items, q.discountPct, q.taxPct).total * q.fx;
    const quoted = quotes.reduce((s, q) => s + inr(q), 0);
    const accepted = quotes.filter((q) => q.status === "Accepted");
    const acceptedVal = accepted.reduce((s, q) => s + inr(q), 0);
    const conv = Math.round((accepted.length / Math.max(1, quotes.length)) * 100);
    return { quoted, acceptedVal, accepted: accepted.length, conv };
  }, [quotes]);

  const KPIS = [
    { label: "Total Quoted", value: `₹${(stats.quoted / 100000).toFixed(2)}L`, delta: `${quotes.length} quotations`, color: "#0f67a6", spark: [6, 7, 8, 9, 9.5, stats.quoted / 100000] },
    { label: "Accepted Value", value: `₹${(stats.acceptedVal / 100000).toFixed(2)}L`, delta: `${stats.accepted} won`, color: "#0eb57d", spark: [2, 3, 3.5, 4, 4.5, stats.acceptedVal / 100000] },
    { label: "Conversion", value: `${stats.conv}%`, delta: "accept rate", color: "#1677e8", spark: [28, 32, 36, 40, 42, stats.conv] },
    { label: "Pending", value: `${quotes.filter((q) => q.status === "Pending" || q.status === "Sent").length}`, delta: "awaiting reply", color: "#d97706", spark: [1, 2, 2, 3, 2, 2] },
  ];

  function pickTemplate(name: string) {
    setTemplate(name);
    const t = TEMPLATES.find((x) => x.name === name);
    if (t) setItems(t.items.map((it) => ({ ...it })));
  }

  function openCreate() {
    setEditingId(null); setStep(1);
    setTemplate("One-Time Project"); setCurrency("INR");
    setItems(TEMPLATES[0].items.map((it) => ({ ...it })));
    setMilestones([{ name: "Advance", pct: 50 }, { name: "On Delivery", pct: 50 }]);
    setClient(""); setTaxPct(18); setDiscountPct(0); setValidUntil("25 Dec 2026");
    setWizardOpen(true);
  }

  function openEdit(q: Quote) {
    setEditingId(q.id); setStep(1);
    setTemplate(q.type); setCurrency(q.currency);
    setItems(q.items.map((it) => ({ ...it })));
    setMilestones(q.milestones.map((m) => ({ ...m })));
    setClient(q.client); setTaxPct(q.taxPct); setDiscountPct(q.discountPct); setValidUntil(q.validUntil);
    setWizardOpen(true);
  }

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function build(): Quote {
    return {
      id: editingId ?? `QT-2026-${221 + quotes.length}`,
      client: client.trim() || "Unnamed Client",
      type: template, currency: cur.code, symbol: cur.symbol, fx: cur.fx,
      items: items.filter((it) => it.desc.trim()),
      milestones, taxPct, discountPct, validUntil,
      status: "Sent",
    };
  }

  function save(download: boolean) {
    const q = build();
    if (editingId) {
      setQuotes((prev) => prev.map((x) => (x.id === editingId ? { ...q, status: x.status } : x)));
      notify(`${editingId} updated.`);
    } else {
      setQuotes((prev) => [q, ...prev]);
      notify(`Quotation sent to ${q.client}.`);
    }
    setWizardOpen(false);
    if (download) downloadQuote(q);
  }

  function deleteQuote(id: string) {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    notify(`${id} deleted.`);
  }
  function convert(q: Quote) {
    notify(`${q.id} converted to Invoice + Project.`);
  }
  function setStatus(id: string, status: Status) {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    notify(`${id} marked ${status}.`);
  }

  function downloadQuote(q: Quote) {
    const t = calc(q.items, q.discountPct, q.taxPct);
    downloadPdf(q.id, {
      docType: "Quotation",
      title: q.id,
      subtitle: `Prepared for ${q.client}`,
      meta: [
        ["Quotation No", q.id],
        ["Client", q.client],
        ["Billing", q.type],
        ["Currency", q.currency],
        ["Valid Until", q.validUntil],
      ],
      columns: ["Service Item", "Type", "Qty", "Amount"],
      alignRight: [2, 3],
      rows: q.items.map((it) => [it.desc, it.recurring ? "Monthly" : "One-time", String(it.qty), money(it.qty * it.rate, q.symbol)]),
      totals: [
        ["Subtotal", money(t.subtotal, q.symbol)],
        ...(q.discountPct ? ([[`Discount ${q.discountPct}%`, `- ${money(t.discount, q.symbol)}`]] as [string, string][]) : []),
        [`Tax ${q.taxPct}%`, money(t.tax, q.symbol)],
        ["Total", money(t.total, q.symbol)],
      ],
      note: `Payment milestones: ${q.milestones.map((m) => `${m.name} ${m.pct}%`).join(", ")}. Accepted quotations convert to invoice + project automatically.`,
    });
    notify(`${q.id} PDF downloaded.`);
  }

  const STEPS = ["Type & Currency", "Client & Items", "Tax & Milestones", "Review"];
  const canNext = step === 2 ? !!client.trim() && items.some((it) => it.desc.trim()) : true;

  function quoteTotal(q: Quote) {
    return money(calc(q.items, q.discountPct, q.taxPct).total, q.symbol);
  }

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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 01 · Quotation Management</span>
          <h1 className="mt-1 text-2xl font-bold">Multi-Currency Quotations</h1>
          <p className="text-sm text-muted">Item-wise pricing, recurring retainers, payment milestones &amp; 1-click Invoice / Project conversion.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" /> Build Quotation
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
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotations..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Sent", "Pending", "Accepted", "Rejected"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-muted">
                <th className="px-5 py-3 font-medium">Quotation #</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Billing Type</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Valid Until</th>
                <th className="px-5 py-3 text-right font-medium">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visible.map((q) => (
                <tr key={q.id} className="hover:bg-background/50">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-brand-primary">
                    <span className="inline-flex items-center gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />{q.id}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium">{q.client}</td>
                  <td className="px-4 py-3.5 text-xs text-muted">{q.type} · {q.currency}</td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums">{quoteTotal(q)}</td>
                  <td className="px-4 py-3.5 text-xs text-muted">{q.validUntil}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => downloadQuote(q)} title="Download PDF" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Download className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => openEdit(q)} title="Edit / Revise" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => deleteQuote(q.id)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      {q.status === "Accepted" ? (
                        <button type="button" onClick={() => convert(q)} className="inline-flex items-center gap-1 rounded-lg bg-brand-green/15 px-2.5 py-1 text-xs font-semibold text-brand-teal hover:bg-brand-green/25 dark:text-brand-green"><ArrowRightLeft className="h-3 w-3" /> Convert</button>
                      ) : q.status === "Rejected" ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusTone[q.status]}`}>{q.status}</span>
                      ) : (
                        <button type="button" onClick={() => setStatus(q.id, "Accepted")} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-transform hover:scale-105 ${statusTone[q.status]}`}>{q.status}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Builder Wizard ---------- */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-xs" onClick={() => setWizardOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
            <div className="border-b border-surface-border p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold"><FileSpreadsheet className="h-4 w-4 text-brand-primary" /> {editingId ? "Edit Quotation" : "Quotation Builder"}</h2>
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

            <div className="min-h-[300px] flex-1 overflow-y-auto p-5">
              {/* Step 1 — Type & Currency */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {TEMPLATES.map((t) => (
                      <button key={t.name} type="button" onClick={() => pickTemplate(t.name)} className={`rounded-xl border p-4 text-left transition-colors ${template === t.name ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/30" : "border-surface-border hover:border-brand-primary/40"}`}>
                        <div className="flex items-center justify-between"><LayoutTemplate className="h-5 w-5 text-brand-primary" />{template === t.name && <CheckCircle2 className="h-4 w-4 text-brand-green" />}</div>
                        <p className="mt-2 text-sm font-semibold">{t.name}</p>
                        <p className="text-[11px] text-muted">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">Currency</label>
                    <div className="flex flex-wrap gap-2">
                      {CURRENCIES.map((c) => (
                        <button key={c.code} type="button" onClick={() => setCurrency(c.code)} className={`rounded-xl border px-3.5 py-2 text-xs font-semibold ${currency === c.code ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-surface-border text-muted hover:text-foreground"}`}>{c.symbol.trim()} {c.code}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 — Client & Items */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Client (auto-fills from CRM)</label>
                    <input autoFocus list="nova-q-clients" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Select or type client" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                    <datalist id="nova-q-clients">{KNOWN_CLIENTS.map((c) => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-muted">Line Items ({cur.symbol.trim()})</label>
                      <button type="button" onClick={() => setItems((p) => [...p, { desc: "", qty: 1, rate: 0, recurring: false }])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"><Plus className="h-3 w-3" /> Add line</button>
                    </div>
                    <div className="space-y-2">
                      {items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input value={it.desc} onChange={(e) => updateItem(i, { desc: e.target.value })} placeholder="Service item..." className="flex-1 rounded-lg border border-surface-border bg-background px-2.5 py-1.5 text-xs focus:border-brand-primary focus:outline-none" />
                          <button type="button" onClick={() => updateItem(i, { recurring: !it.recurring })} title="Toggle recurring" className={`w-20 rounded-lg border px-1 py-1.5 text-[10px] font-semibold ${it.recurring ? "border-brand-green/40 bg-brand-green/10 text-brand-teal dark:text-brand-green" : "border-surface-border text-muted"}`}>{it.recurring ? "Monthly" : "One-time"}</button>
                          <input type="number" min={1} value={it.qty} onChange={(e) => updateItem(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })} className="w-12 rounded-lg border border-surface-border bg-background px-1.5 py-1.5 text-center text-xs focus:border-brand-primary focus:outline-none" />
                          <input type="number" min={0} value={it.rate} onChange={(e) => updateItem(i, { rate: Math.max(0, parseInt(e.target.value) || 0) })} className="w-24 rounded-lg border border-surface-border bg-background px-2 py-1.5 text-right text-xs focus:border-brand-primary focus:outline-none" />
                          <button type="button" onClick={() => setItems((p) => (p.length > 1 ? p.filter((_, x) => x !== i) : p))} className="rounded p-1 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-end text-xs"><span className="text-muted">Subtotal:&nbsp;</span><span className="font-bold tabular-nums">{money(totals.subtotal, cur.symbol)}</span></div>
                  </div>
                </div>
              )}

              {/* Step 3 — Tax & Milestones */}
              {step === 3 && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Discount (%)</label>
                      <input type="number" min={0} max={100} value={discountPct} onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Tax (%)</label>
                      <select value={taxPct} onChange={(e) => setTaxPct(parseInt(e.target.value))} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none">
                        <option value={18}>18%</option><option value={0}>0% (Export)</option><option value={5}>5%</option><option value={12}>12%</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Valid Until</label>
                      <input value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-muted">Payment Milestones</label>
                      <button type="button" onClick={() => setMilestones((p) => [...p, { name: "Milestone", pct: 0 }])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"><Plus className="h-3 w-3" /> Add</button>
                    </div>
                    <div className="space-y-2">
                      {milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input value={m.name} onChange={(e) => setMilestones((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="flex-1 rounded-lg border border-surface-border bg-background px-2.5 py-1.5 text-xs focus:border-brand-primary focus:outline-none" />
                          <input type="number" min={0} max={100} value={m.pct} onChange={(e) => setMilestones((p) => p.map((x, j) => (j === i ? { ...x, pct: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) } : x)))} className="w-16 rounded-lg border border-surface-border bg-background px-2 py-1.5 text-right text-xs focus:border-brand-primary focus:outline-none" />
                          <span className="text-xs text-muted">%</span>
                          <button type="button" onClick={() => setMilestones((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p))} className="rounded p-1 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <p className={`mt-1.5 text-[11px] font-semibold ${milestoneSum === 100 ? "text-brand-teal dark:text-brand-green" : "text-amber-500"}`}>Milestones total: {milestoneSum}% {milestoneSum !== 100 && "(should be 100%)"}</p>
                    <div className="mt-3 rounded-xl border border-surface-border bg-background/60 p-3 text-xs">
                      <div className="flex justify-between py-0.5"><span className="text-muted">Subtotal</span><span className="tabular-nums">{money(totals.subtotal, cur.symbol)}</span></div>
                      <div className="flex justify-between py-0.5"><span className="text-muted">Tax</span><span className="tabular-nums">{money(totals.tax, cur.symbol)}</span></div>
                      <div className="mt-1 flex justify-between border-t border-surface-border pt-1.5 font-bold"><span>Total</span><span className="tabular-nums text-brand-primary">{money(totals.total, cur.symbol)}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 — Review */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-surface-border bg-background/40 p-4">
                    <p className="text-[11px] font-semibold text-brand-teal uppercase dark:text-brand-green">{template} · {cur.code}</p>
                    <h3 className="mt-0.5 text-lg font-bold">Quotation for {client || "—"}</h3>
                    <p className="text-xs text-muted">Valid until {validUntil}</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-surface-border">
                    <table className="w-full text-left text-xs">
                      <thead><tr className="bg-background/60 text-muted"><th className="px-3 py-2 font-medium">Item</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 text-right font-medium">Amount</th></tr></thead>
                      <tbody className="divide-y divide-surface-border">
                        {items.filter((it) => it.desc.trim()).map((it, i) => (
                          <tr key={i}><td className="px-3 py-2">{it.desc}</td><td className="px-3 py-2 text-muted">{it.recurring ? "Monthly" : "One-time"}</td><td className="px-3 py-2 text-right font-semibold tabular-nums">{money(it.qty * it.rate, cur.symbol)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-3">
                    <span className="text-xs font-semibold text-muted">Total ({cur.code})</span>
                    <span className="text-lg font-bold text-brand-primary tabular-nums">{money(totals.total, cur.symbol)}</span>
                  </div>
                  <p className="text-[11px] text-muted">Milestones: {milestones.map((m) => `${m.name} ${m.pct}%`).join(" · ")}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-surface-border p-4">
              <button type="button" onClick={() => (step === 1 ? setWizardOpen(false) : setStep(step - 1))} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> {step === 1 ? "Cancel" : "Back"}</button>
              {step < 4 ? (
                <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">Next <ArrowRight className="h-3.5 w-3.5" /></button>
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
    </div>
  );
}
