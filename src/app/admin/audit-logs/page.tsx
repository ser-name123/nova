"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Fingerprint,
  Lock,
  ScrollText,
  Search,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";
import { downloadPdf } from "@/lib/pdf";

type Severity = "Info" | "Warning" | "Critical";
type Category = "Credential" | "Finance" | "Permission" | "Auth" | "Data";
type Log = {
  id: string;
  time: string;
  user: string;
  action: string;
  resource: string;
  category: Category;
  ip: string;
  severity: Severity;
};

const LOGS: Log[] = [
  { id: "LOG-9001", time: "2026-11-27 14:22:10", user: "Aarav Sharma", action: "Revealed credential", resource: "AWS Production IAM (Verve)", category: "Credential", ip: "103.42.18.92", severity: "Warning" },
  { id: "LOG-9000", time: "2026-11-27 14:05:51", user: "Ishita Rao", action: "Edited invoice", resource: "INV-2026-106", category: "Finance", ip: "103.42.18.80", severity: "Info" },
  { id: "LOG-8999", time: "2026-11-27 13:48:02", user: "Aarav Sharma", action: "Changed role permissions", resource: "Role: SEO Manager", category: "Permission", ip: "103.42.18.92", severity: "Critical" },
  { id: "LOG-8998", time: "2026-11-27 13:12:33", user: "Neha Kapoor", action: "Logged in", resource: "Session SES-2214", category: "Auth", ip: "122.171.19.4", severity: "Info" },
  { id: "LOG-8997", time: "2026-11-27 12:40:19", user: "Vikram Patel", action: "Copied API token", resource: "Meta Business Token (FinEdge)", category: "Credential", ip: "103.42.18.77", severity: "Warning" },
  { id: "LOG-8996", time: "2026-11-27 12:05:44", user: "Ishita Rao", action: "Posted journal entry", resource: "JE-3391 (Balanced)", category: "Finance", ip: "103.42.18.80", severity: "Info" },
  { id: "LOG-8995", time: "2026-11-27 11:31:07", user: "Super Admin", action: "Deleted user", resource: "U-07 Dev Anand", category: "Permission", ip: "103.42.18.92", severity: "Critical" },
  { id: "LOG-8994", time: "2026-11-27 10:58:20", user: "Sana Qureshi", action: "Exported records", resource: "CRM leads (142 rows)", category: "Data", ip: "103.42.18.61", severity: "Info" },
  { id: "LOG-8993", time: "2026-11-27 10:14:55", user: "Aarav Sharma", action: "Failed login (2FA)", resource: "Session attempt", category: "Auth", ip: "45.118.22.9", severity: "Warning" },
];

const sevTone: Record<Severity, string> = {
  Info: "bg-brand-primary/10 text-brand-primary",
  Warning: "bg-amber-500/10 text-amber-500",
  Critical: "bg-rose-500/10 text-rose-500",
};
const catTone: Record<Category, string> = {
  Credential: "bg-violet-500/10 text-violet-500",
  Finance: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
  Permission: "bg-rose-500/10 text-rose-500",
  Auth: "bg-sky-500/10 text-sky-500",
  Data: "bg-brand-primary/10 text-brand-primary",
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<"All" | Category>("All");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LOGS.filter((l) => {
      const mC = catFilter === "All" || l.category === catFilter;
      const mQ = !q || l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q);
      return mC && mQ;
    });
  }, [search, catFilter]);

  const KPIS = [
    { label: "Events Today", value: `${LOGS.length}`, delta: "immutable", color: "#0f67a6", spark: [120, 140, 160, 180, 190, 204] },
    { label: "Credential Reveals", value: `${LOGS.filter((l) => l.category === "Credential").length}`, delta: "all logged", color: "#7c3aed", spark: [1, 2, 2, 3, 2, 2] },
    { label: "Finance Edits", value: `${LOGS.filter((l) => l.category === "Finance").length}`, delta: "audit trail", color: "#0eb57d", spark: [1, 1, 2, 2, 2, 2] },
    { label: "Critical Events", value: `${LOGS.filter((l) => l.severity === "Critical").length}`, delta: "review needed", color: "#e11d48", spark: [1, 0, 1, 2, 1, 2] },
  ];

  function exportCsv() {
    const header = ["ID", "Time", "User", "Action", "Resource", "Category", "IP", "Severity"];
    const lines = visible.map((l) => [l.id, l.time, l.user, l.action, l.resource, l.category, l.ip, l.severity].map((c) => `"${c}"`).join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nova-audit-logs.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Exported ${visible.length} log entries to CSV.`);
  }

  function exportPdf() {
    downloadPdf("NOVA-Audit-Logs", {
      docType: "Audit Log",
      title: "System Audit Trail",
      subtitle: `${visible.length} events — immutable record`,
      meta: [
        ["Generated", new Date().toLocaleString("en-GB")],
        ["Filter", catFilter === "All" ? "All categories" : catFilter],
        ["Integrity", "Tamper-evident / append-only"],
      ],
      columns: ["Time", "User", "Action", "Severity"],
      rows: visible.map((l) => [l.time.slice(5), l.user, l.action, l.severity]),
      note: "Audit logs are immutable and retained per data-retention policy. Credential access records user, IP & timestamp.",
    });
    notify(`Exported ${visible.length} log entries to PDF.`);
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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Administration · Audit Logs</span>
          <h1 className="mt-1 text-2xl font-bold">Immutable Activity &amp; Audit Trail</h1>
          <p className="text-sm text-muted">Every credential access, finance edit &amp; permission change — recorded with user, IP &amp; timestamp.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-xs font-semibold text-muted hover:text-foreground"><Download className="h-3.5 w-3.5" /> CSV</button>
          <button type="button" onClick={exportPdf} className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white"><FileText className="h-3.5 w-3.5" /> Export PDF</button>
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

      <div className="flex items-center gap-2.5 rounded-xl border border-brand-green/25 bg-brand-green/10 px-4 py-3 text-xs text-brand-teal dark:text-brand-green">
        <Fingerprint className="h-4 w-4 shrink-0" /> Logs are append-only &amp; tamper-evident. Entries cannot be edited or deleted, only exported for compliance.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user, action, resource..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Credential", "Finance", "Permission", "Auth", "Data"] as const).map((c) => (
            <button key={c} type="button" onClick={() => setCatFilter(c)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${catFilter === c ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-muted">
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-5 py-3 text-right font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visible.map((l) => (
                <tr key={l.id} className="hover:bg-background/50">
                  <td className="px-5 py-3 font-mono text-[11px] text-muted">{l.time}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{l.user}</td>
                  <td className="px-4 py-3 text-xs">{l.action}</td>
                  <td className="px-4 py-3 text-xs text-muted">{l.resource}</td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${catTone[l.category]}`}>{l.category}</span></td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted">{l.ip}</td>
                  <td className="px-5 py-3 text-right"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sevTone[l.severity]}`}>{l.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <p className="py-10 text-center text-sm text-muted">No log entries match your filters.</p>}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <div className="flex items-center gap-2"><ScrollText className="h-5 w-5 text-brand-primary" /><Lock className="h-4 w-4 text-brand-teal dark:text-brand-green" /></div>
        <p className="text-xs text-muted">Retention &amp; deletion policies enforced · exportable for audits &amp; compliance · no credentials ever stored in plain text in logs.</p>
      </div>
    </div>
  );
}
