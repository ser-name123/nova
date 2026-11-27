"use client";

import { useRef, useState } from "react";
import { ArrowRight, Bot, CheckCircle2, MessageCircle, Pencil, Play, Plus, Trash2, Workflow, X, Zap } from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

const FLOW_STEPS = [
  { step: "1. Trigger", title: "Customer sends WhatsApp message", detail: "Official WhatsApp Business API webhook" },
  { step: "2. Welcome", title: "Automated Welcome + Service Menu", detail: "Website Dev / SEO / Digital Marketing / Hosting" },
  { step: "3. Qualify", title: "Collect Name, Company & Budget", detail: "AI + keyword-based conditional routing" },
  { step: "4. CRM Sync", title: "Auto-create CRM Lead & Assign", detail: "Routed to Sales Executive + 2-day follow-up" },
];

type Flow = { name: string; runs: number; conv: string; active: boolean };

export default function WhatsappAutomationPage() {
  const [flows, setFlows] = useState<Flow[]>([
    { name: "Inbound Lead Qualification Bot", runs: 1240, conv: "34% to CRM", active: true },
    { name: "Quotation 2-Day Follow-up Flow", runs: 418, conv: "28% reply", active: true },
    { name: "Domain & Hosting Expiry Reminder", runs: 86, conv: "92% renewed", active: true },
    { name: "Payment Reminder & Invoice Flow", runs: 204, conv: "61% paid", active: false },
  ]);
  const [testing, setTesting] = useState(false);
  const [testStep, setTestStep] = useState(-1);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [flowName, setFlowName] = useState("");
  const [flowConv, setFlowConv] = useState("");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function toggleFlow(name: string) {
    setFlows((prev) => prev.map((f) => (f.name === name ? { ...f, active: !f.active } : f)));
    const f = flows.find((x) => x.name === name);
    if (f) notify(`${name} ${f.active ? "paused" : "activated"}.`);
  }

  function openCreate() {
    setEditingName(null);
    setFlowName(""); setFlowConv("");
    setModalOpen(true);
  }

  function openEdit(f: Flow) {
    setEditingName(f.name);
    setFlowName(f.name); setFlowConv(f.conv);
    setModalOpen(true);
  }

  function submitFlow(e: React.FormEvent) {
    e.preventDefault();
    if (!flowName.trim()) return;
    if (editingName) {
      setFlows((prev) => prev.map((f) => (f.name === editingName ? { ...f, name: flowName.trim(), conv: flowConv.trim() || f.conv } : f)));
      notify(`Flow "${flowName.trim()}" updated.`);
    } else {
      setFlows((prev) => [{ name: flowName.trim(), runs: 0, conv: flowConv.trim() || "new", active: true }, ...prev]);
      notify(`Flow "${flowName.trim()}" created.`);
    }
    setModalOpen(false);
  }

  function deleteFlow(name: string) {
    setFlows((prev) => prev.filter((f) => f.name !== name));
    notify(`Flow "${name}" deleted.`);
  }

  function runTest() {
    setTesting(true);
    setTestStep(0);
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      if (i >= FLOW_STEPS.length) {
        clearInterval(iv);
        setTesting(false);
        setTestStep(-1);
        notify("Test run complete · sample lead created in CRM.");
        return;
      }
      setTestStep(i);
    }, 600);
  }

  const totalRuns = flows.reduce((s, f) => s + f.runs, 0);

  const KPIS = [
    { label: "Active Flows", value: `${flows.filter((f) => f.active).length}`, delta: `${flows.length} total`, color: "#0f67a6", spark: [2, 3, 3, 4, 3, flows.filter((f) => f.active).length + 1] },
    { label: "Total Runs (30d)", value: `${(totalRuns / 1000).toFixed(1)}K`, delta: "+22%", color: "#0eb57d", spark: [1.2, 1.4, 1.6, 1.8, 1.9, totalRuns / 1000] },
    { label: "Lead → CRM", value: "34%", delta: "qualification", color: "#1677e8", spark: [24, 27, 29, 31, 33, 34] },
    { label: "Human Handover", value: "11%", delta: "escalated", color: "#d97706", spark: [16, 15, 13, 12, 11, 11] },
  ];

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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 10 · Marketing &amp; WhatsApp Automation</span>
          <h1 className="mt-1 text-2xl font-bold">WhatsApp Chatbot &amp; Automation Flows</h1>
          <p className="text-sm text-muted">Template-enforced WhatsApp Business API automation with opt-in rules, AI replies &amp; human handover.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-xs font-semibold hover:border-brand-primary"><Plus className="h-4 w-4" /> New Flow</button>
          <button type="button" onClick={runTest} disabled={testing} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-70">
            <Zap className="h-3.5 w-3.5" /> {testing ? "Running test…" : "Test Flow"}
          </button>
        </div>
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

      <div className="rounded-2xl border border-surface-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Workflow className="h-4 w-4 text-brand-green" /> Active Lead Qualification Workflow {testing && <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary">simulating…</span>}</div>
        <div className="grid gap-3 md:grid-cols-4">
          {FLOW_STEPS.map((s, idx) => {
            const activeStep = testStep === idx;
            const doneStep = testStep > idx && testStep !== -1;
            return (
              <div key={s.step} className={`relative rounded-xl border p-4 transition-all ${activeStep ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/30" : doneStep ? "border-brand-green/40 bg-brand-green/5" : "border-surface-border bg-background/70"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-brand-primary uppercase">{s.step}</span>
                  {doneStep && <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />}
                </div>
                <p className="mt-1 text-xs font-semibold text-foreground">{s.title}</p>
                <p className="mt-1 text-[11px] text-muted">{s.detail}</p>
                {idx < FLOW_STEPS.length - 1 && <ArrowRight className="mt-2 hidden h-4 w-4 text-brand-green md:block" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {flows.map((f) => (
          <div key={f.name} className="rounded-2xl border border-surface-border bg-surface p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="rounded-xl bg-brand-green/15 p-2.5 text-brand-teal dark:text-brand-green"><Bot className="h-5 w-5" /></div>
              <button type="button" onClick={() => toggleFlow(f.name)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${f.active ? "bg-brand-green/15 text-brand-teal dark:text-brand-green" : "bg-background text-muted"}`}>
                {f.active ? <CheckCircle2 className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {f.active ? "Active" : "Paused"}
              </button>
            </div>
            <h2 className="mt-3 text-sm font-semibold">{f.name}</h2>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {f.runs.toLocaleString()} runs</span>
              <span className="font-semibold text-brand-primary">{f.conv}</span>
            </div>
            <div className="mt-3 flex gap-2 border-t border-surface-border pt-3">
              <button type="button" onClick={() => openEdit(f)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-surface-border py-1.5 text-[11px] font-semibold text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /> Edit</button>
              <button type="button" onClick={() => deleteFlow(f.name)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-surface-border py-1.5 text-[11px] font-semibold text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={submitFlow} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editingName ? "Edit Flow" : "New Automation Flow"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={flowName} onChange={(e) => setFlowName(e.target.value)} placeholder="Flow name (e.g. Abandoned Cart Recovery)" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <input value={flowConv} onChange={(e) => setFlowConv(e.target.value)} placeholder="Goal / metric label (e.g. 30% reply)" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">{editingName ? "Save Changes" : "Create Flow"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
