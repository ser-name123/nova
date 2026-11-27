"use client";

import { useEffect, useRef, useState } from "react";
import { Building, Check, CheckCircle2, Palette, Settings, Sparkles } from "lucide-react";

const DECISIONS = [
  { key: "deployment", title: "1. Application Deployment", options: ["Only for Nova Tech internal use", "Build as SaaS from the beginning", "Internal first, SaaS expansion later"] },
  { key: "accounting", title: "2. Accounting Requirements", options: ["Basic invoicing and expense tracking", "Complete double-entry accounting system", "Integrate existing accounting software"] },
  { key: "portal", title: "3. Client Access", options: ["Internal dashboard + separate client portal", "Only internal staff dashboard", "Client portal in a later phase"] },
  { key: "ai", title: "4. AI Functionality", options: ["Include AI assistant and AI automation", "Add AI in a future phase"] },
];

const ACCENTS = [
  { name: "Nova Blue", color: "#0f67a6" },
  { name: "Emerald", color: "#0eb57d" },
  { name: "Teal", color: "#0d9488" },
  { name: "Indigo", color: "#4f46e5" },
  { name: "Violet", color: "#7c3aed" },
  { name: "Rose", color: "#e11d48" },
  { name: "Amber", color: "#d97706" },
];

export default function SettingsPage() {
  const [selected, setSelected] = useState<Record<string, string>>({
    deployment: "Internal first, SaaS expansion later",
    accounting: "Complete double-entry accounting system",
    portal: "Internal dashboard + separate client portal",
    ai: "Include AI assistant and AI automation",
  });
  const [accent, setAccent] = useState("#0f67a6");
  const [orgName, setOrgName] = useState("Nova Tech Digital");
  const [currency, setCurrency] = useState("INR (₹)");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nova-accent");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from persisted storage
      if (saved) setAccent(saved);
    } catch {}
  }, []);

  function applyAccent(color: string) {
    setAccent(color);
    document.documentElement.style.setProperty("--brand-primary", color);
    try {
      localStorage.setItem("nova-accent", color);
    } catch {}
    notify("Brand accent applied & saved across the platform.");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {toast && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 12 · Multi-Tenant SaaS &amp; Architecture</span>
          <h1 className="mt-1 text-2xl font-bold">System Settings &amp; Architecture Decisions</h1>
          <p className="text-sm text-muted">Configure multi-tenant SaaS organizations, white-label branding &amp; platform preferences.</p>
        </div>
        <button type="button" onClick={() => notify("Settings &amp; architecture preferences saved.")} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs">
          <Settings className="h-4 w-4" /> Save Settings
        </button>
      </div>

      {/* White-label branding (LIVE) */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Palette className="h-4 w-4 text-brand-primary" /> White-Label Branding <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-[10px] font-semibold text-brand-teal dark:text-brand-green">Live Preview</span></div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Organization Name</label>
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Default Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  <option>INR (₹)</option><option>USD ($)</option><option>GBP (£)</option><option>AED (د.إ)</option><option>EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  <option>Asia/Kolkata (IST)</option><option>Asia/Dubai (GST)</option><option>Europe/London (GMT)</option><option>America/New_York (ET)</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-muted">Brand Accent Colour <span className="text-muted/70">(click to recolour the app instantly)</span></label>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button key={a.color} type="button" onClick={() => applyAccent(a.color)} title={a.name} className={`h-9 w-9 rounded-xl border-2 transition-transform hover:scale-110 ${accent === a.color ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: a.color }}>
                  {accent === a.color && <Check className="mx-auto h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-surface-border bg-background/60 p-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: accent }}>{orgName.slice(0, 1)}</div>
              <div><p className="text-xs font-semibold">{orgName}</p><p className="text-[11px] text-muted">{currency} · {timezone}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Tenant Organizations */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { org: "Nova Tech HQ", plan: "Internal · All 12 Systems", status: "Active" },
          { org: "Agency A (White-Label)", plan: "Pro SaaS · CRM + SEO + Ads", status: "Ready" },
          { org: "Agency B (White-Label)", plan: "Growth SaaS · Portal + Finance", status: "Ready" },
        ].map((o) => (
          <div key={o.org} className="rounded-2xl border border-surface-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <Building className="h-4 w-4 text-brand-primary" />
              <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-[10px] font-semibold text-brand-teal dark:text-brand-green">{o.status}</span>
            </div>
            <p className="mt-2 text-sm font-semibold">{o.org}</p>
            <p className="mt-0.5 text-xs text-muted">{o.plan}</p>
          </div>
        ))}
      </div>

      {/* Architecture Configurator */}
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface p-6">
        <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-brand-green" /> Product Architecture Preferences (Section 46)</div>
        <div className="grid gap-4 md:grid-cols-2">
          {DECISIONS.map((d) => (
            <div key={d.key} className="rounded-xl border border-surface-border bg-background/60 p-4">
              <p className="text-xs font-bold text-foreground">{d.title}</p>
              <div className="mt-2.5 space-y-1.5">
                {d.options.map((opt) => {
                  const active = selected[d.key] === opt;
                  return (
                    <button key={opt} type="button" onClick={() => setSelected((prev) => ({ ...prev, [d.key]: opt }))} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${active ? "bg-brand-primary/12 font-semibold text-brand-primary" : "text-muted hover:bg-surface"}`}>
                      <span>{opt}</span>
                      {active && <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
