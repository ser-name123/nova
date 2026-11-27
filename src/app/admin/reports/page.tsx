"use client";

import { useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  FileBarChart,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";
import { downloadPdf } from "@/lib/pdf";

type Report = {
  id: string;
  name: string;
  module: string;
  frequency: string;
  format: string;
  nextRun: string;
  recipients: number;
  active: boolean;
};

const MODULES = ["CRM & Sales", "Finance & Accounting", "SEO Performance", "Unified Marketing", "HR & Productivity", "Client Profitability"];

const INITIAL: Report[] = [
  { id: "RPT-01", name: "Monthly SEO Client Report", module: "SEO Performance", frequency: "Monthly", format: "PDF", nextRun: "01 Dec 2026", recipients: 28, active: true },
  { id: "RPT-02", name: "Weekly Sales Pipeline", module: "CRM & Sales", frequency: "Weekly", format: "PDF", nextRun: "02 Dec 2026", recipients: 4, active: true },
  { id: "RPT-03", name: "Monthly P&L Summary", module: "Finance & Accounting", frequency: "Monthly", format: "PDF + Excel", nextRun: "01 Dec 2026", recipients: 3, active: true },
  { id: "RPT-04", name: "Marketing Spend & ROAS", module: "Unified Marketing", frequency: "Monthly", format: "PDF", nextRun: "01 Dec 2026", recipients: 12, active: true },
  { id: "RPT-05", name: "Billable Utilization", module: "HR & Productivity", frequency: "Weekly", format: "Excel", nextRun: "02 Dec 2026", recipients: 2, active: false },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(INITIAL);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState("");
  const [moduleName, setModuleName] = useState(MODULES[0]);
  const [frequency, setFrequency] = useState("Monthly");
  const [format, setFormat] = useState("PDF");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const stats = useMemo(() => {
    const active = reports.filter((r) => r.active).length;
    const recipients = reports.reduce((s, r) => s + r.recipients, 0);
    return { active, recipients };
  }, [reports]);

  const KPIS = [
    { label: "Scheduled Reports", value: `${reports.length}`, delta: `${stats.active} active`, color: "#0f67a6", spark: [3, 4, 4, 5, 5, reports.length] },
    { label: "Sent This Month", value: "142", delta: "+18%", color: "#0eb57d", spark: [90, 104, 118, 128, 136, 142] },
    { label: "Recipients", value: `${stats.recipients}`, delta: "clients & staff", color: "#1677e8", spark: [30, 36, 40, 44, 46, stats.recipients] },
    { label: "Auto-Delivery", value: "100%", delta: "email + portal", color: "#0d9488", spark: [92, 95, 97, 99, 100, 100] },
  ];

  function openCreate() {
    setEditingId(null);
    setName(""); setModuleName(MODULES[0]); setFrequency("Monthly"); setFormat("PDF");
    setModalOpen(true);
  }

  function openEdit(r: Report) {
    setEditingId(r.id);
    setName(r.name); setModuleName(r.module); setFrequency(r.frequency); setFormat(r.format);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingId) {
      setReports((prev) => prev.map((r) => (r.id === editingId ? { ...r, name: name.trim(), module: moduleName, frequency, format } : r)));
      notify(`${editingId} updated.`);
    } else {
      setReports((prev) => [{ id: `RPT-0${prev.length + 1}`, name: name.trim(), module: moduleName, frequency, format, nextRun: "01 Dec 2026", recipients: 1, active: true }, ...prev]);
      notify("Scheduled report created.");
    }
    setModalOpen(false);
  }

  function toggle(id: string) {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }

  function remove(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
    notify(`${id} deleted.`);
  }

  function runNow(r: Report) {
    downloadPdf(r.name.replace(/\s+/g, "-"), {
      docType: "Scheduled Report",
      title: r.name,
      subtitle: `${r.module} — ${r.frequency}`,
      meta: [
        ["Report ID", r.id],
        ["Module", r.module],
        ["Frequency", r.frequency],
        ["Format", r.format],
        ["Recipients", String(r.recipients)],
      ],
      columns: ["Metric", "Current", "Previous", "Change"],
      alignRight: [1, 2, 3],
      rows: [
        ["Total Revenue", "Rs.12.85L", "Rs.10.85L", "+18.4%"],
        ["New Leads", "142", "120", "+18.3%"],
        ["Conversions", "38", "31", "+22.6%"],
        ["Avg ROAS", "4.3x", "4.0x", "+7.5%"],
        ["Active Projects", "19", "16", "+18.8%"],
      ],
      totals: [["Generated", new Date().toLocaleDateString("en-GB")]],
      note: "Auto-generated snapshot. Scheduled delivery to all recipients via email + client portal.",
    });
    notify(`${r.id} generated & downloaded.`);
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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Administration · Reports</span>
          <h1 className="mt-1 text-2xl font-bold">Scheduled Reports &amp; Exports</h1>
          <p className="text-sm text-muted">Branded PDF, Excel &amp; CSV exports across all 12 systems with scheduled email &amp; portal delivery.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" /> New Report
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

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-muted">
                <th className="px-5 py-3 font-medium">Report</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">Format</th>
                <th className="px-4 py-3 font-medium">Next Run</th>
                <th className="px-4 py-3 font-medium">Recipients</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-background/50">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-foreground">{r.name}</div>
                    <div className="text-xs text-muted">{r.module} · {r.id}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button type="button" onClick={() => toggle(r.id)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.active ? "bg-brand-green/15 text-brand-teal dark:text-brand-green" : "bg-background text-muted"}`}><CalendarClock className="h-3 w-3" /> {r.active ? r.frequency : "Paused"}</button>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted">{r.format}</td>
                  <td className="px-4 py-3.5 text-xs text-muted">{r.nextRun}</td>
                  <td className="px-4 py-3.5 text-xs tabular-nums">{r.recipients}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button type="button" onClick={() => runNow(r)} title="Run now & download PDF" className="inline-flex items-center gap-1 rounded-lg bg-brand-primary/10 px-2.5 py-1 text-[11px] font-semibold text-brand-primary hover:bg-brand-primary/15"><Play className="h-3 w-3" /> Run</button>
                      <button type="button" onClick={() => runNow(r)} title="Download PDF" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Download className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => openEdit(r)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => remove(r.id)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <FileBarChart className="h-5 w-5 text-brand-primary" />
        <p className="text-xs text-muted">Reports pull live cross-module data · branded with white-label settings · delivered to email &amp; client portal on schedule.</p>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editingId ? "Edit Report" : "New Scheduled Report"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Report name" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Data Source</label>
                <select value={moduleName} onChange={(e) => setModuleName(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  {MODULES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Frequency</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                    <option>Daily</option><option>Weekly</option><option>Monthly</option><option>Quarterly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Format</label>
                  <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                    <option>PDF</option><option>Excel</option><option>CSV</option><option>PDF + Excel</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">{editingId ? "Save Changes" : "Schedule Report"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
