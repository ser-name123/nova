"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Columns3,
  FolderKanban,
  IndianRupee,
  LayoutList,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Status = "Planning" | "In Progress" | "Under Review" | "Completed";
type Task = { name: string; done: boolean };
type Priority = "High" | "Medium" | "Low";
type ProjectItem = {
  id: string;
  title: string;
  client: string;
  due: string;
  status: Status;
  priority: Priority;
  budget: number;
  team: string[];
  category: string;
  tasks: Task[];
  startDate: string;
};

const STATUSES: Status[] = ["Planning", "In Progress", "Under Review", "Completed"];
const TEAM_POOL = [
  { id: "AS", name: "Aarav Sharma" }, { id: "NK", name: "Neha Kapoor" }, { id: "VP", name: "Vikram Patel" },
  { id: "IR", name: "Ishita Rao" }, { id: "RM", name: "Rohan M." }, { id: "SQ", name: "Sana Qureshi" },
];
const CATEGORIES: Record<string, string[]> = {
  "Website Development": ["Discovery & Requirements", "Wireframes & UX", "UI Design", "Development", "QA & Testing", "Launch & Handover"],
  "SEO Campaign": ["Technical Audit", "Keyword Research", "On-Page Optimization", "Content Plan", "Link Building", "Monthly Reporting"],
  "Paid Ads": ["Account Setup", "Audience Research", "Creative Production", "Campaign Launch", "Optimization", "Performance Reporting"],
  "Hosting & Cloud": ["Provision Server", "Site Migration", "SSL & Security", "DNS Setup", "Monitoring Setup"],
};

const mkTasks = (cat: string, doneCount = 0): Task[] => (CATEGORIES[cat] ?? []).map((name, i) => ({ name, done: i < doneCount }));

const INITIAL: ProjectItem[] = [
  { id: "PRJ-21", title: "FinEdge LinkedIn Funnel Setup", client: "FinEdge Advisory", due: "12 Dec", status: "Planning", priority: "Medium", budget: 1.5, team: ["AS", "NK"], category: "Paid Ads", tasks: mkTasks("Paid Ads", 1), startDate: "25 Nov" },
  { id: "PRJ-22", title: "Apex Infra Website + Tech SEO", client: "Apex Infra", due: "04 Dec", status: "In Progress", priority: "High", budget: 2.4, team: ["VP", "IR", "RM"], category: "Website Development", tasks: mkTasks("Website Development", 4), startDate: "10 Nov" },
  { id: "PRJ-23", title: "Kroma Q4 Meta & TikTok Ads", client: "Kroma Apparel", due: "10 Dec", status: "In Progress", priority: "High", budget: 3.1, team: ["SQ", "NK"], category: "Paid Ads", tasks: mkTasks("Paid Ads", 3), startDate: "01 Nov" },
  { id: "PRJ-24", title: "Verve Dental GMB & Local Citations", client: "Verve Healthcare", due: "29 Nov", status: "Under Review", priority: "Medium", budget: 1.8, team: ["IR"], category: "SEO Campaign", tasks: mkTasks("SEO Campaign", 5), startDate: "20 Oct" },
  { id: "PRJ-25", title: "Jain Logistics Cloud Migration", client: "Jain Logistics", due: "20 Nov", status: "Completed", priority: "Low", budget: 0.9, team: ["VP", "AS"], category: "Hosting & Cloud", tasks: mkTasks("Hosting & Cloud", 5), startDate: "01 Oct" },
];

const priorityTone: Record<Priority, string> = { High: "bg-rose-500/10 text-rose-500", Medium: "bg-amber-500/10 text-amber-500", Low: "bg-sky-500/10 text-sky-500" };
const statusTone: Record<Status, string> = {
  Planning: "bg-sky-500/10 text-sky-500",
  "In Progress": "bg-brand-primary/10 text-brand-primary",
  "Under Review": "bg-violet-500/10 text-violet-500",
  Completed: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
};

const progressOf = (p: ProjectItem) => (p.tasks.length ? Math.round((p.tasks.filter((t) => t.done).length / p.tasks.length) * 100) : p.status === "Completed" ? 100 : 0);

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL);
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [category, setCategory] = useState("Website Development");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [status, setStatus] = useState<Status>("Planning");
  const [team, setTeam] = useState<string[]>(["AS"]);
  const [tasks, setTasks] = useState<Task[]>(mkTasks("Website Development"));
  const [budget, setBudget] = useState("2.00");
  const [startDate, setStartDate] = useState("27 Nov");
  const [due, setDue] = useState("20 Dec");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => !q || p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q));
  }, [projects, search]);

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status !== "Completed");
    const budgetSum = projects.reduce((s, p) => s + p.budget, 0);
    const avg = Math.round(projects.reduce((s, p) => s + progressOf(p), 0) / Math.max(1, projects.length));
    const atRisk = projects.filter((p) => p.status !== "Completed" && progressOf(p) < 50).length;
    return { active: active.length, budgetSum, avg, atRisk };
  }, [projects]);

  const KPIS = [
    { label: "Active Projects", value: `${stats.active}`, delta: "in delivery", color: "#0f67a6", spark: [12, 14, 15, 16, 18, stats.active + 14] },
    { label: "Managed Budget", value: `₹${stats.budgetSum.toFixed(1)}L`, delta: "+12%", color: "#0eb57d", spark: [6, 7, 8, 9, 10, stats.budgetSum] },
    { label: "Avg Progress", value: `${stats.avg}%`, delta: "task completion", color: "#1677e8", spark: [40, 48, 55, 60, 64, stats.avg] },
    { label: "At Risk", value: `${stats.atRisk}`, delta: "<50% & open", color: "#d97706", spark: [4, 3, 2, 3, 2, stats.atRisk + 1] },
  ];

  function pickCategory(cat: string) {
    setCategory(cat);
    setTasks(mkTasks(cat));
  }

  function openCreate() {
    setEditingId(null); setStep(1);
    setTitle(""); setClient(""); setCategory("Website Development"); setPriority("Medium"); setStatus("Planning");
    setTeam(["AS"]); setTasks(mkTasks("Website Development")); setBudget("2.00"); setStartDate("27 Nov"); setDue("20 Dec");
    setWizardOpen(true);
  }
  function openEdit(p: ProjectItem) {
    setEditingId(p.id); setStep(1);
    setTitle(p.title); setClient(p.client); setCategory(p.category); setPriority(p.priority); setStatus(p.status);
    setTeam(p.team); setTasks(p.tasks.map((t) => ({ ...t }))); setBudget(String(p.budget)); setStartDate(p.startDate); setDue(p.due);
    setWizardOpen(true);
  }

  function toggleTeam(id: string) {
    setTeam((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleTask(i: number) {
    setTasks((prev) => prev.map((t, j) => (j === i ? { ...t, done: !t.done } : t)));
  }

  function save() {
    const base: ProjectItem = {
      id: editingId ?? `PRJ-${26 + projects.length}`,
      title: title.trim() || `${category} Project`,
      client: client.trim() || "Unnamed Client",
      due, status, priority, budget: parseFloat(budget) || 2, team: team.length ? team : ["AS"], category, tasks, startDate,
    };
    if (editingId) {
      setProjects((prev) => prev.map((p) => (p.id === editingId ? base : p)));
      notify(`Project ${editingId} updated.`);
    } else {
      setProjects((prev) => [base, ...prev]);
      notify(`Project created · ${tasks.length} tasks auto-generated from ${category} template.`);
    }
    setWizardOpen(false);
  }

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    notify(`Project ${id} deleted.`);
  }
  function advanceStage(id: string) {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const idx = STATUSES.indexOf(p.status);
      const next = STATUSES[Math.min(idx + 1, STATUSES.length - 1)];
      return { ...p, status: next, tasks: next === "Completed" ? p.tasks.map((t) => ({ ...t, done: true })) : p.tasks };
    }));
  }

  const STEPS = ["Basics", "Team & Tasks", "Budget", "Review"];
  const canNext = step === 1 ? !!title.trim() && !!client.trim() : true;
  const doneTasks = tasks.filter((t) => t.done).length;

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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 03 · Project Delivery</span>
          <h1 className="mt-1 text-2xl font-bold">Projects Workspace</h1>
          <p className="text-sm text-muted">Auto-generated tasks, milestones, time tracking &amp; profitability across every client.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" /> New Project
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
        <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-surface p-1">
          <button type="button" onClick={() => setView("board")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "board" ? "nova-gradient text-white shadow-xs" : "text-muted hover:text-foreground"}`}><Columns3 className="h-3.5 w-3.5" /> Kanban</button>
          <button type="button" onClick={() => setView("list")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${view === "list" ? "nova-gradient text-white shadow-xs" : "text-muted hover:text-foreground"}`}><LayoutList className="h-3.5 w-3.5" /> List</button>
        </div>
        <div className="relative w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects or clients..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
      </div>

      {view === "board" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((colStatus) => {
            const its = visible.filter((p) => p.status === colStatus);
            return (
              <div key={colStatus} className="flex flex-col rounded-2xl border border-surface-border bg-surface/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusTone[colStatus]}`}>{colStatus}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted">{its.length}</span>
                </div>
                <div className="space-y-3">
                  {its.map((task) => {
                    const prog = progressOf(task);
                    return (
                      <div key={task.id} className="rounded-xl border border-surface-border bg-surface p-3.5 transition-colors hover:border-brand-primary/40">
                        <div className="flex items-start justify-between gap-2">
                          <button type="button" onClick={() => openEdit(task)} className="text-left text-sm font-semibold text-foreground hover:text-brand-primary">{task.title}</button>
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${priorityTone[task.priority]}`}>{task.priority}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted">{task.client} · ₹{task.budget}L</p>
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted"><ListChecks className="h-3 w-3" /> {task.tasks.filter((t) => t.done).length}/{task.tasks.length} tasks</div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background"><div className="nova-gradient h-full rounded-full" style={{ width: `${prog}%` }} /></div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex -space-x-1.5">{task.team.map((m) => <span key={m} className="grid h-5 w-5 place-items-center rounded-full border border-surface bg-brand-primary/15 text-[8px] font-bold text-brand-primary">{m}</span>)}</div>
                          <button type="button" onClick={() => advanceStage(task.id)} title="Advance stage" className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-brand-primary hover:bg-brand-primary/10">{prog === 100 ? <CheckCircle2 className="h-3 w-3 text-brand-green" /> : <Clock className="h-3 w-3" />}{prog}% →</button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted"><Calendar className="h-3 w-3" /> Due {task.due}</span>
                          <span className="flex items-center gap-1">
                            <button type="button" onClick={() => openEdit(task)} title="Edit" className="rounded p-1 text-muted hover:text-brand-primary"><Pencil className="h-3 w-3" /></button>
                            <button type="button" onClick={() => deleteProject(task.id)} title="Delete" className="rounded p-1 text-muted hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {its.length === 0 && <p className="py-4 text-center text-[11px] text-muted/60">No projects</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {visible.map((p) => {
                  const prog = progressOf(p);
                  return (
                    <tr key={p.id} className="hover:bg-background/50">
                      <td className="px-5 py-3.5"><div className="font-semibold text-foreground">{p.title}</div><div className="text-xs text-muted">{p.client} · {p.category} · {p.id}</div></td>
                      <td className="px-4 py-3.5"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityTone[p.priority]}`}>{p.priority}</span></td>
                      <td className="px-4 py-3.5 text-xs font-semibold tabular-nums">₹{p.budget}L</td>
                      <td className="px-4 py-3.5"><div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-background"><div className="nova-gradient h-full rounded-full" style={{ width: `${prog}%` }} /></div><span className="text-xs tabular-nums text-muted">{prog}%</span></div></td>
                      <td className="px-4 py-3.5 text-xs text-muted">{p.due}</td>
                      <td className="px-4 py-3.5"><button type="button" onClick={() => advanceStage(p.id)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-transform hover:scale-105 ${statusTone[p.status]}`}>{p.status}</button></td>
                      <td className="px-5 py-3.5 text-right"><div className="inline-flex items-center gap-1.5"><button type="button" onClick={() => openEdit(p)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => deleteProject(p.id)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- Project Setup Wizard ---------- */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-xs" onClick={() => setWizardOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
            <div className="border-b border-surface-border p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold"><FolderKanban className="h-4 w-4 text-brand-primary" /> {editingId ? "Edit Project" : "Project Setup"}</h2>
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
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="mb-1 block text-xs font-medium text-muted">Project Title</label><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Corporate Website Revamp" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" /></div>
                    <div><label className="mb-1 block text-xs font-medium text-muted">Client</label><input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" /></div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">Service Category (auto-generates task template)</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {Object.keys(CATEGORIES).map((c) => (
                        <button key={c} type="button" onClick={() => pickCategory(c)} className={`rounded-xl border p-3 text-left text-xs transition-colors ${category === c ? "border-brand-primary bg-brand-primary/5" : "border-surface-border hover:border-brand-primary/40"}`}>
                          <p className="font-semibold">{c}</p>
                          <p className="text-[10px] text-muted">{CATEGORIES[c].length} tasks</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="mb-1 block text-xs font-medium text-muted">Priority</label><select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none"><option>High</option><option>Medium</option><option>Low</option></select></div>
                    <div><label className="mb-1 block text-xs font-medium text-muted">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">Assign Team</label>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_POOL.map((m) => (
                        <button key={m.id} type="button" onClick={() => toggleTeam(m.id)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${team.includes(m.id) ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-surface-border text-muted hover:text-foreground"}`}>
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-primary/15 text-[8px] font-bold text-brand-primary">{m.id}</span>{m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-muted">Tasks ({doneTasks}/{tasks.length} done) · from {category} template</label>
                      <button type="button" onClick={() => setTasks((p) => [...p, { name: "New task", done: false }])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"><Plus className="h-3 w-3" /> Add task</button>
                    </div>
                    <div className="space-y-1.5">
                      {tasks.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-surface-border bg-background/50 px-3 py-1.5">
                          <button type="button" onClick={() => toggleTask(i)} className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${t.done ? "border-brand-green bg-brand-green/20 text-brand-teal dark:text-brand-green" : "border-surface-border"}`}>{t.done && <CheckCircle2 className="h-3 w-3" />}</button>
                          <input value={t.name} onChange={(e) => setTasks((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={`flex-1 bg-transparent text-xs focus:outline-none ${t.done ? "text-muted line-through" : "text-foreground"}`} />
                          <button type="button" onClick={() => setTasks((p) => p.filter((_, j) => j !== i))} className="rounded p-0.5 text-muted hover:text-rose-500"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><label className="mb-1 block text-xs font-medium text-muted">Budget (₹ L)</label><div className="relative"><IndianRupee className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-muted" /><input value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background py-2 pr-2 pl-7 text-sm focus:border-brand-primary focus:outline-none" /></div></div>
                  <div><label className="mb-1 block text-xs font-medium text-muted">Start Date</label><input value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" /></div>
                  <div><label className="mb-1 block text-xs font-medium text-muted">Due Date</label><input value={due} onChange={(e) => setDue(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" /></div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-surface-border bg-background/40 p-4">
                    <p className="text-[11px] font-semibold text-brand-teal uppercase dark:text-brand-green">{category} · {priority} priority</p>
                    <h3 className="mt-0.5 text-lg font-bold">{title || `${category} Project`}</h3>
                    <p className="text-xs text-muted">{client || "—"} · ₹{budget}L · {startDate} → {due}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-surface-border bg-background/50 p-3">
                      <p className="mb-1.5 text-[11px] font-semibold text-muted">Team ({team.length})</p>
                      <div className="flex flex-wrap gap-1">{team.map((id) => <span key={id} className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary">{TEAM_POOL.find((m) => m.id === id)?.name ?? id}</span>)}</div>
                    </div>
                    <div className="rounded-xl border border-surface-border bg-background/50 p-3">
                      <p className="mb-1.5 text-[11px] font-semibold text-muted">Tasks ({tasks.length})</p>
                      <p className="text-[11px] text-muted">{doneTasks} done · {tasks.length - doneTasks} pending</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-surface-border p-4">
              <button type="button" onClick={() => (step === 1 ? setWizardOpen(false) : setStep(step - 1))} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> {step === 1 ? "Cancel" : "Back"}</button>
              {step < 4 ? (
                <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">Next <ArrowRight className="h-3.5 w-3.5" /></button>
              ) : (
                <button type="button" onClick={save} className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white">{editingId ? "Save Changes" : "Create Project"}</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <FolderKanban className="h-5 w-5 text-brand-primary" />
        <p className="text-xs text-muted">Projects auto-created from accepted quotations · SEO/Web/Ads task templates applied · client approvals &amp; time tracking enabled.</p>
      </div>
    </div>
  );
}
