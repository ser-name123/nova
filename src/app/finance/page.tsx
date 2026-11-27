"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Download,
  IndianRupee,
  Landmark,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";
import { downloadPdf } from "@/lib/pdf";

type Status = "Paid" | "Pending" | "Overdue";
type LineItem = { desc: string; qty: number; rate: number };
type Invoice = {
  id: string;
  client: string;
  currency: string;
  symbol: string;
  fx: number;
  items: LineItem[];
  taxPct: number;
  discountPct: number;
  gstLabel: string;
  dueDate: string;
  gateway: string;
  status: Status;
  age: number;
};

const CURRENCIES = [
  { code: "INR", symbol: "₹", fx: 1 },
  { code: "USD", symbol: "$", fx: 83 },
  { code: "GBP", symbol: "£", fx: 105 },
  { code: "AED", symbol: "AED ", fx: 22.6 },
  { code: "EUR", symbol: "€", fx: 90 },
];
const GATEWAYS = ["Razorpay", "Stripe", "PayPal", "Payment Link", "Bank Transfer"];
const KNOWN_CLIENTS = ["Apex Infra Pvt Ltd", "Verve Healthcare", "Kroma Apparel", "FinEdge Advisory", "Bloom Interiors"];

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
const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const invTotal = (i: Invoice) => calc(i.items, i.discountPct, i.taxPct).total;
const invINR = (i: Invoice) => invTotal(i) * i.fx;

const mk = (client: string, items: LineItem[], cur: string, tax: number, status: Status, age: number, gateway: string, gstLabel: string, due: string, id: string): Invoice => {
  const c = CURRENCIES.find((x) => x.code === cur)!;
  return { id, client, currency: cur, symbol: c.symbol, fx: c.fx, items, taxPct: tax, discountPct: 0, gstLabel, dueDate: due, gateway, status, age };
};

const INITIAL: Invoice[] = [
  mk("Apex Infra Pvt Ltd", [{ desc: "Website + Tech SEO (Milestone 2)", qty: 1, rate: 65000 }], "INR", 18, "Paid", 0, "Razorpay", "CGST+SGST 18%", "28 Nov 2026", "INV-2026-104"),
  mk("Verve Healthcare", [{ desc: "Local SEO + Google Ads retainer", qty: 1, rate: 82000 }], "INR", 18, "Pending", 12, "Payment Link", "CGST+SGST 18%", "10 Dec 2026", "INV-2026-105"),
  mk("Kroma Apparel", [{ desc: "Meta & TikTok management", qty: 1, rate: 2400 }], "USD", 0, "Overdue", 41, "Stripe", "Export (0% LUT)", "02 Nov 2026", "INV-2026-106"),
  mk("FinEdge Advisory", [{ desc: "LinkedIn B2B ads retainer", qty: 1, rate: 120000 }], "INR", 18, "Pending", 6, "Payment Link", "IGST 18%", "15 Dec 2026", "INV-2026-107"),
  mk("Bloom Interiors", [{ desc: "Brand site build", qty: 1, rate: 50000 }], "INR", 18, "Paid", 0, "Razorpay", "CGST+SGST 18%", "20 Nov 2026", "INV-2026-108"),
];

const statusTone: Record<Status, string> = {
  Paid: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
  Pending: "bg-amber-500/10 text-amber-500",
  Overdue: "bg-rose-500/10 text-rose-500",
};

const TRIAL_BALANCE = [
  { acct: "Cash & Bank", type: "Asset", debit: 1820000, credit: 0 },
  { acct: "Accounts Receivable", type: "Asset", debit: 437560, credit: 0 },
  { acct: "Service Revenue", type: "Income", debit: 0, credit: 1285000 },
  { acct: "GST Output Payable", type: "Liability", debit: 0, credit: 142300 },
  { acct: "Salaries & Wages", type: "Expense", debit: 520000, credit: 0 },
  { acct: "Ad Spend (Pass-through)", type: "Expense", debit: 273000, credit: 0 },
  { acct: "Software & Hosting", type: "Expense", debit: 86400, credit: 0 },
];

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL);
  const [tab, setTab] = useState<"invoices" | "accounting" | "gst">("invoices");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Builder
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [client, setClient] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [items, setItems] = useState<LineItem[]>([{ desc: "", qty: 1, rate: 0 }]);
  const [taxPct, setTaxPct] = useState(18);
  const [discountPct, setDiscountPct] = useState(0);
  const [gstLabel, setGstLabel] = useState("CGST+SGST 18%");
  const [gateway, setGateway] = useState("Razorpay");
  const [dueDate, setDueDate] = useState("15 Dec 2026");

  const cur = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const totals = useMemo(() => calc(items, discountPct, taxPct), [items, discountPct, taxPct]);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      const mS = statusFilter === "All" || i.status === statusFilter;
      const mQ = !q || i.client.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
      return mS && mQ;
    });
  }, [invoices, statusFilter, search]);

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + invINR(i), 0);
    const receivable = invoices.filter((i) => i.status !== "Paid").reduce((s, i) => s + invINR(i), 0);
    const overdue = invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + invINR(i), 0);
    return { paid, receivable, overdue };
  }, [invoices]);

  const KPIS = [
    { label: "Collected (MTD)", value: fmtINR(stats.paid), delta: "+18.4%", color: "#0eb57d", spark: [5, 6, 7, 8, 9, stats.paid / 100000] },
    { label: "Outstanding", value: fmtINR(stats.receivable), delta: `${invoices.filter((i) => i.status !== "Paid").length} open`, color: "#d97706", spark: [4, 3, 5, 4, 6, stats.receivable / 100000] },
    { label: "Overdue", value: fmtINR(stats.overdue), delta: "needs follow-up", color: "#e11d48", spark: [1, 2, 1, 3, 2, stats.overdue / 100000 + 1] },
    { label: "Bank & Cash", value: "₹18.20L", delta: "balanced", color: "#1677e8", spark: [14, 15, 16, 17, 17.5, 18.2] },
  ];

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function openCreate() {
    setEditingId(null); setStep(1);
    setClient(""); setCurrency("INR"); setItems([{ desc: "", qty: 1, rate: 0 }]);
    setTaxPct(18); setDiscountPct(0); setGstLabel("CGST+SGST 18%"); setGateway("Razorpay"); setDueDate("15 Dec 2026");
    setWizardOpen(true);
  }
  function openEdit(inv: Invoice) {
    setEditingId(inv.id); setStep(1);
    setClient(inv.client); setCurrency(inv.currency); setItems(inv.items.map((it) => ({ ...it })));
    setTaxPct(inv.taxPct); setDiscountPct(inv.discountPct); setGstLabel(inv.gstLabel); setGateway(inv.gateway); setDueDate(inv.dueDate);
    setWizardOpen(true);
  }

  function build(): Invoice {
    return {
      id: editingId ?? `INV-2026-${109 + invoices.length}`,
      client: client.trim() || "Unnamed Client",
      currency: cur.code, symbol: cur.symbol, fx: cur.fx,
      items: items.filter((it) => it.desc.trim()).length ? items.filter((it) => it.desc.trim()) : [{ desc: "Services", qty: 1, rate: totals.subtotal }],
      taxPct, discountPct, gstLabel, dueDate, gateway, status: "Pending", age: 0,
    };
  }

  function save(download: boolean) {
    const inv = build();
    if (editingId) {
      setInvoices((prev) => prev.map((x) => (x.id === editingId ? { ...inv, status: x.status, age: x.age } : x)));
      notify(`${editingId} updated.`);
    } else {
      setInvoices((prev) => [inv, ...prev]);
      notify(`Invoice issued to ${inv.client} · payment link sent.`);
    }
    setWizardOpen(false);
    if (download) downloadInvoice(inv);
  }

  function markPaid(id: string) {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: "Paid", age: 0 } : inv)));
    notify(`${id} marked Paid · journal entry posted.`);
  }
  function deleteInvoice(id: string) {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    notify(`${id} deleted.`);
  }

  function downloadInvoice(inv: Invoice) {
    const t = calc(inv.items, inv.discountPct, inv.taxPct);
    downloadPdf(inv.id, {
      docType: "Tax Invoice",
      title: inv.id,
      subtitle: `Billed to ${inv.client}`,
      meta: [
        ["Invoice No", inv.id],
        ["Client", inv.client],
        ["Due Date", inv.dueDate],
        ["Payment", inv.gateway],
        ["Tax", inv.gstLabel],
      ],
      columns: ["Description", "Qty", "Rate", "Amount"],
      alignRight: [1, 2, 3],
      rows: inv.items.map((it) => [it.desc, String(it.qty), money(it.rate, inv.symbol), money(it.qty * it.rate, inv.symbol)]),
      totals: [
        ["Subtotal", money(t.subtotal, inv.symbol)],
        ...(inv.discountPct ? ([[`Discount ${inv.discountPct}%`, `- ${money(t.discount, inv.symbol)}`]] as [string, string][]) : []),
        [inv.gstLabel, money(t.tax, inv.symbol)],
        ["Total Payable", money(t.total, inv.symbol)],
      ],
      note: "HSN/SAC mapped. Export invoices under LUT (0%). Thank you for your business.",
    });
    notify(`${inv.id} PDF downloaded.`);
  }

  const gstOutput = Math.round(invoices.filter((i) => i.taxPct > 0).reduce((s, i) => s + calc(i.items, i.discountPct, i.taxPct).tax * i.fx, 0));
  const gstInput = 48200;

  const tabs = [
    { key: "invoices" as const, label: "Invoices" },
    { key: "accounting" as const, label: "Accounting" },
    { key: "gst" as const, label: "GST Summary" },
  ];

  const STEPS = ["Client & Currency", "Line Items & GST", "Review"];
  const canNext = step === 1 ? !!client.trim() : step === 2 ? items.some((it) => it.desc.trim() && it.rate > 0) : true;

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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 07 · Finance &amp; Double-Entry Accounting</span>
          <h1 className="mt-1 text-2xl font-bold">Invoices, GST &amp; Accounting Ledger</h1>
          <p className="text-sm text-muted">Double-entry Chart of Accounts · CGST/SGST/IGST · TDS · Multi-Currency (INR/USD/GBP/AED/EUR) &amp; gateways.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" /> Build GST Invoice
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-surface-border bg-surface p-4 shadow-xs transition-colors hover:border-brand-primary/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted">{k.label}</p>
                <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">{k.value}</p>
              </div>
              <MiniSparkline points={k.spark} color={k.color} />
            </div>
            <p className="mt-2 text-xs font-semibold" style={{ color: k.color }}>{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border px-4 py-2.5">
          <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-background/70 p-1">
            {tabs.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === t.key ? "nova-gradient text-white shadow-xs" : "text-muted hover:text-foreground"}`}>{t.label}</button>
            ))}
          </div>
          {tab === "invoices" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." className="w-full rounded-lg border border-surface-border bg-background py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
              </div>
              {(["All", "Paid", "Pending", "Overdue"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "nova-gradient text-white" : "border border-surface-border text-muted hover:text-foreground"}`}>{s}</button>
              ))}
            </div>
          )}
        </div>

        {tab === "invoices" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Invoice #</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Tax / GST</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Aging</th>
                  <th className="px-4 py-3 font-medium">Gateway</th>
                  <th className="px-5 py-3 text-right font-medium">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {visible.map((inv) => (
                  <tr key={inv.id} className="hover:bg-background/50">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-brand-primary">{inv.id}</td>
                    <td className="px-4 py-3.5 font-medium">{inv.client}</td>
                    <td className="px-4 py-3.5 text-xs text-muted">{inv.gstLabel}</td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums">{money(invTotal(inv), inv.symbol)}</td>
                    <td className="px-4 py-3.5 text-xs">{inv.status === "Paid" ? <span className="text-muted">—</span> : <span className={inv.age > 30 ? "font-semibold text-rose-500" : "text-muted"}>{inv.age}d</span>}</td>
                    <td className="px-4 py-3.5 text-xs"><span className="inline-flex items-center gap-1 text-muted"><CreditCard className="h-3.5 w-3.5" />{inv.gateway}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== "Paid" && <button type="button" onClick={() => notify(`Reminder sent to ${inv.client} via Email + WhatsApp.`)} title="Send reminder" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-amber-500"><BellRing className="h-3.5 w-3.5" /></button>}
                        <button type="button" onClick={() => downloadInvoice(inv)} title="Download PDF" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Download className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => openEdit(inv)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => deleteInvoice(inv.id)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => markPaid(inv.id)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-transform hover:scale-105 ${statusTone[inv.status]}`}>{inv.status}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "accounting" && (
          <div className="space-y-5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4 text-brand-primary" /> Trial Balance Snapshot</div>
            <div className="overflow-x-auto rounded-xl border border-surface-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-background/50 text-xs text-muted">
                    <th className="px-4 py-2.5 font-medium">Account</th><th className="px-4 py-2.5 font-medium">Type</th><th className="px-4 py-2.5 text-right font-medium">Debit</th><th className="px-4 py-2.5 text-right font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {TRIAL_BALANCE.map((r) => (
                    <tr key={r.acct} className="hover:bg-background/50">
                      <td className="px-4 py-2.5 font-medium">{r.acct}</td><td className="px-4 py-2.5 text-xs text-muted">{r.type}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.debit ? fmtINR(r.debit) : "—"}</td><td className="px-4 py-2.5 text-right tabular-nums">{r.credit ? fmtINR(r.credit) : "—"}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-surface-border bg-background/40 font-semibold">
                    <td className="px-4 py-2.5" colSpan={2}>Total</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-brand-primary">{fmtINR(TRIAL_BALANCE.reduce((s, r) => s + r.debit, 0))}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-brand-primary">{fmtINR(TRIAL_BALANCE.reduce((s, r) => s + r.credit, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-brand-green/25 bg-brand-green/10 px-4 py-2.5 text-xs font-medium text-brand-teal dark:text-brand-green"><CheckCircle2 className="h-4 w-4" /> Debits = Credits · Double-entry ledger balanced · period open (Nov 2026).</div>
          </div>
        )}

        {tab === "gst" && (
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="rounded-xl border border-surface-border bg-background/50 p-4"><p className="text-xs text-muted">GST Output (collected)</p><p className="mt-1 text-xl font-bold tabular-nums">{fmtINR(gstOutput)}</p><p className="mt-1 text-[11px] text-muted">CGST + SGST + IGST on sales</p></div>
            <div className="rounded-xl border border-surface-border bg-background/50 p-4"><p className="text-xs text-muted">Input Tax Credit</p><p className="mt-1 text-xl font-bold tabular-nums">{fmtINR(gstInput)}</p><p className="mt-1 text-[11px] text-muted">ITC on eligible purchases</p></div>
            <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-4"><p className="text-xs text-brand-primary">Net GST Payable</p><p className="mt-1 text-xl font-bold tabular-nums text-brand-primary">{fmtINR(Math.max(0, gstOutput - gstInput))}</p><p className="mt-1 text-[11px] text-muted">Due before 20 Dec · GSTR-3B</p></div>
            <div className="sm:col-span-3 flex items-center gap-2 rounded-xl border border-surface-border bg-surface p-3 text-xs text-muted"><TrendingUp className="h-4 w-4 text-brand-primary" /> HSN/SAC codes mapped · export invoices under LUT (0%) · TDS receivable tracked separately.</div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Monthly Revenue", val: "₹12.85L", icon: IndianRupee },
          { label: "Receivables Aging >30d", val: fmtINR(invoices.filter((i) => i.age > 30).reduce((s, i) => s + invINR(i), 0)), icon: Receipt },
          { label: "Bank & Cash Balance", val: "₹18.20L", icon: Landmark },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface p-4">
              <div><span className="text-xs text-muted">{item.label}</span><p className="mt-1 text-lg font-bold tabular-nums">{item.val}</p></div>
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
          );
        })}
      </div>

      {/* ---------- Invoice Builder Wizard ---------- */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-xs" onClick={() => setWizardOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
            <div className="border-b border-surface-border p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold"><Receipt className="h-4 w-4 text-brand-primary" /> {editingId ? "Edit Invoice" : "GST Invoice Builder"}</h2>
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

            <div className="min-h-[280px] flex-1 overflow-y-auto p-5">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Client</label>
                      <input autoFocus list="nova-inv-clients" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Select or type client" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                      <datalist id="nova-inv-clients">{KNOWN_CLIENTS.map((c) => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Due Date</label>
                      <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">Currency</label>
                    <div className="flex flex-wrap gap-2">
                      {CURRENCIES.map((c) => (
                        <button key={c.code} type="button" onClick={() => setCurrency(c.code)} className={`rounded-xl border px-3.5 py-2 text-xs font-semibold ${currency === c.code ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-surface-border text-muted hover:text-foreground"}`}>{c.symbol.trim()} {c.code}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Payment Gateway</label>
                    <div className="flex flex-wrap gap-2">
                      {GATEWAYS.map((g) => (
                        <button key={g} type="button" onClick={() => setGateway(g)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${gateway === g ? "border-brand-primary text-brand-primary" : "border-surface-border text-muted hover:text-foreground"}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-muted">Line Items ({cur.symbol.trim()})</label>
                      <button type="button" onClick={() => setItems((p) => [...p, { desc: "", qty: 1, rate: 0 }])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"><Plus className="h-3 w-3" /> Add line</button>
                    </div>
                    <div className="space-y-2">
                      {items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input value={it.desc} onChange={(e) => updateItem(i, { desc: e.target.value })} placeholder="Description..." className="flex-1 rounded-lg border border-surface-border bg-background px-2.5 py-1.5 text-xs focus:border-brand-primary focus:outline-none" />
                          <input type="number" min={1} value={it.qty} onChange={(e) => updateItem(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })} className="w-12 rounded-lg border border-surface-border bg-background px-1.5 py-1.5 text-center text-xs focus:border-brand-primary focus:outline-none" />
                          <input type="number" min={0} value={it.rate} onChange={(e) => updateItem(i, { rate: Math.max(0, parseInt(e.target.value) || 0) })} className="w-24 rounded-lg border border-surface-border bg-background px-2 py-1.5 text-right text-xs focus:border-brand-primary focus:outline-none" />
                          <span className="w-24 text-right text-xs font-semibold tabular-nums">{money(it.qty * it.rate, cur.symbol)}</span>
                          <button type="button" onClick={() => setItems((p) => (p.length > 1 ? p.filter((_, x) => x !== i) : p))} className="rounded p-1 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Discount (%)</label>
                      <input type="number" min={0} max={100} value={discountPct} onChange={(e) => setDiscountPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted">GST Treatment</label>
                      <select value={gstLabel} onChange={(e) => { const v = e.target.value; setGstLabel(v); setTaxPct(v.includes("Export") ? 0 : 18); }} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                        <option>CGST+SGST 18%</option><option>IGST 18%</option><option>Export (0% LUT)</option>
                      </select>
                    </div>
                  </div>
                  <div className="rounded-xl border border-surface-border bg-background/60 p-3 text-xs">
                    <div className="flex justify-between py-0.5"><span className="text-muted">Subtotal</span><span className="tabular-nums">{money(totals.subtotal, cur.symbol)}</span></div>
                    <div className="flex justify-between py-0.5"><span className="text-muted">Discount ({discountPct}%)</span><span className="tabular-nums text-rose-500">- {money(totals.discount, cur.symbol)}</span></div>
                    <div className="flex justify-between py-0.5"><span className="text-muted">{gstLabel}</span><span className="tabular-nums">{money(totals.tax, cur.symbol)}</span></div>
                    <div className="mt-1 flex justify-between border-t border-surface-border pt-1.5 font-bold"><span>Total Payable</span><span className="tabular-nums text-brand-primary">{money(totals.total, cur.symbol)}</span></div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-surface-border bg-background/40 p-4">
                    <p className="text-[11px] font-semibold text-brand-teal uppercase dark:text-brand-green">Tax Invoice · {cur.code}</p>
                    <h3 className="mt-0.5 text-lg font-bold">{client || "—"}</h3>
                    <p className="text-xs text-muted">Due {dueDate} · {gateway} · {gstLabel}</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-surface-border">
                    <table className="w-full text-left text-xs">
                      <thead><tr className="bg-background/60 text-muted"><th className="px-3 py-2 font-medium">Description</th><th className="px-3 py-2 text-center font-medium">Qty</th><th className="px-3 py-2 text-right font-medium">Amount</th></tr></thead>
                      <tbody className="divide-y divide-surface-border">
                        {items.filter((it) => it.desc.trim()).map((it, i) => (
                          <tr key={i}><td className="px-3 py-2">{it.desc}</td><td className="px-3 py-2 text-center tabular-nums">{it.qty}</td><td className="px-3 py-2 text-right font-semibold tabular-nums">{money(it.qty * it.rate, cur.symbol)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-3">
                    <span className="text-xs font-semibold text-muted">Total Payable</span>
                    <span className="text-lg font-bold text-brand-primary tabular-nums">{money(totals.total, cur.symbol)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-surface-border p-4">
              <button type="button" onClick={() => (step === 1 ? setWizardOpen(false) : setStep(step - 1))} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> {step === 1 ? "Cancel" : "Back"}</button>
              {step < 3 ? (
                <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">Next <ArrowRight className="h-3.5 w-3.5" /></button>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => save(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold hover:border-brand-primary">{editingId ? "Save" : "Issue"}</button>
                  <button type="button" onClick={() => save(true)} className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" /> {editingId ? "Save" : "Issue"} &amp; PDF</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
