"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  BellRing,
  Building2,
  CheckCircle2,
  Clock,
  FolderKanban,
  Globe,
  IndianRupee,
  KeyRound,
  Layers,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  LeadSourceRingChart,
  MiniSparkline,
  RevenueTrendChart,
} from "@/components/charts/MiniCharts";

type DashboardTab = "overview" | "marketing" | "portal" | "architecture";

const KPIS = [
  {
    label: "Active Clients",
    value: "48",
    delta: "+6 this month",
    sub: "42 Retainers · 6 On Hold",
    icon: Building2,
    tone: "text-brand-primary bg-brand-primary/10",
    spark: [34, 36, 39, 41, 44, 48],
    sparkColor: "#0f67a6",
  },
  {
    label: "Sales Pipeline",
    value: "₹18.4L",
    delta: "24 Open Leads",
    sub: "11 Hot · 8 Warm · 5 Cold",
    icon: Target,
    tone: "text-brand-teal bg-brand-green/15 dark:text-brand-green",
    spark: [11, 13, 12, 15, 17, 18.4],
    sparkColor: "#0eb57d",
  },
  {
    label: "Monthly Revenue",
    value: "₹12.85L",
    delta: "+18.4% MoM",
    sub: "Net Profit ₹4.92L · 3 Overdue",
    icon: IndianRupee,
    tone: "text-brand-blue bg-brand-blue/10",
    spark: [8.2, 9.1, 9.8, 10.6, 11.4, 12.85],
    sparkColor: "#1677e8",
  },
  {
    label: "Active Projects",
    value: "19",
    delta: "4 Due This Week",
    sub: "14 On Track · 3 Review · 2 Delayed",
    icon: FolderKanban,
    tone: "text-brand-teal bg-brand-teal/15 dark:text-brand-green",
    spark: [12, 14, 15, 16, 18, 19],
    sparkColor: "#0d9488",
  },
  {
    label: "Ad Spend Managed",
    value: "₹9.40L",
    delta: "4.1x Avg ROAS",
    sub: "Google · Meta · TikTok · LinkedIn",
    icon: TrendingUp,
    tone: "text-brand-primary bg-brand-primary/10",
    spark: [6.4, 7.1, 7.8, 8.2, 8.9, 9.4],
    sparkColor: "#0f67a6",
  },
  {
    label: "Upcoming Renewals",
    value: "11",
    delta: "3 Urgent (<7d)",
    sub: "Domains, Hosting, SSL & M365",
    icon: RefreshCw,
    tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
    spark: [5, 7, 6, 9, 10, 11],
    sparkColor: "#d97706",
  },
];

const PIPELINE_STAGES = [
  { stage: "New", count: 9, value: "₹3.1L", pct: 90 },
  { stage: "Contacted", count: 6, value: "₹2.4L", pct: 72 },
  { stage: "Interested", count: 5, value: "₹2.9L", pct: 60 },
  { stage: "Meeting", count: 4, value: "₹3.4L", pct: 48 },
  { stage: "Proposal Sent", count: 3, value: "₹2.8L", pct: 36 },
  { stage: "Negotiation", count: 2, value: "₹2.2L", pct: 26 },
  { stage: "Won (MTD)", count: 4, value: "₹4.6L", pct: 52 },
];

const MARKETING_CHANNELS = [
  {
    platform: "GA4",
    scope: "All Client Properties (28)",
    metric1: "24,850 Users",
    metric2: "64.2% Engaged",
    metric3: "1,284 Conversions",
    trend: "+18.4%",
  },
  {
    platform: "Search Console",
    scope: "Google Organic",
    metric1: "84.2K Clicks",
    metric2: "1.92M Impr.",
    metric3: "Avg Pos 8.4",
    trend: "+11.2%",
  },
  {
    platform: "Google Ads",
    scope: "Search · PMax · Shopping",
    metric1: "₹4.80L Spend",
    metric2: "412 Conversions",
    metric3: "4.3x ROAS",
    trend: "+9.8%",
  },
  {
    platform: "Meta Ads",
    scope: "FB & IG Instant Forms",
    metric1: "1.42M Reach",
    metric2: "318 Leads",
    metric3: "₹295 CPL",
    trend: "+14.1%",
  },
  {
    platform: "TikTok Ads",
    scope: "Video & Lead Gen",
    metric1: "620K Views",
    metric2: "38% Completion",
    metric3: "3.6x ROAS",
    trend: "+6.4%",
  },
  {
    platform: "LinkedIn Ads",
    scope: "B2B Lead Gen Forms",
    metric1: "194K Impr.",
    metric2: "64 B2B Leads",
    metric3: "₹1,120 CPL",
    trend: "+4.2%",
  },
  {
    platform: "Bing Webmaster",
    scope: "Bing Search & Crawl",
    metric1: "12.4K Clicks",
    metric2: "280K Impr.",
    metric3: "99.1% Indexed",
    trend: "+5.0%",
  },
];

const AUTOMATION_FEED = [
  {
    trigger: "Meta Instant Lead Form",
    action: "Created CRM Lead #NT-409 & assigned to Sales Exec",
    time: "2m ago",
    status: "Executed",
  },
  {
    trigger: "Quotation #QT-218 Accepted",
    action: "Auto-created Project + 14 SEO & Web tasks from template",
    time: "18m ago",
    status: "Executed",
  },
  {
    trigger: "Domain Expiry (3 Days)",
    action: "Sent urgent WhatsApp & Email reminder for apexinfra.in",
    time: "1h ago",
    status: "Notified",
  },
  {
    trigger: "Technical SEO Audit",
    action: "Detected 12 new 404s on client site → Task assigned",
    time: "3h ago",
    status: "Escalated",
  },
];

const ACTIVE_PROJECTS = [
  {
    name: "Apex Infra — Corporate Website + SEO",
    client: "Apex Infra Pvt Ltd",
    status: "In Progress",
    progress: 74,
    due: "04 Dec",
  },
  {
    name: "Verve Dental — Local SEO & Google Ads",
    client: "Verve Healthcare",
    status: "Under Review",
    progress: 92,
    due: "29 Nov",
  },
  {
    name: "Kroma Fashion — Meta & TikTok Scale",
    client: "Kroma Apparel",
    status: "Waiting for Client",
    progress: 58,
    due: "10 Dec",
  },
];

const SYSTEM_MODULES = [
  { num: "01", title: "CRM & Sales", sub: "Leads, proposals, quotations", href: "/crm" },
  { num: "02", title: "Client Management", sub: "Profiles, portals, 360° view", href: "/clients" },
  { num: "03", title: "Project Management", sub: "Tasks, Kanban, milestones", href: "/projects" },
  { num: "04", title: "SEO Management", sub: "Audits, rankings, content", href: "/marketing/seo" },
  { num: "05", title: "Digital Advertising", sub: "Google, Meta, TikTok, LinkedIn", href: "/marketing/google-ads" },
  { num: "06", title: "Analytics & Reporting", sub: "GA4, GSC, Bing Webmaster", href: "/marketing/ga4" },
  { num: "07", title: "Finance & Accounting", sub: "GST invoices, double-entry", href: "/finance" },
  { num: "08", title: "HR & Staff", sub: "Attendance, timesheets, payroll", href: "/hr" },
  { num: "09", title: "Communication", sub: "Unified Inbox, Email, WhatsApp", href: "/inbox" },
  { num: "10", title: "Marketing Automation", sub: "Campaigns & AI chatbots", href: "/automation/whatsapp" },
  { num: "11", title: "Subscription & Assets", sub: "Domains, hosting, AES vault", href: "/vault" },
  { num: "12", title: "Administration", sub: "RBAC, audit logs, SaaS settings", href: "/admin/roles" },
];

export default function HomeDashboard() {
  const [tab, setTab] = useState<DashboardTab>("overview");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface p-5 shadow-xs lg:p-6">
        <div className="nova-gradient absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-teal dark:text-brand-green">
                <Sparkles className="h-3 w-3" />
                NOVA ONE · Business Operating System
              </span>
              <span className="rounded-full border border-surface-border px-2.5 py-0.5 text-[11px] text-muted">
                Multi-Tenant SaaS Architecture
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              One Platform. Complete Business Control.
            </h1>
            <p className="mt-1 text-sm text-muted">
              Unified command centre for CRM, Projects, SEO, Paid Ads, Finance, HR, Vault &amp; Automation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-surface-border bg-background/80 p-1">
            {(
              [
                { id: "overview", label: "Executive Overview" },
                { id: "marketing", label: "Marketing Command" },
                { id: "portal", label: "Client Portal" },
                { id: "architecture", label: "12 Systems" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? "nova-gradient text-white shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* KPI Strip */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-surface-border bg-surface p-4 shadow-xs transition-colors hover:border-brand-primary/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted">{kpi.label}</p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums text-foreground">
                    {kpi.value}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`rounded-xl p-2 ${kpi.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <MiniSparkline points={kpi.spark} color={kpi.sparkColor} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-teal dark:text-brand-green">
                  {kpi.delta}
                </span>
                <span className="text-muted">{kpi.sub}</span>
              </div>
            </div>
          );
        })}
      </section>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Revenue vs Expenses Chart */}
          <section className="rounded-2xl border border-surface-border bg-surface p-5 lg:col-span-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">
                  Revenue vs Expenses (6-Month Trend)
                </h2>
                <p className="text-xs text-muted">
                  Hover points for monthly breakdown · Double-entry ledger synced
                </p>
              </div>
              <Link
                href="/finance"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                Open Accounting <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <RevenueTrendChart />
          </section>

          {/* Lead Source Breakdown Donut */}
          <section className="rounded-2xl border border-surface-border bg-surface p-5 lg:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Leads by Source</h2>
                <p className="text-xs text-muted">Multi-channel attribution</p>
              </div>
              <Link
                href="/crm"
                className="text-xs font-semibold text-brand-primary hover:underline"
              >
                Details
              </Link>
            </div>
            <LeadSourceRingChart />
          </section>

          {/* CRM Pipeline */}
          <section className="rounded-2xl border border-surface-border bg-surface p-5 lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">CRM Sales Pipeline</h2>
                <p className="text-xs text-muted">
                  New → Contacted → Interested → Meeting → Proposal → Negotiation → Won
                </p>
              </div>
              <Link
                href="/crm"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                Open CRM <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {PIPELINE_STAGES.map((s) => (
                <div key={s.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {s.stage}{" "}
                      <span className="text-muted">({s.count} deals)</span>
                    </span>
                    <span className="font-semibold text-brand-primary">
                      {s.value}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className="nova-gradient h-full rounded-full"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Automation Engine Feed */}
          <section className="rounded-2xl border border-surface-border bg-surface p-5 lg:col-span-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-green" />
                <h2 className="text-base font-semibold">Automation Engine</h2>
              </div>
              <Link
                href="/admin/automations"
                className="text-xs font-semibold text-brand-primary hover:underline"
              >
                Rules
              </Link>
            </div>
            <div className="space-y-3">
              {AUTOMATION_FEED.map((item) => (
                <div
                  key={item.trigger}
                  className="rounded-xl border border-surface-border bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {item.trigger}
                    </span>
                    <span className="rounded bg-brand-green/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-teal dark:text-brand-green">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.action}</p>
                  <p className="mt-1 text-[10px] text-muted/80">{item.time}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Active Projects */}
          <section className="rounded-2xl border border-surface-border bg-surface p-5 lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Active Client Projects</h2>
              <Link
                href="/projects"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                Kanban Board <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {ACTIVE_PROJECTS.map((proj) => (
                <div
                  key={proj.name}
                  className="rounded-xl border border-surface-border bg-background/60 p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {proj.name}
                      </p>
                      <p className="text-xs text-muted">{proj.client}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-primary">
                        {proj.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Clock className="h-3 w-3" />
                        {proj.due}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-border">
                      <div
                        className="nova-gradient h-full rounded-full"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {proj.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Renewals & Vault Watch */}
          <section className="rounded-2xl border border-surface-border bg-surface p-5 lg:col-span-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-brand-primary" />
                <h2 className="text-base font-semibold">
                  Renewals &amp; Security Vault
                </h2>
              </div>
              <Link
                href="/vault"
                className="text-xs font-semibold text-brand-primary hover:underline"
              >
                Open Vault
              </Link>
            </div>
            <div className="space-y-2.5">
              {[
                { asset: "apexinfra.in (Domain)", due: "3 days left", level: "Urgent" },
                { asset: "AWS EC2 · Verve Prod", due: "7 days left", level: "Reminder" },
                { asset: "M365 Business · 12 Seats", due: "15 days left", level: "Client Notified" },
              ].map((r) => (
                <div
                  key={r.asset}
                  className="flex items-center justify-between rounded-xl border border-surface-border bg-background/60 px-3.5 py-2.5"
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {r.asset}
                    </p>
                    <p className="text-[11px] text-muted">{r.due}</p>
                  </div>
                  <span className="rounded-md bg-brand-primary/10 px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
                    {r.level}
                  </span>
                </div>
              ))}
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-brand-green/25 bg-brand-green/10 px-3.5 py-2.5 text-xs text-brand-teal dark:text-brand-green">
                <KeyRound className="h-4 w-4 shrink-0" />
                <span>
                  AES-256 Secrets Vault active · All credential reveals logged
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === "marketing" && (
        <section className="rounded-2xl border border-surface-border bg-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">
                Unified Digital Marketing Command Centre
              </h2>
              <p className="text-xs text-muted">
                Platform-separated metrics (GA4, GSC, Bing, Google, Meta, TikTok &amp; LinkedIn) — never mixed incorrectly.
              </p>
            </div>
            <Link
              href="/marketing/seo"
              className="nova-gradient rounded-xl px-3.5 py-2 text-xs font-semibold text-white"
            >
              Open SEO &amp; Ads Suite
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-muted">
                  <th className="py-2.5 pr-4 font-medium">Platform</th>
                  <th className="py-2.5 pr-4 font-medium">Scope</th>
                  <th className="py-2.5 pr-4 font-medium">Primary Metric</th>
                  <th className="py-2.5 pr-4 font-medium">Engagement / Leads</th>
                  <th className="py-2.5 pr-4 font-medium">Efficiency</th>
                  <th className="py-2.5 font-medium text-right">30d Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {MARKETING_CHANNELS.map((ch) => (
                  <tr key={ch.platform} className="hover:bg-background/50">
                    <td className="py-3 pr-4 font-semibold text-foreground">
                      {ch.platform}
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted">{ch.scope}</td>
                    <td className="py-3 pr-4 font-medium">{ch.metric1}</td>
                    <td className="py-3 pr-4 text-xs">{ch.metric2}</td>
                    <td className="py-3 pr-4 text-xs font-medium text-brand-primary">
                      {ch.metric3}
                    </td>
                    <td className="py-3 text-right text-xs font-semibold text-brand-teal dark:text-brand-green">
                      {ch.trend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "portal" && (
        <section className="rounded-2xl border border-surface-border bg-surface p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-primary">
                White-Label Client Portal Preview
              </span>
              <h2 className="mt-2 text-lg font-bold">
                Apex Infra Pvt Ltd — Client View
              </h2>
              <p className="text-xs text-muted">
                Clients see only their own projects, quotations, invoices, SEO/Ads reports &amp; support tickets.
              </p>
            </div>
            <Link
              href="/clients"
              className="rounded-xl border border-surface-border px-3.5 py-2 text-xs font-semibold hover:border-brand-primary"
            >
              Manage Client Access
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Project Progress", val: "74% Complete", icon: CheckCircle2 },
              { title: "Pending Quotation", val: "1 Awaiting Approval", icon: BellRing },
              { title: "SEO Organic Clicks", val: "+22.4% This Month", icon: Globe },
              { title: "Open Support Tickets", val: "1 In Progress", icon: Users },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-xl border border-surface-border bg-background/70 p-4"
                >
                  <Icon className="h-5 w-5 text-brand-primary" />
                  <p className="mt-2 text-xs text-muted">{card.title}</p>
                  <p className="mt-1 text-sm font-bold">{card.val}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "architecture" && (
        <section className="rounded-2xl border border-surface-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-primary" />
              <h2 className="text-base font-semibold">
                12 Core Systems Architecture
              </h2>
            </div>
            <span className="text-xs text-muted">
              Click any system to open its workspace
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SYSTEM_MODULES.map((m) => (
              <Link
                key={m.num}
                href={m.href}
                className="group rounded-xl border border-surface-border bg-background/60 p-4 transition-all hover:border-brand-primary/50 hover:bg-background"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-teal dark:text-brand-green">
                    MODULE {m.num}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-brand-primary" />
                </div>
                <p className="mt-1.5 text-sm font-semibold text-foreground">
                  {m.title}
                </p>
                <p className="mt-0.5 text-xs text-muted">{m.sub}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
