"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownUp,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Columns3,
  Copy,
  Download,
  FileText,
  Filter,
  LayoutList,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import type { NavItem } from "@/lib/navigation";
import { NavIcon } from "@/components/layout/NavIcon";
import { MiniSparkline } from "@/components/charts/MiniCharts";
import { downloadPdf } from "@/lib/pdf";

/* ------------------------------------------------------------------ */
/*  Deterministic pseudo-data helpers (stable per module)             */
/* ------------------------------------------------------------------ */

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type RecordStatus = "Active" | "Pending" | "Review" | "Completed";
const STATUS_ORDER: RecordStatus[] = ["Active", "Pending", "Review", "Completed"];
type Priority = "High" | "Medium" | "Low";

type ModuleRecord = {
  id: string;
  title: string;
  owner: string;
  status: RecordStatus;
  priority: Priority;
  value: string;
  progress: number;
  updatedAt: string;
  dueDate: string;
  tags: string[];
  notes: string;
};

const OWNERS = [
  "Aarav Sharma",
  "Neha Kapoor",
  "Vikram Patel",
  "Ishita Rao",
  "Rohan Mehta",
  "Sana Qureshi",
];

/* Per-family flavour so every module reads differently */
type Profile = {
  noun: string;
  valueLabel: string;
  valueFn: (r: () => number) => string;
  kpis: { label: string; fmt: (n: number) => string; color: string }[];
  statusLabel: string;
};

function profileFor(mod: NavItem): Profile {
  const h = mod.href;
  const inr = (n: number) => `₹${(n / 100).toFixed(2)}L`;
  if (h.startsWith("/finance")) {
    return {
      noun: "Transaction",
      valueLabel: "Amount",
      valueFn: (r) => `₹${(r() * 480000 + 20000).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      statusLabel: "Ledger State",
      kpis: [
        { label: "Receivables", fmt: (n) => inr(n * 400 + 600), color: "#0eb57d" },
        { label: "This Month", fmt: (n) => inr(n * 300 + 900), color: "#1677e8" },
        { label: "Overdue", fmt: (n) => `${Math.round(n * 6 + 1)}`, color: "#d97706" },
        { label: "Reconciled", fmt: (n) => `${Math.round(n * 20 + 78)}%`, color: "#0d9488" },
      ],
    };
  }
  if (h.startsWith("/hr")) {
    return {
      noun: "Record",
      valueLabel: "Hours / Value",
      valueFn: (r) => `${Math.round(r() * 160 + 20)} hrs`,
      statusLabel: "Status",
      kpis: [
        { label: "Headcount", fmt: (n) => `${Math.round(n * 30 + 24)}`, color: "#0f67a6" },
        { label: "Present Today", fmt: (n) => `${Math.round(n * 20 + 78)}%`, color: "#0eb57d" },
        { label: "Pending Approvals", fmt: (n) => `${Math.round(n * 9 + 1)}`, color: "#d97706" },
        { label: "Billable Util.", fmt: (n) => `${Math.round(n * 18 + 72)}%`, color: "#0d9488" },
      ],
    };
  }
  if (h.startsWith("/marketing")) {
    return {
      noun: "Campaign",
      valueLabel: "Spend / Reach",
      valueFn: (r) => `₹${Math.round(r() * 90000 + 8000).toLocaleString("en-IN")}`,
      statusLabel: "Campaign State",
      kpis: [
        { label: "Active Clients", fmt: (n) => `${Math.round(n * 24 + 12)}`, color: "#0f67a6" },
        { label: "30d Growth", fmt: (n) => `+${(n * 18 + 4).toFixed(1)}%`, color: "#0eb57d" },
        { label: "Avg ROAS", fmt: (n) => `${(n * 3 + 2.4).toFixed(1)}x`, color: "#1677e8" },
        { label: "Alerts", fmt: (n) => `${Math.round(n * 5 + 1)}`, color: "#d97706" },
      ],
    };
  }
  if (h.startsWith("/automation")) {
    return {
      noun: "Workflow",
      valueLabel: "Runs",
      valueFn: (r) => `${Math.round(r() * 4200 + 60)} runs`,
      statusLabel: "Flow State",
      kpis: [
        { label: "Active Flows", fmt: (n) => `${Math.round(n * 18 + 6)}`, color: "#0f67a6" },
        { label: "Success Rate", fmt: (n) => `${Math.round(n * 8 + 91)}%`, color: "#0eb57d" },
        { label: "Queued", fmt: (n) => `${Math.round(n * 40 + 5)}`, color: "#1677e8" },
        { label: "Failed (24h)", fmt: (n) => `${Math.round(n * 4)}`, color: "#d97706" },
      ],
    };
  }
  if (h.startsWith("/assets")) {
    return {
      noun: "Asset",
      valueLabel: "Renewal Cost",
      valueFn: (r) => `₹${Math.round(r() * 24000 + 900).toLocaleString("en-IN")}/yr`,
      statusLabel: "Status",
      kpis: [
        { label: "Tracked Assets", fmt: (n) => `${Math.round(n * 80 + 40)}`, color: "#0f67a6" },
        { label: "Renewals <30d", fmt: (n) => `${Math.round(n * 10 + 2)}`, color: "#d97706" },
        { label: "Avg Margin", fmt: (n) => `${Math.round(n * 24 + 32)}%`, color: "#0eb57d" },
        { label: "Auto-Renew", fmt: (n) => `${Math.round(n * 30 + 64)}%`, color: "#0d9488" },
      ],
    };
  }
  if (h.startsWith("/admin")) {
    return {
      noun: "Entry",
      valueLabel: "Scope",
      valueFn: (r) => `${Math.round(r() * 14 + 1)} modules`,
      statusLabel: "State",
      kpis: [
        { label: "Users", fmt: (n) => `${Math.round(n * 40 + 22)}`, color: "#0f67a6" },
        { label: "Roles", fmt: (n) => `${Math.round(n * 8 + 10)}`, color: "#1677e8" },
        { label: "Integrations", fmt: (n) => `${Math.round(n * 10 + 8)}`, color: "#0eb57d" },
        { label: "Open Alerts", fmt: (n) => `${Math.round(n * 5 + 1)}`, color: "#d97706" },
      ],
    };
  }
  return {
    noun: "Record",
    valueLabel: "Est. Value",
    valueFn: (r) => `₹${(r() * 3 + 0.5).toFixed(2)}L`,
    statusLabel: "Status",
    kpis: [
      { label: "Total Records", fmt: (n) => `${Math.round(n * 120 + 40)}`, color: "#0f67a6" },
      { label: "Active", fmt: (n) => `${Math.round(n * 60 + 20)}`, color: "#0eb57d" },
      { label: "This Week", fmt: (n) => `+${Math.round(n * 24 + 4)}`, color: "#1677e8" },
      { label: "Completion", fmt: (n) => `${Math.round(n * 20 + 72)}%`, color: "#0d9488" },
    ],
  };
}

function buildRecords(mod: NavItem, profile: Profile): ModuleRecord[] {
  const rand = seededRandom(hashString(mod.href) + 7);
  const n = 6 + Math.floor(rand() * 4);
  const rows: ModuleRecord[] = [];
  for (let i = 0; i < n; i++) {
    const highlight = mod.highlights[i % mod.highlights.length];
    rows.push({
      id: `${profile.noun.slice(0, 3).toUpperCase()}-${1024 + i}`,
      title: `${highlight}${i >= mod.highlights.length ? ` · Batch ${Math.ceil((i + 1) / mod.highlights.length)}` : ""}`,
      owner: OWNERS[Math.floor(rand() * OWNERS.length)],
      status: STATUS_ORDER[Math.floor(rand() * STATUS_ORDER.length)],
      priority: (["High", "Medium", "Low"] as Priority[])[Math.floor(rand() * 3)],
      value: profile.valueFn(rand),
      progress: Math.round(rand() * 90 + 8),
      updatedAt: ["2m ago", "1h ago", "Today", "Yesterday", "2d ago"][Math.floor(rand() * 5)],
      dueDate: ["02 Dec", "05 Dec", "10 Dec", "15 Dec", "20 Dec"][Math.floor(rand() * 5)],
      tags: [mod.highlights[Math.floor(rand() * mod.highlights.length)].split(" ").slice(0, 2).join(" ")],
      notes: "",
    });
  }
  return rows;
}

const statusTone: Record<RecordStatus, string> = {
  Active: "bg-brand-primary/10 text-brand-primary",
  Pending: "bg-amber-500/10 text-amber-500",
  Review: "bg-violet-500/10 text-violet-500",
  Completed: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
};

const priorityTone: Record<Priority, string> = {
  High: "bg-rose-500/10 text-rose-500",
  Medium: "bg-amber-500/10 text-amber-500",
  Low: "bg-sky-500/10 text-sky-500",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type TabKey = "records" | "board" | "analytics" | "activity";

export function ModuleWorkspaceClient({ mod }: { mod: NavItem }) {
  const profile = useMemo(() => profileFor(mod), [mod]);
  const [records, setRecords] = useState<ModuleRecord[]>(() => buildRecords(mod, profile));
  const [tab, setTab] = useState<TabKey>("records");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RecordStatus>("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowMenu, setRowMenu] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // form state
  const [fStep, setFStep] = useState(1);
  const [fTitle, setFTitle] = useState("");
  const [fOwner, setFOwner] = useState(OWNERS[0]);
  const [fStatus, setFStatus] = useState<RecordStatus>("Active");
  const [fPriority, setFPriority] = useState<Priority>("High");
  const [fValue, setFValue] = useState("");
  const [fProgress, setFProgress] = useState(10);
  const [fDue, setFDue] = useState("15 Dec");
  const [fTags, setFTags] = useState<string[]>([]);
  const [fTagInput, setFTagInput] = useState("");
  const [fNotes, setFNotes] = useState("");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const kpiSeeds = useMemo(() => {
    const rand = seededRandom(hashString(mod.title) + 3);
    return profile.kpis.map((k) => {
      const base = rand();
      const spark = Array.from({ length: 6 }, (_, i) => base * 40 + i * (rand() * 6 + 1) + rand() * 5);
      return { ...k, value: k.fmt(base), spark, delta: `${rand() > 0.35 ? "+" : "−"}${(rand() * 14 + 1).toFixed(1)}%` };
    });
  }, [mod.title, profile]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = records.filter((r) => {
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      const matchesQuery =
        !q || r.title.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
    return [...list].sort((a, b) => (sortAsc ? a.progress - b.progress : b.progress - a.progress));
  }, [records, search, statusFilter, sortAsc]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleSelectAll() {
    setSelected((prev) => {
      if (filtered.every((r) => prev.has(r.id))) {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function cycleStatus(id: string) {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: STATUS_ORDER[(STATUS_ORDER.indexOf(r.status) + 1) % STATUS_ORDER.length], updatedAt: "Just now" } : r
      )
    );
  }

  function openCreate() {
    setEditing(null);
    setFStep(1);
    setFTitle("");
    setFOwner(OWNERS[0]);
    setFStatus("Active");
    setFPriority("High");
    setFValue("");
    setFProgress(10);
    setFDue("15 Dec");
    setFTags([]);
    setFTagInput("");
    setFNotes("");
    setModalOpen(true);
  }

  function openEdit(r: ModuleRecord) {
    setEditing(r);
    setFStep(1);
    setFTitle(r.title);
    setFOwner(r.owner);
    setFStatus(r.status);
    setFPriority(r.priority);
    setFValue(r.value);
    setFProgress(r.progress);
    setFDue(r.dueDate);
    setFTags(r.tags);
    setFTagInput("");
    setFNotes(r.notes);
    setRowMenu(null);
    setModalOpen(true);
  }

  function addTag() {
    const t = fTagInput.trim();
    if (t && !fTags.includes(t)) setFTags((prev) => [...prev, t]);
    setFTagInput("");
  }

  function handleSubmit() {
    if (!fTitle.trim()) {
      setFStep(1);
      return;
    }
    const rand = seededRandom(hashString(fTitle) + records.length);
    if (editing) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? { ...r, title: fTitle.trim(), owner: fOwner, status: fStatus, priority: fPriority, value: fValue || r.value, progress: fProgress, dueDate: fDue, tags: fTags, notes: fNotes, updatedAt: "Just now" }
            : r
        )
      );
      notify(`${profile.noun} ${editing.id} updated.`);
    } else {
      const rec: ModuleRecord = {
        id: `${profile.noun.slice(0, 3).toUpperCase()}-${1024 + records.length}`,
        title: fTitle.trim(),
        owner: fOwner,
        status: fStatus,
        priority: fPriority,
        value: fValue || profile.valueFn(rand),
        progress: fStatus === "Completed" ? 100 : fProgress,
        updatedAt: "Just now",
        dueDate: fDue,
        tags: fTags,
        notes: fNotes,
      };
      setRecords((prev) => [rec, ...prev]);
      notify(`New ${profile.noun.toLowerCase()} ${rec.id} created.`);
    }
    setModalOpen(false);
  }

  function duplicate(r: ModuleRecord) {
    const copy = { ...r, id: `${r.id}-C`, title: `${r.title} (Copy)`, updatedAt: "Just now" };
    setRecords((prev) => [copy, ...prev]);
    setRowMenu(null);
    notify(`Duplicated ${r.id}.`);
  }

  function remove(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setRowMenu(null);
  }

  function bulkComplete() {
    setRecords((prev) => prev.map((r) => (selected.has(r.id) ? { ...r, status: "Completed", progress: 100 } : r)));
    notify(`${selected.size} ${profile.noun.toLowerCase()}(s) marked complete.`);
    setSelected(new Set());
  }

  function bulkDelete() {
    setRecords((prev) => prev.filter((r) => !selected.has(r.id)));
    notify(`${selected.size} ${profile.noun.toLowerCase()}(s) deleted.`);
    setSelected(new Set());
  }

  function refresh() {
    setRecords(buildRecords(mod, profile).map((r) => ({ ...r, updatedAt: "Synced now" })));
    setSelected(new Set());
    notify("Workspace re-synced from central database.");
  }

  function exportCsv() {
    const header = ["ID", "Title", "Owner", profile.statusLabel, "Priority", profile.valueLabel, "Progress", "Updated"];
    const lines = filtered.map((r) =>
      [r.id, r.title, r.owner, r.status, r.priority, r.value, `${r.progress}%`, r.updatedAt]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mod.title.replace(/\s+/g, "-").toLowerCase()}-export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Exported ${filtered.length} rows to CSV.`);
  }

  function exportPdf() {
    downloadPdf(`${mod.title.replace(/\s+/g, "-")}-Report`, {
      docType: `${mod.title} Report`,
      title: mod.title,
      subtitle: mod.description,
      meta: [
        ["Module", mod.href],
        ["Phase", `Phase ${mod.phase}`],
        ["Records", String(filtered.length)],
        ["Generated", new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
      ],
      columns: [profile.noun, "Owner", profile.statusLabel, "Priority", "Progress"],
      alignRight: [4],
      rows: filtered.map((r) => [r.title, r.owner, r.status, r.priority, `${r.progress}%`]),
      totals: [["Total Records", String(filtered.length)]],
      note: "Generated from NOVA ONE central database. Figures reflect current workspace state.",
    });
    notify(`Exported ${filtered.length} rows to PDF.`);
  }

  const statusCounts = STATUS_ORDER.map((s) => ({ s, n: records.filter((r) => r.status === s).length }));
  const totalForBars = Math.max(1, ...statusCounts.map((c) => c.n));

  const activity = useMemo(() => {
    const rand = seededRandom(hashString(mod.href) + 11);
    const verbs = ["created", "updated status of", "assigned", "exported", "approved", "commented on"];
    return Array.from({ length: 6 }, (_, i) => ({
      who: OWNERS[Math.floor(rand() * OWNERS.length)],
      verb: verbs[Math.floor(rand() * verbs.length)],
      what: `${profile.noun} ${1024 + Math.floor(rand() * records.length)}`,
      when: ["2m", "22m", "1h", "3h", "Yesterday", "2d"][i],
    }));
  }, [mod.href, profile.noun, records.length]);

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "records", label: "Records", icon: Table2 },
    { key: "board", label: "Board", icon: Columns3 },
    { key: "analytics", label: "Analytics", icon: TrendingUp },
    { key: "activity", label: "Activity", icon: Activity },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6" onClick={() => rowMenu && setRowMenu(null)}>
      {/* Toast */}
      {toast && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface p-6">
        <div className="nova-gradient absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="nova-gradient rounded-2xl p-3 text-white shadow-xs">
              <NavIcon name={mod.icon} className="h-6 w-6" />
            </div>
            <div>
              <nav className="flex items-center gap-1.5 text-[11px] text-muted">
                <Link href="/" className="hover:text-foreground">
                  NOVA ONE
                </Link>
                <span>/</span>
                <span className="font-mono">{mod.href}</span>
              </nav>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{mod.title}</h1>
                <span className="rounded-full bg-brand-green/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-teal dark:text-brand-green">
                  Phase {mod.phase}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-surface-border px-2.5 py-0.5 text-[11px] text-muted">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" />
                  Live
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted">{mod.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              title="Re-sync"
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-background/80 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-background/80 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-background/80 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              New {profile.noun}
            </button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiSeeds.map((k) => (
          <div key={k.label} className="rounded-2xl border border-surface-border bg-surface p-4 shadow-xs transition-colors hover:border-brand-primary/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted">{k.label}</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">{k.value}</p>
              </div>
              <MiniSparkline points={k.spark} color={k.color} />
            </div>
            <p className="mt-2 text-xs font-semibold" style={{ color: k.color }}>
              {k.delta} <span className="font-normal text-muted">vs last period</span>
            </p>
          </div>
        ))}
      </div>

      {/* Tabs + toolbar */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border px-4 py-2.5">
          <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-background/70 p-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tab === t.key ? "nova-gradient text-white shadow-xs" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          {(tab === "records" || tab === "board") && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-52">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${profile.noun.toLowerCase()}s...`}
                  className="w-full rounded-lg border border-surface-border bg-background py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterOpen((v) => !v);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    statusFilter !== "All" ? "border-brand-primary/50 text-brand-primary" : "border-surface-border text-muted hover:text-foreground"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {statusFilter === "All" ? "Filter" : statusFilter}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 z-20 mt-1.5 w-40 rounded-xl border border-surface-border bg-surface p-1.5 shadow-lg" onClick={(e) => e.stopPropagation()}>
                    {(["All", ...STATUS_ORDER] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setStatusFilter(s);
                          setFilterOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs ${
                          statusFilter === s ? "bg-brand-primary/10 font-semibold text-brand-primary" : "text-foreground hover:bg-background"
                        }`}
                      >
                        {s}
                        {s !== "All" && <span className="text-muted">{records.filter((r) => r.status === s).length}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSortAsc((v) => !v)}
                title="Sort by progress"
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                <ArrowDownUp className="h-3.5 w-3.5" />
                {sortAsc ? "Asc" : "Desc"}
              </button>
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {tab === "records" && selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border bg-brand-primary/5 px-4 py-2 text-xs">
            <span className="font-semibold text-brand-primary">{selected.size} selected</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={bulkComplete} className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-2.5 py-1 font-medium hover:border-brand-green">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" /> Mark Complete
              </button>
              <button type="button" onClick={bulkDelete} className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface px-2.5 py-1 font-medium text-rose-500 hover:border-rose-400">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button type="button" onClick={() => setSelected(new Set())} className="rounded-lg p-1 text-muted hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* RECORDS TABLE */}
        {tab === "records" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-muted">
                  <th className="py-2.5 pl-5">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="h-3.5 w-3.5 accent-brand-primary" />
                  </th>
                  <th className="px-3 py-2.5 font-medium">{profile.noun}</th>
                  <th className="px-3 py-2.5 font-medium">Owner</th>
                  <th className="px-3 py-2.5 font-medium">Priority</th>
                  <th className="px-3 py-2.5 font-medium">Progress</th>
                  <th className="px-3 py-2.5 font-medium">{profile.valueLabel}</th>
                  <th className="px-3 py-2.5 font-medium">{profile.statusLabel}</th>
                  <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((r) => (
                  <tr key={r.id} className={`hover:bg-background/50 ${selected.has(r.id) ? "bg-brand-primary/5" : ""}`}>
                    <td className="py-3 pl-5">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="h-3.5 w-3.5 accent-brand-primary" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-foreground">{r.title}</div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <span>{r.id} · Due {r.dueDate}</span>
                        {r.tags.map((t) => <span key={t} className="rounded bg-brand-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-primary">{t}</span>)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-primary/10 text-[9px] font-bold text-brand-primary">
                          {r.owner.split(" ").map((w) => w[0]).join("")}
                        </span>
                        {r.owner}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityTone[r.priority]}`}>{r.priority}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-background">
                          <div className="nova-gradient h-full rounded-full" style={{ width: `${r.progress}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted">{r.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold tabular-nums">{r.value}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => cycleStatus(r.id)}
                        title="Click to cycle status"
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-transform hover:scale-105 ${statusTone[r.status]}`}
                      >
                        {r.status}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRowMenu((v) => (v === r.id ? null : r.id));
                          }}
                          className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                        {rowMenu === r.id && (
                          <div className="absolute right-0 z-20 mt-1.5 w-36 rounded-xl border border-surface-border bg-surface p-1.5 shadow-lg" onClick={(e) => e.stopPropagation()}>
                            <button type="button" onClick={() => openEdit(r)} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-foreground hover:bg-background">
                              <Pencil className="h-3.5 w-3.5 text-brand-primary" /> Edit
                            </button>
                            <button type="button" onClick={() => duplicate(r)} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-foreground hover:bg-background">
                              <Copy className="h-3.5 w-3.5 text-brand-teal dark:text-brand-green" /> Duplicate
                            </button>
                            <button type="button" onClick={() => remove(r.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-rose-500 hover:bg-background">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-14 text-center">
                <LayoutList className="h-7 w-7 text-muted/60" />
                <p className="text-sm font-semibold">No {profile.noun.toLowerCase()}s match your filters</p>
                <button type="button" onClick={() => { setSearch(""); setStatusFilter("All"); }} className="text-xs font-semibold text-brand-primary hover:underline">
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* BOARD (Kanban) */}
        {tab === "board" && (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
            {STATUS_ORDER.map((col) => {
              const items = filtered.filter((r) => r.status === col);
              return (
                <div key={col} className="rounded-xl border border-surface-border bg-background/50 p-3">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusTone[col]}`}>{col}</span>
                    <span className="text-xs text-muted">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => cycleStatus(r.id)}
                        title="Click to advance status"
                        className="w-full rounded-lg border border-surface-border bg-surface p-3 text-left transition-colors hover:border-brand-primary/40"
                      >
                        <p className="text-xs font-semibold text-foreground">{r.title}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${priorityTone[r.priority]}`}>{r.priority}</span>
                          <span className="text-[10px] text-muted">{r.value}</span>
                        </div>
                      </button>
                    ))}
                    {items.length === 0 && <p className="py-4 text-center text-[11px] text-muted/70">Empty</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ANALYTICS */}
        {tab === "analytics" && (
          <div className="grid gap-5 p-5 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold">6-Month Trend</h3>
              <p className="mb-4 text-xs text-muted">Volume processed by {mod.title}</p>
              <MiniBars seed={hashString(mod.href)} />
            </div>
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold">{profile.statusLabel} Split</h3>
              <p className="mb-4 text-xs text-muted">Across {records.length} records</p>
              <div className="space-y-2.5">
                {statusCounts.map((c) => (
                  <div key={c.s} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[c.s]}`}>{c.s}</span>
                      <span className="tabular-nums text-muted">{c.n}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-background">
                      <div className="nova-gradient h-full rounded-full" style={{ width: `${(c.n / totalForBars) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <h3 className="mb-3 text-sm font-semibold">Module Capabilities</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {mod.highlights.map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 rounded-xl border border-surface-border bg-background/50 p-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                    <p className="text-xs font-medium text-foreground">{feat}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        {tab === "activity" && (
          <div className="p-5">
            <ol className="relative space-y-4 border-l border-surface-border pl-5">
              {activity.map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand-primary" />
                  <p className="text-xs">
                    <span className="font-semibold text-foreground">{a.who}</span>{" "}
                    <span className="text-muted">{a.verb}</span>{" "}
                    <span className="font-medium text-brand-primary">{a.what}</span>
                  </p>
                  <p className="text-[11px] text-muted/70">{a.when} ago</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Footer strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-brand-primary" />
          <div>
            <p className="text-sm font-semibold">Connected to Central Multi-Tenant Database</p>
            <p className="text-xs text-muted">RBAC enforced · Automation triggers active · Audit-logged</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => notify("Opening automation rules for this module…")} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-3.5 py-2 text-xs font-semibold text-muted hover:text-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Configure
          </button>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border px-3.5 py-2 text-xs font-semibold hover:border-brand-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> Overview
          </Link>
        </div>
      </div>

      {/* Create / Edit Builder */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
            {/* Header + steps */}
            <div className="border-b border-surface-border p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <NavIcon name={mod.icon} className="h-4 w-4 text-brand-primary" />
                  {editing ? `Edit ${profile.noun}` : `New ${profile.noun}`}
                </h2>
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                {["Details", "Attributes"].map((s, i) => {
                  const n = i + 1;
                  return (
                    <div key={s} className="flex flex-1 items-center gap-1.5">
                      <button type="button" onClick={() => n < fStep && setFStep(n)} className={`flex items-center gap-1.5 text-[11px] font-semibold ${n === fStep ? "text-brand-primary" : n < fStep ? "text-brand-teal dark:text-brand-green" : "text-muted"}`}>
                        <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${n === fStep ? "nova-gradient text-white" : n < fStep ? "bg-brand-green/20 text-brand-teal dark:text-brand-green" : "bg-background text-muted"}`}>{n < fStep ? "✓" : n}</span>
                        {s}
                      </button>
                      {i === 0 && <div className={`h-px flex-1 ${fStep > 1 ? "bg-brand-green/40" : "bg-surface-border"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="min-h-[260px] flex-1 overflow-y-auto p-5">
              {fStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">{profile.noun} Title / Description</label>
                    <input autoFocus value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder={`Enter ${profile.noun.toLowerCase()} title...`} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Assigned To</label>
                      <select value={fOwner} onChange={(e) => setFOwner(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                        {OWNERS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">{profile.valueLabel}</label>
                      <input value={fValue} onChange={(e) => setFValue(e.target.value)} placeholder="Auto" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Priority</label>
                      <div className="flex gap-1.5">
                        {(["High", "Medium", "Low"] as Priority[]).map((p) => (
                          <button key={p} type="button" onClick={() => setFPriority(p)} className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${fPriority === p ? priorityTone[p] + " ring-1 ring-brand-primary/40" : "border border-surface-border text-muted"}`}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Due Date</label>
                      <input value={fDue} onChange={(e) => setFDue(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {fStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">{profile.statusLabel}</label>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_ORDER.map((s) => (
                        <button key={s} type="button" onClick={() => setFStatus(s)} className={`rounded-full px-3 py-1 text-xs font-semibold ${fStatus === s ? statusTone[s] + " ring-2 ring-brand-primary/40" : "border border-surface-border text-muted"}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 flex items-center justify-between text-xs font-medium text-muted"><span>Progress</span><span className="tabular-nums text-foreground">{fProgress}%</span></label>
                    <input type="range" min={0} max={100} value={fProgress} onChange={(e) => setFProgress(parseInt(e.target.value))} className="w-full accent-brand-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Tags</label>
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      {fTags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-semibold text-brand-primary">{t}<button type="button" onClick={() => setFTags((prev) => prev.filter((x) => x !== t))}><X className="h-2.5 w-2.5" /></button></span>
                      ))}
                      {fTags.length === 0 && <span className="text-[11px] text-muted/70">No tags yet</span>}
                    </div>
                    <div className="flex gap-2">
                      <input value={fTagInput} onChange={(e) => setFTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add tag + Enter" className="flex-1 rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
                      <button type="button" onClick={addTag} className="rounded-xl border border-surface-border px-3 py-2 text-xs font-semibold text-muted hover:text-foreground">Add</button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Notes</label>
                    <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={3} placeholder="Internal notes, context, next steps..." className="w-full resize-none rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-surface-border p-4">
              <button type="button" onClick={() => (fStep === 1 ? setModalOpen(false) : setFStep(1))} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted hover:text-foreground">{fStep === 1 ? "Cancel" : "Back"}</button>
              {fStep === 1 ? (
                <button type="button" disabled={!fTitle.trim()} onClick={() => setFStep(2)} className="nova-gradient rounded-xl px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">Next</button>
              ) : (
                <button type="button" onClick={handleSubmit} className="nova-gradient rounded-xl px-5 py-2 text-xs font-semibold text-white">{editing ? "Save Changes" : `Create ${profile.noun}`}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small inline animated bar chart */
function MiniBars({ seed }: { seed: number }) {
  const rand = seededRandom(seed + 5);
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const data = months.map((m) => ({ m, v: Math.round(rand() * 70 + 30) }));
  const max = Math.max(...data.map((d) => d.v));
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex h-44 items-end justify-between gap-2.5">
      {data.map((d, i) => (
        <div key={d.m} className="flex flex-1 flex-col items-center gap-2" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <span className={`text-[10px] font-semibold tabular-nums transition-opacity ${hover === i ? "opacity-100 text-brand-primary" : "opacity-0"}`}>{d.v}</span>
          <div className="flex w-full items-end justify-center" style={{ height: 120 }}>
            <div
              className="nova-gradient w-full max-w-[34px] rounded-t-md transition-all"
              style={{ height: `${(d.v / max) * 100}%`, opacity: hover === null || hover === i ? 1 : 0.5 }}
            />
          </div>
          <span className="text-[10px] text-muted">{d.m}</span>
        </div>
      ))}
    </div>
  );
}
