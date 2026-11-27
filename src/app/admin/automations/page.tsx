"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Rule = {
  id: string;
  trigger: string;
  action: string;
  delay: string;
  runs: number;
  active: boolean;
};

const TRIGGERS = ["New inquiry received", "Lead assigned", "Proposal sent", "Quotation accepted", "Invoice generated", "Payment overdue", "Project deadline approaching", "SEO audit finds critical issue", "GA4 traffic drops", "Ad budget reaches threshold", "Subscription nearing expiry", "Employee misses timesheet", "Support ticket exceeds SLA"];
const ACTIONS = ["Create CRM lead", "Notify sales executive", "Schedule follow-up", "Create project from template", "Send invoice to client", "Notify finance team", "Notify project manager", "Create task & alert manager", "Send performance alert", "Notify client & account manager", "Send reminder", "Escalate to manager"];

const INITIAL: Rule[] = [
  { id: "AR-01", trigger: "New inquiry received", action: "Create CRM lead", delay: "Instant", runs: 1240, active: true },
  { id: "AR-02", trigger: "Quotation accepted", action: "Create project from template", delay: "Instant", runs: 218, active: true },
  { id: "AR-03", trigger: "Proposal sent", action: "Schedule follow-up", delay: "After 2 days", runs: 486, active: true },
  { id: "AR-04", trigger: "Payment overdue", action: "Notify finance team", delay: "After 1 day", runs: 94, active: true },
  { id: "AR-05", trigger: "Subscription nearing expiry", action: "Notify client & account manager", delay: "30 days before", runs: 142, active: true },
  { id: "AR-06", trigger: "Support ticket exceeds SLA", action: "Escalate to manager", delay: "Instant", runs: 37, active: false },
];

const LOG = [
  { rule: "AR-01", detail: "Meta lead form → CRM Lead #NT-409 created", when: "2m ago", ok: true },
  { rule: "AR-02", detail: "QT-218 accepted → Project + 14 tasks created", when: "18m ago", ok: true },
  { rule: "AR-04", detail: "INV-2026-106 overdue → finance team notified", when: "1h ago", ok: true },
  { rule: "AR-03", detail: "PR-041 follow-up scheduled (2d)", when: "3h ago", ok: true },
  { rule: "AR-06", detail: "SLA breach escalation — retry failed (rule paused)", when: "5h ago", ok: false },
];

export default function AutomationRulesPage() {
  const [rules, setRules] = useState<Rule[]>(INITIAL);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [trigger, setTrigger] = useState(TRIGGERS[0]);
  const [action, setAction] = useState(ACTIONS[0]);
  const [delay, setDelay] = useState("Instant");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const stats = useMemo(() => {
    const active = rules.filter((r) => r.active).length;
    const totalRuns = rules.reduce((s, r) => s + r.runs, 0);
    return { active, totalRuns };
  }, [rules]);

  const KPIS = [
    { label: "Active Rules", value: `${stats.active}`, delta: `${rules.length} total`, color: "#0f67a6", spark: [3, 4, 4, 5, 5, stats.active] },
    { label: "Runs (24h)", value: "1.1K", delta: "+22%", color: "#0eb57d", spark: [0.6, 0.7, 0.8, 0.9, 1.0, 1.1] },
    { label: "Success Rate", value: "98.6%", delta: "with retries", color: "#1677e8", spark: [95, 96, 97, 98, 98, 98.6] },
    { label: "Failed (24h)", value: "3", delta: "auto-retried", color: "#d97706", spark: [5, 4, 3, 4, 3, 3] },
  ];

  function openCreate() {
    setEditingId(null);
    setTrigger(TRIGGERS[0]); setAction(ACTIONS[0]); setDelay("Instant");
    setModalOpen(true);
  }

  function openEdit(r: Rule) {
    setEditingId(r.id);
    setTrigger(r.trigger); setAction(r.action); setDelay(r.delay);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      setRules((prev) => prev.map((r) => (r.id === editingId ? { ...r, trigger, action, delay } : r)));
      notify(`Rule ${editingId} updated.`);
    } else {
      setRules((prev) => [{ id: `AR-0${prev.length + 1}`, trigger, action, delay, runs: 0, active: true }, ...prev]);
      notify("Automation rule created & activated.");
    }
    setModalOpen(false);
  }

  function toggle(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }

  function remove(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    notify(`Rule ${id} deleted.`);
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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Administration · Automation Engine</span>
          <h1 className="mt-1 text-2xl font-bold">Automation Rules &amp; Triggers</h1>
          <p className="text-sm text-muted">Event-driven rules with conditions, delays, retries &amp; approval steps across every module.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" /> New Rule
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

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          {rules.map((r) => (
            <div key={r.id} className="rounded-2xl border border-surface-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-lg bg-brand-primary/10 px-2.5 py-1 font-semibold text-brand-primary">{r.trigger}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted" />
                  <span className="rounded-lg bg-brand-green/15 px-2.5 py-1 font-semibold text-brand-teal dark:text-brand-green">{r.action}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => toggle(r.id)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.active ? "bg-brand-green/15 text-brand-teal dark:text-brand-green" : "bg-background text-muted"}`}>{r.active ? "Active" : "Paused"}</button>
                  <button type="button" onClick={() => openEdit(r)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => remove(r.id)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-4 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.delay}</span>
                <span>{r.id}</span>
                <span>{r.runs.toLocaleString()} runs</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-surface-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Zap className="h-4 w-4 text-brand-green" /> Execution Log</div>
            <div className="space-y-2.5">
              {LOG.map((l, i) => (
                <div key={i} className="rounded-xl border border-surface-border bg-background/60 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{l.rule}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${l.ok ? "bg-brand-green/15 text-brand-teal dark:text-brand-green" : "bg-rose-500/10 text-rose-500"}`}>{l.ok ? "Executed" : "Failed"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{l.detail}</p>
                  <p className="mt-0.5 text-[10px] text-muted/70">{l.when}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editingId ? "Edit Rule" : "New Automation Rule"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">When (Trigger)</label>
                <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  {TRIGGERS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex justify-center"><ArrowRight className="h-4 w-4 rotate-90 text-muted" /></div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Then (Action)</label>
                <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  {ACTIONS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Delay</label>
                <select value={delay} onChange={(e) => setDelay(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  <option>Instant</option><option>After 1 day</option><option>After 2 days</option><option>After 3 days</option><option>30 days before</option><option>7 days before</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">{editingId ? "Save Changes" : "Create Rule"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
