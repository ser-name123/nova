"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Columns3,
  Flame,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Snowflake,
  Sun,
  Table2,
  Target,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Priority = "Hot" | "Warm" | "Cold";
type Lead = {
  id: string;
  name: string;
  company: string;
  service: string;
  source: string;
  priority: Priority;
  stage: string;
  value: string;
  valueNum: number;
  email: string;
  phone: string;
};

const STAGES = ["New", "Contacted", "Interested", "Meeting Scheduled", "Proposal Sent", "Negotiation", "Won"];

const INITIAL_LEADS: Lead[] = [
  { id: "LD-409", name: "Rohan Mehta", company: "Apex Infra", service: "Website + SEO", source: "Meta Lead Form", priority: "Hot", stage: "Proposal Sent", value: "₹2.40L", valueNum: 2.4, email: "rohan@apexinfra.in", phone: "+91 98100 11223" },
  { id: "LD-408", name: "Ananya Verma", company: "Verve Dental", service: "Local SEO + Ads", source: "Google Ads", priority: "Hot", stage: "Negotiation", value: "₹1.80L", valueNum: 1.8, email: "ananya@vervedental.com", phone: "+91 90045 33210" },
  { id: "LD-407", name: "Karan Gill", company: "Kroma Apparel", service: "Meta & TikTok Ads", source: "WhatsApp Bot", priority: "Warm", stage: "Meeting Scheduled", value: "₹3.10L", valueNum: 3.1, email: "karan@kroma.in", phone: "+91 99887 45612" },
  { id: "LD-406", name: "Priya Nair", company: "FinEdge Advisory", service: "LinkedIn B2B Ads", source: "Website Form", priority: "Warm", stage: "Interested", value: "₹1.50L", valueNum: 1.5, email: "priya@finedge.co", phone: "+91 90012 77881" },
  { id: "LD-405", name: "Saurabh Jain", company: "Jain Logistics", service: "Hosting + M365", source: "Email Inquiry", priority: "Cold", stage: "Contacted", value: "₹0.65L", valueNum: 0.65, email: "saurabh@jainlog.in", phone: "+91 98220 10934" },
  { id: "LD-404", name: "Megha Shah", company: "Bloom Interiors", service: "Website + Branding", source: "Referral", priority: "Warm", stage: "New", value: "₹2.10L", valueNum: 2.1, email: "megha@bloom.design", phone: "+91 97000 55412" },
  { id: "LD-403", name: "Dev Anand", company: "Nova Realty", service: "Google Ads + CRM", source: "Meta Lead Form", priority: "Hot", stage: "New", value: "₹1.95L", valueNum: 1.95, email: "dev@novarealty.in", phone: "+91 98333 21090" },
  { id: "LD-402", name: "Fatima Sheikh", company: "CureWell Clinic", service: "Full Digital Retainer", source: "WhatsApp Bot", priority: "Warm", stage: "Meeting Scheduled", value: "₹2.80L", valueNum: 2.8, email: "fatima@curewell.in", phone: "+91 90900 12345" },
];

const priorityTone: Record<Priority, string> = {
  Hot: "bg-rose-500/10 text-rose-500",
  Warm: "bg-amber-500/10 text-amber-500",
  Cold: "bg-sky-500/10 text-sky-500",
};

const PRIORITY_ICON: Record<Priority, React.ElementType> = { Hot: Flame, Warm: Sun, Cold: Snowflake };

export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [view, setView] = useState<"board" | "table">("board");
  const [stageFilter, setStageFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Lead | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [service, setService] = useState("Website + SEO");
  const [source, setSource] = useState("Manual Entry");
  const [priority, setPriority] = useState<Priority>("Hot");
  const [value, setValue] = useState("1.50");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      const mStage = stageFilter === "All" || l.stage === stageFilter;
      const mPrio = priorityFilter === "All" || l.priority === priorityFilter;
      const mQ = !q || l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.service.toLowerCase().includes(q);
      return mStage && mPrio && mQ;
    });
  }, [leads, search, stageFilter, priorityFilter]);

  const stats = useMemo(() => {
    const open = leads.filter((l) => l.stage !== "Won");
    const pipeline = open.reduce((s, l) => s + l.valueNum, 0);
    const hot = leads.filter((l) => l.priority === "Hot" && l.stage !== "Won").length;
    const won = leads.filter((l) => l.stage === "Won").length;
    const conv = Math.round((won / Math.max(1, leads.length)) * 100);
    return { pipeline, open: open.length, hot, won, conv };
  }, [leads]);

  const KPIS = [
    { label: "Open Pipeline", value: `₹${stats.pipeline.toFixed(2)}L`, delta: "+18.4%", color: "#0eb57d", spark: [11, 13, 12, 15, 17, stats.pipeline] },
    { label: "Open Leads", value: `${stats.open}`, delta: "live", color: "#0f67a6", spark: [18, 20, 19, 22, 21, stats.open] },
    { label: "Hot Leads", value: `${stats.hot}`, delta: "priority", color: "#e11d48", spark: [3, 5, 4, 6, 5, stats.hot] },
    { label: "Conversion", value: `${stats.conv}%`, delta: "MTD", color: "#1677e8", spark: [20, 24, 22, 28, 26, stats.conv] },
  ];

  function openCreate() {
    setEditingId(null);
    setName("");
    setCompany("");
    setService("Website + SEO");
    setSource("Manual Entry");
    setPriority("Hot");
    setValue("1.50");
    setModalOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditingId(lead.id);
    setName(lead.name);
    setCompany(lead.company);
    setService(lead.service);
    setSource(lead.source);
    setPriority(lead.priority);
    setValue(String(lead.valueNum));
    setDetail(null);
    setModalOpen(true);
  }

  function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;
    const v = parseFloat(value) || 1.5;
    if (editingId) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === editingId
            ? { ...l, name: name.trim(), company: company.trim(), service, source, priority, value: `₹${v.toFixed(2)}L`, valueNum: v }
            : l
        )
      );
      setModalOpen(false);
      notify(`Lead ${editingId} updated.`);
      return;
    }
    const newLead: Lead = {
      id: `LD-${410 + leads.length}`,
      name: name.trim(),
      company: company.trim(),
      service,
      source,
      priority,
      stage: "New",
      value: `₹${v.toFixed(2)}L`,
      valueNum: v,
      email: `${name.trim().toLowerCase().split(" ")[0]}@${company.trim().toLowerCase().replace(/\s+/g, "")}.com`,
      phone: "+91 9•••• •••••",
    };
    setLeads((prev) => [newLead, ...prev]);
    setModalOpen(false);
    notify(`Lead ${newLead.name} (${newLead.id}) added to pipeline.`);
  }

  function deleteLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setDetail(null);
    notify(`Lead ${id} deleted.`);
  }

  function advanceStage(id: string) {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const idx = STAGES.indexOf(l.stage);
        return { ...l, stage: STAGES[Math.min(idx + 1, STAGES.length - 1)] };
      })
    );
  }

  function moveToStage(id: string, stage: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
  }

  function convertToClient(l: Lead) {
    setLeads((prev) => prev.map((x) => (x.id === l.id ? { ...x, stage: "Won" } : x)));
    setDetail(null);
    notify(`${l.company} converted to Client · Project auto-created from template.`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {toast && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 01 · CRM &amp; Sales</span>
          <h1 className="mt-1 text-2xl font-bold">Leads &amp; Sales Pipeline</h1>
          <p className="text-sm text-muted">Multi-channel capture · auto-assignment · drag through stages to close.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" />
          Add Manual Lead
        </button>
      </div>

      {/* KPIs */}
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-surface p-1">
          <button type="button" onClick={() => setView("board")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "board" ? "nova-gradient text-white shadow-xs" : "text-muted hover:text-foreground"}`}>
            <Columns3 className="h-3.5 w-3.5" /> Pipeline Board
          </button>
          <button type="button" onClick={() => setView("table")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "table" ? "nova-gradient text-white shadow-xs" : "text-muted hover:text-foreground"}`}>
            <Table2 className="h-3.5 w-3.5" /> Table
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-52">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter leads..." className="w-full rounded-lg border border-surface-border bg-background py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
          </div>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as "All" | Priority)} className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-muted focus:border-brand-primary focus:outline-none">
            <option value="All">All Priority</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
        </div>
      </div>

      {/* Stage pills (table view) */}
      {view === "table" && (
        <div className="flex flex-wrap gap-2">
          {["All", ...STAGES].map((s) => (
            <button key={s} type="button" onClick={() => setStageFilter(s)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${stageFilter === s ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* BOARD VIEW */}
      {view === "board" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {STAGES.map((stage) => {
            const items = visible.filter((l) => l.stage === stage);
            const colValue = items.reduce((s, l) => s + l.valueNum, 0);
            return (
              <div key={stage} className="rounded-xl border border-surface-border bg-surface/60 p-3">
                <div className="mb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{stage}</span>
                    <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted">{items.length}</span>
                  </div>
                  <p className="text-[10px] text-muted">₹{colValue.toFixed(2)}L</p>
                </div>
                <div className="space-y-2">
                  {items.map((l) => {
                    const PIcon = PRIORITY_ICON[l.priority];
                    return (
                      <div key={l.id} className="group rounded-lg border border-surface-border bg-surface p-3 transition-colors hover:border-brand-primary/40">
                        <button type="button" onClick={() => setDetail(l)} className="w-full text-left">
                          <p className="text-xs font-semibold text-foreground">{l.name}</p>
                          <p className="text-[10px] text-muted">{l.company}</p>
                          <p className="mt-1.5 text-[10px] text-muted">{l.service}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold ${priorityTone[l.priority]}`}>
                              <PIcon className="h-2.5 w-2.5" />
                              {l.priority}
                            </span>
                            <span className="text-[10px] font-bold tabular-nums">{l.value}</span>
                          </div>
                        </button>
                        {stage !== "Won" && (
                          <button type="button" onClick={() => advanceStage(l.id)} title="Advance to next stage" className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-surface-border py-1 text-[10px] font-semibold text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-brand-primary">
                            Advance <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {items.length === 0 && <p className="py-3 text-center text-[10px] text-muted/60">—</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-3">
            <span className="text-xs font-semibold text-muted">{visible.length} leads shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Est. Value</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {visible.map((lead) => {
                  const PIcon = PRIORITY_ICON[lead.priority];
                  return (
                    <tr key={lead.id} className="hover:bg-background/50">
                      <td className="px-5 py-3.5">
                        <button type="button" onClick={() => setDetail(lead)} className="text-left">
                          <div className="font-semibold text-foreground hover:text-brand-primary">{lead.name}</div>
                          <div className="text-xs text-muted">{lead.company} · {lead.id}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-xs">{lead.service}</td>
                      <td className="px-4 py-3.5 text-xs text-muted">{lead.source}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${priorityTone[lead.priority]}`}>
                          <PIcon className="h-3 w-3" />
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <select value={lead.stage} onChange={(e) => moveToStage(lead.id, e.target.value)} className="rounded-md border border-surface-border bg-brand-primary/5 px-2 py-0.5 text-xs font-medium text-brand-primary focus:border-brand-primary focus:outline-none">
                          {STAGES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3.5 font-semibold tabular-nums">{lead.value}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button type="button" onClick={() => notify(`Calling ${lead.name}…`)} title="Call" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Phone className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => notify(`Email composer opened for ${lead.name}`)} title="Email" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Mail className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => notify(`WhatsApp template queued for ${lead.name}`)} title="WhatsApp" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-green"><MessageCircle className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => openEdit(lead)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => deleteLead(lead.id)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleAddLead} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editingId ? "Edit Lead" : "Add Manual Lead"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact Name" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <input required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company Name" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={service} onChange={(e) => setService(e.target.value)} className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  <option>Website + SEO</option>
                  <option>Google &amp; Meta Ads</option>
                  <option>WhatsApp Automation</option>
                  <option>Hosting &amp; Cloud</option>
                  <option>Full Digital Retainer</option>
                </select>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  <option>Manual Entry</option>
                  <option>Website Form</option>
                  <option>Meta Lead Form</option>
                  <option>Google Ads</option>
                  <option>WhatsApp Bot</option>
                  <option>Referral</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-muted">₹</span>
                  <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="1.50" className="w-full rounded-xl border border-surface-border bg-background py-2 pr-7 pl-6 text-sm focus:border-brand-primary focus:outline-none" />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">L</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">{editingId ? "Save Changes" : "Save Lead"}</button>
            </div>
          </form>
        </div>
      )}

      {/* LEAD DETAIL DRAWER */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-surface-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{detail.name}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityTone[detail.priority]}`}>{detail.priority}</span>
                </div>
                <p className="text-sm text-muted">{detail.company} · {detail.id}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-surface-border bg-background/60 p-3">
                <p className="text-[10px] text-muted">Est. Value</p>
                <p className="text-sm font-bold">{detail.value}</p>
              </div>
              <div className="rounded-xl border border-surface-border bg-background/60 p-3">
                <p className="text-[10px] text-muted">Current Stage</p>
                <p className="text-sm font-bold text-brand-primary">{detail.stage}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-surface-border bg-background/60 p-4 text-xs">
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted" /> {detail.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted" /> {detail.phone}</div>
              <div className="flex items-center gap-2"><Target className="h-3.5 w-3.5 text-muted" /> {detail.service}</div>
              <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5 text-muted" /> Source: {detail.source}</div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold">Activity Timeline</p>
              <ol className="relative space-y-3 border-l border-surface-border pl-4 text-xs">
                {[
                  { t: "Lead captured from " + detail.source, w: "2d ago" },
                  { t: "Auto-assigned to Sales Executive", w: "2d ago" },
                  { t: "Intro email + WhatsApp sent", w: "1d ago" },
                  { t: `Moved to ${detail.stage}`, w: "4h ago" },
                ].map((a, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[18px] top-1 h-2 w-2 rounded-full border-2 border-surface bg-brand-primary" />
                    <p className="text-foreground">{a.t}</p>
                    <p className="text-[10px] text-muted/70">{a.w}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => notify(`Calling ${detail.name}…`)} className="flex flex-col items-center gap-1 rounded-xl border border-surface-border py-2.5 text-[11px] font-semibold text-muted hover:border-brand-primary hover:text-brand-primary"><Phone className="h-4 w-4" /> Call</button>
              <button type="button" onClick={() => notify(`Email composer opened for ${detail.name}`)} className="flex flex-col items-center gap-1 rounded-xl border border-surface-border py-2.5 text-[11px] font-semibold text-muted hover:border-brand-primary hover:text-brand-primary"><Mail className="h-4 w-4" /> Email</button>
              <button type="button" onClick={() => notify(`WhatsApp queued for ${detail.name}`)} className="flex flex-col items-center gap-1 rounded-xl border border-surface-border py-2.5 text-[11px] font-semibold text-muted hover:border-brand-green hover:text-brand-green"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
            </div>

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => { advanceStage(detail.id); setDetail(null); notify(`${detail.name} advanced to next stage.`); }} className="flex-1 rounded-xl border border-surface-border px-4 py-2.5 text-xs font-semibold hover:border-brand-primary">
                Advance Stage
              </button>
              <button type="button" onClick={() => convertToClient(detail)} className="nova-gradient inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white">
                <UserPlus className="h-3.5 w-3.5" /> Convert to Client
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => openEdit(detail)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted hover:border-brand-primary hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /> Edit</button>
              <button type="button" onClick={() => deleteLead(detail.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-rose-500 hover:border-rose-400"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Source footer stat */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-brand-primary" />
          <div>
            <p className="text-sm font-semibold">{leads.length} total leads · {stats.won} won this month</p>
            <p className="text-xs text-muted">Auto-assignment, duplicate detection &amp; follow-up engine active.</p>
          </div>
        </div>
        <span className="rounded-lg bg-brand-green/10 px-3 py-1.5 text-xs font-semibold text-brand-teal dark:text-brand-green">Win rate {stats.conv}%</span>
      </div>
    </div>
  );
}
