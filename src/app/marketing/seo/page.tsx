"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Globe,
  Minus,
  Play,
  Search,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";
import { downloadPdf } from "@/lib/pdf";

type Site = { site: string; keywords: number; top10: number; score: number; backlinks: string; manager: string };
type Keyword = { kw: string; site: string; pos: number; prev: number; volume: string; intent: string };
type Issue = { title: string; severity: "Critical" | "Warning" | "Notice"; count: number; assigned: boolean };

const INITIAL_SITES: Site[] = [
  { site: "apexinfra.in", keywords: 65, top10: 28, score: 89, backlinks: "1,240", manager: "Aarav Sharma" },
  { site: "vervedental.in", keywords: 48, top10: 34, score: 94, backlinks: "860", manager: "Neha Kapoor" },
  { site: "kromafashion.com", keywords: 120, top10: 52, score: 86, backlinks: "3,410", manager: "Vikram Patel" },
];

const KEYWORDS: Keyword[] = [
  { kw: "commercial interior contractor", site: "apexinfra.in", pos: 3, prev: 7, volume: "2.4K", intent: "Commercial" },
  { kw: "dental clinic near me", site: "vervedental.in", pos: 1, prev: 2, volume: "8.1K", intent: "Local" },
  { kw: "affordable fashion online", site: "kromafashion.com", pos: 5, prev: 5, volume: "14K", intent: "Transactional" },
  { kw: "turnkey office fitout", site: "apexinfra.in", pos: 8, prev: 12, volume: "1.1K", intent: "Commercial" },
  { kw: "invisalign cost india", site: "vervedental.in", pos: 4, prev: 3, volume: "3.3K", intent: "Informational" },
  { kw: "summer dress collection", site: "kromafashion.com", pos: 11, prev: 18, volume: "9.6K", intent: "Transactional" },
];

const INITIAL_ISSUES: Issue[] = [
  { title: "Broken links / 404 errors", severity: "Critical", count: 12, assigned: false },
  { title: "Missing meta descriptions", severity: "Warning", count: 23, assigned: false },
  { title: "Images without alt text", severity: "Warning", count: 41, assigned: false },
  { title: "Slow Core Web Vitals (LCP)", severity: "Critical", count: 6, assigned: false },
  { title: "Redirect chains", severity: "Notice", count: 9, assigned: false },
  { title: "Duplicate title tags", severity: "Notice", count: 4, assigned: false },
];

const sevTone = { Critical: "bg-rose-500/10 text-rose-500", Warning: "bg-amber-500/10 text-amber-500", Notice: "bg-sky-500/10 text-sky-500" };

export default function SeoManagementPage() {
  const [tab, setTab] = useState<"campaigns" | "ranks" | "audit">("campaigns");
  const [auditing, setAuditing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sites, setSites] = useState<Site[]>(INITIAL_SITES);
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function runCrawl() {
    setAuditing(true);
    setProgress(0);
    setTab("audit");
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          setAuditing(false);
          setSites((prev) => prev.map((s) => ({ ...s, score: Math.min(99, s.score + 1) })));
          notify("Technical crawl complete · issues refreshed.");
          return 100;
        }
        return p + 20;
      });
    }, 180);
  }

  function assignIssue(title: string) {
    setIssues((prev) => prev.map((i) => (i.title === title ? { ...i, assigned: true } : i)));
    notify(`Task created from "${title}" · assigned to SEO Executive.`);
  }

  function downloadReport() {
    const month = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    downloadPdf(`SEO-Report-${month.replace(" ", "-")}`, {
      docType: "SEO Report",
      title: "Monthly SEO Performance",
      subtitle: `Reporting period: ${month}`,
      meta: [
        ["Prepared by", "Nova Tech SEO Team"],
        ["Technical Health", "91 / 100"],
        ["Top 10 Keywords", "184 (+26)"],
        ["GA4 Organic Users", "24,850"],
        ["GSC Clicks", "84,200"],
      ],
      columns: ["Website", "Keywords", "Top 10", "Audit Score", "Backlinks"],
      alignRight: [1, 2, 3, 4],
      rows: sites.map((s) => [s.site, String(s.keywords), String(s.top10), `${s.score}%`, s.backlinks]),
      totals: [
        ["Sites Tracked", String(sites.length)],
        ["Avg Audit Score", `${Math.round(sites.reduce((a, s) => a + s.score, 0) / sites.length)}%`],
      ],
      note: "Combined GA4 + Search Console + Bing data. Next month: content expansion + backlink outreach.",
    });
    notify("Branded SEO PDF report downloaded.");
  }

  const KPIS = [
    { label: "Technical Health", value: "91", delta: "12 404s flagged", color: "#0eb57d", spark: [82, 84, 86, 88, 90, 91] },
    { label: "Top 10 Keywords", value: "184", delta: "+26 MTD", color: "#0f67a6", spark: [140, 150, 160, 172, 178, 184] },
    { label: "GA4 Organic Users", value: "24.8K", delta: "64.2% engaged", color: "#1677e8", spark: [18, 20, 21, 23, 24, 24.8] },
    { label: "GSC Clicks", value: "84.2K", delta: "Avg Pos 8.4", color: "#0d9488", spark: [60, 66, 72, 78, 81, 84.2] },
  ];

  const tabs = [
    { key: "campaigns" as const, label: "Campaigns", icon: TrendingUp },
    { key: "ranks" as const, label: "Rank Tracker", icon: Search },
    { key: "audit" as const, label: "Technical Audit", icon: ShieldCheck },
  ];

  const criticalCount = useMemo(() => issues.filter((i) => i.severity === "Critical").reduce((s, i) => s + i.count, 0), [issues]);

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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 04 · SEO &amp; Analytics Command Centre</span>
          <h1 className="mt-1 text-2xl font-bold">SEO Management, Audits &amp; Rank Tracking</h1>
          <p className="text-sm text-muted">Technical crawls, Google &amp; Bing rank tracking, GA4, Search Console &amp; branded PDF client reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={downloadReport} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-xs font-semibold text-muted hover:text-foreground">
            <FileText className="h-3.5 w-3.5" /> Report
          </button>
          <button type="button" onClick={runCrawl} disabled={auditing} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-70">
            <Play className="h-3.5 w-3.5" />
            {auditing ? "Crawling…" : "Run Technical Audit"}
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

        {/* CAMPAIGNS */}
        {tab === "campaigns" && (
          <div className="space-y-3 p-5">
            {sites.map((row) => (
              <div key={row.site} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-surface-border bg-background/60 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-primary/10 p-2 text-brand-primary"><Globe className="h-4 w-4" /></div>
                  <div>
                    <p className="font-semibold text-foreground">{row.site}</p>
                    <p className="text-xs text-muted">{row.keywords} keywords · {row.backlinks} backlinks · {row.manager}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-brand-primary">{row.top10} in Top 10</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-border"><div className="nova-gradient h-full rounded-full" style={{ width: `${row.score}%` }} /></div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/15 px-2.5 py-0.5 font-semibold text-brand-teal dark:text-brand-green"><CheckCircle2 className="h-3 w-3" />{row.score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RANK TRACKER */}
        {tab === "ranks" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Keyword</th>
                  <th className="px-4 py-3 font-medium">Site</th>
                  <th className="px-4 py-3 font-medium">Intent</th>
                  <th className="px-4 py-3 font-medium">Volume</th>
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="px-5 py-3 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {KEYWORDS.map((k) => {
                  const diff = k.prev - k.pos;
                  return (
                    <tr key={k.kw} className="hover:bg-background/50">
                      <td className="px-5 py-3.5 font-medium">{k.kw}</td>
                      <td className="px-4 py-3.5 text-xs text-muted">{k.site}</td>
                      <td className="px-4 py-3.5"><span className="rounded bg-brand-primary/10 px-2 py-0.5 text-[11px] font-medium text-brand-primary">{k.intent}</span></td>
                      <td className="px-4 py-3.5 text-xs tabular-nums">{k.volume}</td>
                      <td className="px-4 py-3.5"><span className="font-bold tabular-nums">#{k.pos}</span></td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${diff > 0 ? "text-brand-teal dark:text-brand-green" : diff < 0 ? "text-rose-500" : "text-muted"}`}>
                          {diff > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : diff < 0 ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                          {diff !== 0 ? Math.abs(diff) : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TECHNICAL AUDIT */}
        {tab === "audit" && (
          <div className="space-y-4 p-5">
            {auditing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs"><span className="font-medium text-muted">Crawling pages…</span><span className="tabular-nums text-brand-primary">{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-background"><div className="nova-gradient h-full rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Detected Issues</h3>
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-500">{criticalCount} critical</span>
            </div>
            <div className="space-y-2">
              {issues.map((i) => (
                <div key={i.title} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-background/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sevTone[i.severity]}`}>{i.severity}</span>
                    <p className="text-sm font-medium">{i.title}</p>
                    <span className="rounded bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">{i.count}</span>
                  </div>
                  {i.assigned ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal dark:text-brand-green"><CheckCircle2 className="h-3.5 w-3.5" /> Task created</span>
                  ) : (
                    <button type="button" onClick={() => assignIssue(i.title)} className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-muted hover:border-brand-primary hover:text-brand-primary">
                      <Wrench className="h-3.5 w-3.5" /> Create Task
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <BarChart3 className="h-5 w-5 text-brand-primary" />
        <p className="text-xs text-muted">Combined GA4 + Search Console + Bing data · scheduled branded PDF reports · competitor gap analysis &amp; backlink monitoring active.</p>
      </div>
    </div>
  );
}
