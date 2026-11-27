"use client";

import { useMemo, useRef, useState } from "react";
import { BellRing, CheckCircle2, Globe, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Domain = {
  domain: string;
  client: string;
  registrar: string;
  expiry: string;
  paymentDue: string;
  daysLeft: number;
  costNum: number;
  sellNum: number;
  autoRenew: boolean;
};

const INITIAL: Domain[] = [
  { domain: "apexinfra.in", client: "Apex Infra Pvt Ltd", registrar: "GoDaddy", expiry: "30 Nov 2026", paymentDue: "28 Nov 2026", daysLeft: 3, costNum: 899, sellNum: 1500, autoRenew: true },
  { domain: "vervedental.in", client: "Verve Healthcare", registrar: "Cloudflare", expiry: "12 Dec 2026", paymentDue: "10 Dec 2026", daysLeft: 15, costNum: 850, sellNum: 1450, autoRenew: true },
  { domain: "kromafashion.com", client: "Kroma Apparel", registrar: "Namecheap", expiry: "27 Dec 2026", paymentDue: "20 Dec 2026", daysLeft: 30, costNum: 1050, sellNum: 1800, autoRenew: false },
  { domain: "finedge.co", client: "FinEdge Advisory", registrar: "AWS Route53", expiry: "05 Dec 2026", paymentDue: "02 Dec 2026", daysLeft: 8, costNum: 1200, sellNum: 1950, autoRenew: true },
];

const REMINDER_RULES = [
  { when: "30 days before", action: "Notify Account Manager" },
  { when: "15 days before", action: "Notify Client" },
  { when: "7 days before", action: "Send Renewal Reminder" },
  { when: "3 days before", action: "Urgent WhatsApp & Email" },
  { when: "Expiry date", action: "Escalation Notification" },
];

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [registrarFilter, setRegistrarFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [domainName, setDomainName] = useState("");
  const [client, setClient] = useState("");
  const [registrar, setRegistrar] = useState("Cloudflare");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const registrars = useMemo(() => ["All", ...Array.from(new Set(domains.map((d) => d.registrar)))], [domains]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return domains.filter((d) => {
      const mR = registrarFilter === "All" || d.registrar === registrarFilter;
      const mQ = !q || d.domain.toLowerCase().includes(q) || d.client.toLowerCase().includes(q);
      return mR && mQ;
    });
  }, [domains, search, registrarFilter]);

  const stats = useMemo(() => {
    const soon = domains.filter((d) => d.daysLeft <= 30).length;
    const margin = Math.round((domains.reduce((s, d) => s + (d.sellNum - d.costNum) / d.sellNum, 0) / Math.max(1, domains.length)) * 100);
    const auto = Math.round((domains.filter((d) => d.autoRenew).length / Math.max(1, domains.length)) * 100);
    return { soon, margin, auto };
  }, [domains]);

  const KPIS = [
    { label: "Tracked Assets", value: `${domains.length}`, delta: "domains & hosting", color: "#0f67a6", spark: [40, 44, 48, 52, 54, domains.length + 52] },
    { label: "Renewals ≤30d", value: `${stats.soon}`, delta: "action needed", color: "#d97706", spark: [2, 3, 2, 4, 3, stats.soon] },
    { label: "Avg Margin", value: `${stats.margin}%`, delta: "resell uplift", color: "#0eb57d", spark: [34, 36, 38, 40, 41, stats.margin] },
    { label: "Auto-Renew", value: `${stats.auto}%`, delta: "coverage", color: "#1677e8", spark: [60, 64, 68, 72, 74, stats.auto] },
  ];

  function toggleAutoRenew(dom: string) {
    setDomains((prev) => prev.map((item) => (item.domain === dom ? { ...item, autoRenew: !item.autoRenew } : item)));
  }

  function openCreate() {
    setEditingDomain(null);
    setDomainName(""); setClient(""); setRegistrar("Cloudflare");
    setModalOpen(true);
  }

  function openEdit(d: Domain) {
    setEditingDomain(d.domain);
    setDomainName(d.domain); setClient(d.client); setRegistrar(d.registrar);
    setModalOpen(true);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!domainName.trim() || !client.trim()) return;
    if (editingDomain) {
      setDomains((prev) => prev.map((d) => (d.domain === editingDomain ? { ...d, domain: domainName.trim(), client: client.trim(), registrar } : d)));
      setModalOpen(false);
      notify(`${domainName.trim()} updated.`);
      return;
    }
    setDomains((prev) => [{ domain: domainName.trim(), client: client.trim(), registrar, expiry: "27 Nov 2027", paymentDue: "20 Nov 2027", daysLeft: 365, costNum: 950, sellNum: 1600, autoRenew: true }, ...prev]);
    setDomainName(""); setClient("");
    setModalOpen(false);
    notify(`${domainName.trim()} added to renewal tracker.`);
  }

  function deleteDomain(dom: string) {
    setDomains((prev) => prev.filter((d) => d.domain !== dom));
    notify(`${dom} removed from tracker.`);
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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 11 · Domains, Hosting &amp; Renewals</span>
          <h1 className="mt-1 text-2xl font-bold">Domain &amp; Hosting Renewal Tracker</h1>
          <p className="text-sm text-muted">Tracks actual service expiration separately from client payment due dates, with 30/15/7/3-day automated alerts.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" /> Add Domain / Hosting
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

      <div className="grid gap-3 sm:grid-cols-5">
        {REMINDER_RULES.map((r) => (
          <div key={r.when} className="rounded-xl border border-surface-border bg-surface p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary"><BellRing className="h-3.5 w-3.5" /> {r.when}</div>
            <p className="mt-1 text-xs text-muted">{r.action}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search domains or clients..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
        <select value={registrarFilter} onChange={(e) => setRegistrarFilter(e.target.value)} className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-muted focus:border-brand-primary focus:outline-none">
          {registrars.map((r) => <option key={r}>{r === "All" ? "All Registrars" : r}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-muted">
                <th className="px-5 py-3 font-medium">Domain / Asset</th>
                <th className="px-4 py-3 font-medium">Registrar</th>
                <th className="px-4 py-3 font-medium">Service Expiry</th>
                <th className="px-4 py-3 font-medium">Payment Due</th>
                <th className="px-4 py-3 font-medium">Cost / Sell</th>
                <th className="px-5 py-3 text-right font-medium">Auto-Renew / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visible.map((d) => (
                <tr key={d.domain} className="hover:bg-background/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 font-semibold"><Globe className="h-4 w-4 text-brand-primary" /> {d.domain}</div>
                    <div className="text-xs text-muted">{d.client}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs">{d.registrar}</td>
                  <td className="px-4 py-3.5 text-xs">
                    <span className="font-semibold">{d.expiry}</span>
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${d.daysLeft <= 7 ? "bg-rose-500/10 text-rose-500" : d.daysLeft <= 30 ? "bg-amber-500/10 text-amber-500" : "bg-brand-green/15 text-brand-teal dark:text-brand-green"}`}>{d.daysLeft}d left</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted">{d.paymentDue}</td>
                  <td className="px-4 py-3.5 text-xs tabular-nums"><span className="text-muted">₹{d.costNum}</span> → <span className="font-semibold text-foreground">₹{d.sellNum}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {d.daysLeft <= 30 && (
                        <button type="button" onClick={() => notify(`Renewal reminder sent to ${d.client}.`)} title="Send reminder" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-amber-500"><BellRing className="h-3.5 w-3.5" /></button>
                      )}
                      <button type="button" onClick={() => toggleAutoRenew(d.domain)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${d.autoRenew ? "bg-brand-green/15 text-brand-teal dark:text-brand-green" : "bg-background text-muted"}`}>
                        {d.autoRenew ? <ShieldCheck className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                        {d.autoRenew ? "Enabled" : "Manual"}
                      </button>
                      <button type="button" onClick={() => openEdit(d)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => deleteDomain(d.domain)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleAdd} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editingDomain ? "Edit Domain / Hosting" : "Add Domain / Hosting Record"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={domainName} onChange={(e) => setDomainName(e.target.value)} placeholder="Domain (e.g. novatech.in)" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <input required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client Name" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <select value={registrar} onChange={(e) => setRegistrar(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                <option>Cloudflare</option><option>GoDaddy</option><option>Namecheap</option><option>AWS Route53</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">{editingDomain ? "Save Changes" : "Save Asset"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
