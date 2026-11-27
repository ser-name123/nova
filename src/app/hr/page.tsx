"use client";

import { useRef, useState } from "react";
import {
  CalendarOff,
  CheckCircle2,
  Clock,
  Pencil,
  Play,
  Plus,
  Square,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type TsStatus = "Submitted" | "Approved" | "Rejected";
type Timesheet = { id: string; employee: string; project: string; hours: string; type: "Billable" | "Non-billable"; status: TsStatus };
type Attendance = { name: string; role: string; in: string; out: string; state: "Present" | "WFH" | "Leave" | "Late" };
type Leave = { name: string; type: string; from: string; to: string; status: "Pending" | "Approved" };

const INITIAL_TS: Timesheet[] = [
  { id: "TS-1", employee: "Aarav Sharma", project: "Apex Infra SEO", hours: "4.0h", type: "Billable", status: "Approved" },
  { id: "TS-2", employee: "Ishita Rao", project: "Verve Dental Website", hours: "6.0h", type: "Billable", status: "Submitted" },
  { id: "TS-3", employee: "Admin / Ops", project: "Internal Work", hours: "2.0h", type: "Non-billable", status: "Approved" },
  { id: "TS-4", employee: "Sana Qureshi", project: "Kroma Meta & TikTok", hours: "5.5h", type: "Billable", status: "Submitted" },
];

const ATTENDANCE: Attendance[] = [
  { name: "Aarav Sharma", role: "Sales Manager", in: "09:42", out: "—", state: "Present" },
  { name: "Neha Kapoor", role: "SEO Lead", in: "09:15", out: "—", state: "WFH" },
  { name: "Vikram Patel", role: "Ads Manager", in: "10:22", out: "—", state: "Late" },
  { name: "Ishita Rao", role: "Developer", in: "—", out: "—", state: "Leave" },
  { name: "Sana Qureshi", role: "Designer", in: "09:05", out: "—", state: "Present" },
];

const LEAVES: Leave[] = [
  { name: "Ishita Rao", type: "Sick Leave", from: "27 Nov", to: "28 Nov", status: "Approved" },
  { name: "Rohan Mehta", type: "Casual Leave", from: "02 Dec", to: "03 Dec", status: "Pending" },
  { name: "Sana Qureshi", type: "Earned Leave", from: "10 Dec", to: "12 Dec", status: "Pending" },
];

const attTone = { Present: "bg-brand-green/15 text-brand-teal dark:text-brand-green", WFH: "bg-brand-primary/10 text-brand-primary", Late: "bg-amber-500/10 text-amber-500", Leave: "bg-muted/20 text-muted" };

export default function HrPage() {
  const [tab, setTab] = useState<"timesheets" | "attendance" | "leave">("timesheets");
  const [clockedIn, setClockedIn] = useState(true);
  const [rows, setRows] = useState<Timesheet[]>(INITIAL_TS);
  const [leaves, setLeaves] = useState<Leave[]>(LEAVES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [employee, setEmployee] = useState("Aarav Sharma");
  const [project, setProject] = useState("");
  const [hours, setHours] = useState("2.5h");
  const [type, setType] = useState<"Billable" | "Non-billable">("Billable");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const pending = rows.filter((r) => r.status === "Submitted").length;

  const KPIS = [
    { label: "Active Staff", value: "26", delta: "22 present · 2 WFH", color: "#0f67a6", spark: [22, 23, 24, 25, 25, 26] },
    { label: "Billable Util.", value: "78.4%", delta: "target 75%+", color: "#0eb57d", spark: [70, 72, 74, 76, 77, 78.4] },
    { label: "Pending Approvals", value: `${pending}`, delta: "timesheets", color: "#d97706", spark: [3, 4, 3, 2, 3, pending + 1] },
    { label: "On Leave Today", value: `${ATTENDANCE.filter((a) => a.state === "Leave").length}`, delta: "this week", color: "#1677e8", spark: [1, 2, 1, 1, 2, 1] },
  ];

  function approveRow(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: r.status === "Approved" ? "Submitted" : "Approved" } : r)));
  }

  function openCreate() {
    setEditingId(null);
    setEmployee("Aarav Sharma"); setProject(""); setHours("2.5h"); setType("Billable");
    setModalOpen(true);
  }

  function openEdit(r: Timesheet) {
    setEditingId(r.id);
    setEmployee(r.employee); setProject(r.project); setHours(r.hours); setType(r.type);
    setModalOpen(true);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!project.trim()) return;
    if (editingId) {
      setRows((prev) => prev.map((r) => (r.id === editingId ? { ...r, employee, project: project.trim(), hours, type } : r)));
      setModalOpen(false);
      notify(`Timesheet ${editingId} updated.`);
      return;
    }
    setRows((prev) => [{ id: `TS-${prev.length + 1}`, employee, project: project.trim(), hours, type, status: "Submitted" }, ...prev]);
    setProject("");
    setModalOpen(false);
    notify(`Timesheet logged for ${employee}.`);
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    notify(`Timesheet ${id} deleted.`);
  }

  function actLeave(name: string, status: "Approved") {
    setLeaves((prev) => prev.map((l) => (l.name === name ? { ...l, status } : l)));
    notify(`Leave for ${name} ${status.toLowerCase()}.`);
  }

  const tabs = [
    { key: "timesheets" as const, label: "Timesheets", icon: Timer },
    { key: "attendance" as const, label: "Attendance", icon: Clock },
    { key: "leave" as const, label: "Leave", icon: CalendarOff },
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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 08 · HR, Attendance &amp; Timesheets</span>
          <h1 className="mt-1 text-2xl font-bold">Staff Management &amp; Work Tracking</h1>
          <p className="text-sm text-muted">Clock-in/out, WFH tracking, billable vs non-billable timesheets, leave &amp; payroll.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-xs font-semibold hover:border-brand-primary"><Plus className="h-4 w-4" /> Log Time</button>
          <button type="button" onClick={() => { setClockedIn((v) => !v); notify(clockedIn ? "Clocked out · 05h 42m recorded." : "Clocked in."); }} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white ${clockedIn ? "bg-rose-600 hover:bg-rose-700" : "nova-gradient"}`}>
            {clockedIn ? <><Square className="h-3.5 w-3.5" /> Clock Out (05h 42m)</> : <><Play className="h-3.5 w-3.5" /> Clock In</>}
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

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="flex items-center gap-1 border-b border-surface-border px-4 py-2.5">
          <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-background/70 p-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === t.key ? "nova-gradient text-white shadow-xs" : "text-muted hover:text-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "timesheets" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Hours</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-background/50">
                    <td className="px-5 py-3.5 font-semibold">{row.employee}</td>
                    <td className="px-4 py-3.5 text-xs text-muted">{row.project}</td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold">{row.hours}</td>
                    <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${row.type === "Billable" ? "bg-brand-green/15 text-brand-teal dark:text-brand-green" : "bg-surface-border text-muted"}`}>{row.type}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button type="button" onClick={() => approveRow(row.id)} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-transform hover:scale-105 ${row.status === "Approved" ? "bg-brand-green/15 text-brand-teal dark:text-brand-green" : "bg-brand-primary/10 text-brand-primary"}`}>{row.status}</button>
                        <button type="button" onClick={() => openEdit(row)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => deleteRow(row.id)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "attendance" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Clock In</th>
                  <th className="px-4 py-3 font-medium">Clock Out</th>
                  <th className="px-5 py-3 text-right font-medium">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {ATTENDANCE.map((a) => (
                  <tr key={a.name} className="hover:bg-background/50">
                    <td className="px-5 py-3.5 font-semibold">{a.name}</td>
                    <td className="px-4 py-3.5 text-xs text-muted">{a.role}</td>
                    <td className="px-4 py-3.5 font-mono text-xs">{a.in}</td>
                    <td className="px-4 py-3.5 font-mono text-xs">{a.out}</td>
                    <td className="px-5 py-3.5 text-right"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${attTone[a.state]}`}>{a.state}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "leave" && (
          <div className="divide-y divide-surface-border">
            {leaves.map((l) => (
              <div key={l.name + l.from} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-background/50">
                <div>
                  <p className="text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-muted">{l.type} · {l.from} → {l.to}</p>
                </div>
                {l.status === "Pending" ? (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => actLeave(l.name, "Approved")} className="rounded-lg bg-brand-green/15 px-3 py-1 text-xs font-semibold text-brand-teal hover:bg-brand-green/25 dark:text-brand-green">Approve</button>
                    <button type="button" onClick={() => notify(`Leave for ${l.name} declined.`)} className="rounded-lg border border-surface-border px-3 py-1 text-xs font-semibold text-muted hover:text-rose-500">Decline</button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-teal dark:text-brand-green"><CheckCircle2 className="h-3 w-3" /> Approved</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleAdd} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editingId ? "Edit Timesheet Entry" : "Log Timesheet Entry"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project / Task Name" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Staff" className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
                <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Hours (e.g. 2.5h)" className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
              </div>
              <select value={type} onChange={(e) => setType(e.target.value as "Billable" | "Non-billable")} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                <option value="Billable">Billable</option>
                <option value="Non-billable">Non-billable</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">{editingId ? "Save Changes" : "Submit Entry"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
