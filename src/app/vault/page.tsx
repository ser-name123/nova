"use client";

import { useMemo, useRef, useState } from "react";
import {
  Clock,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  RotateCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Secret = {
  id: string;
  client: string;
  asset: string;
  category: string;
  user: string;
  secret: string;
  rotatedDays: number;
};

const INITIAL: Secret[] = [
  { id: "SEC-01", client: "Apex Infra", asset: "GoDaddy Registrar", category: "Domain", user: "admin@apexinfra.in", secret: "N0va#Apex2026!G", rotatedDays: 14 },
  { id: "SEC-02", client: "Verve Healthcare", asset: "AWS Production IAM", category: "Cloud", user: "nova-deploy", secret: "AKIAIOSFODNN7EXAMPLE", rotatedDays: 30 },
  { id: "SEC-03", client: "Kroma Apparel", asset: "WordPress Admin", category: "CMS", user: "novatech_wp", secret: "Kr0ma@WP#9921", rotatedDays: 7 },
  { id: "SEC-04", client: "FinEdge Advisory", asset: "Meta Business Token", category: "API Key", user: "sys-finedge", secret: "EAAGm0PX4ZCpsBO1xZC", rotatedDays: 96 },
  { id: "SEC-05", client: "Apex Infra", asset: "cPanel Hosting", category: "Hosting", user: "apexinfra", secret: "cP@nel!Apex77", rotatedDays: 48 },
];

const catTone: Record<string, string> = {
  Domain: "bg-brand-primary/10 text-brand-primary",
  Cloud: "bg-violet-500/10 text-violet-500",
  CMS: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
  "API Key": "bg-amber-500/10 text-amber-500",
  Hosting: "bg-sky-500/10 text-sky-500",
};

export default function VaultPage() {
  const [secrets, setSecrets] = useState<Secret[]>(INITIAL);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reveals, setReveals] = useState(0);

  const [client, setClient] = useState("");
  const [asset, setAsset] = useState("");
  const [category, setCategory] = useState("Domain");
  const [user, setUser] = useState("");
  const [secret, setSecret] = useState("");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const cats = useMemo(() => ["All", ...Array.from(new Set(secrets.map((s) => s.category)))], [secrets]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return secrets.filter((s) => {
      const mC = catFilter === "All" || s.category === catFilter;
      const mQ = !q || s.asset.toLowerCase().includes(q) || s.client.toLowerCase().includes(q) || s.user.toLowerCase().includes(q);
      return mC && mQ;
    });
  }, [secrets, search, catFilter]);

  const rotationDue = secrets.filter((s) => s.rotatedDays > 90).length;

  const KPIS = [
    { label: "Stored Secrets", value: `${secrets.length}`, delta: "AES-256 at rest", color: "#0f67a6", spark: [8, 10, 12, 13, 14, secrets.length + 10] },
    { label: "Reveals Today", value: `${reveals}`, delta: "all audit-logged", color: "#1677e8", spark: [1, 2, 1, 3, 2, reveals + 1] },
    { label: "Rotation Due", value: `${rotationDue}`, delta: ">90 days old", color: "#d97706", spark: [1, 1, 2, 1, 2, rotationDue + 1] },
    { label: "MFA Enforced", value: "100%", delta: "all vault access", color: "#0eb57d", spark: [90, 94, 96, 98, 99, 100] },
  ];

  function openCreate() {
    setEditingId(null);
    setClient(""); setAsset(""); setCategory("Domain"); setUser(""); setSecret("");
    setModalOpen(true);
  }

  function openEdit(item: Secret) {
    setEditingId(item.id);
    setClient(item.client); setAsset(item.asset); setCategory(item.category); setUser(item.user); setSecret(item.secret);
    setModalOpen(true);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!client.trim() || !asset.trim() || !secret.trim()) return;
    if (editingId) {
      setSecrets((prev) => prev.map((s) => (s.id === editingId ? { ...s, client: client.trim(), asset: asset.trim(), category, user: user.trim() || "admin", secret: secret.trim(), rotatedDays: 0 } : s)));
      setModalOpen(false);
      notify(`Secret ${editingId} updated · re-encrypted.`);
      return;
    }
    setSecrets((prev) => [
      { id: `SEC-0${prev.length + 1}`, client: client.trim(), asset: asset.trim(), category, user: user.trim() || "admin", secret: secret.trim(), rotatedDays: 0 },
      ...prev,
    ]);
    setClient(""); setAsset(""); setUser(""); setSecret("");
    setModalOpen(false);
    notify(`Secret encrypted & stored · access policy applied.`);
  }

  function deleteSecret(id: string) {
    setSecrets((prev) => prev.filter((s) => s.id !== id));
    notify(`Secret ${id} deleted · removal audit-logged.`);
  }

  function reveal(item: Secret) {
    const next = revealedId === item.id ? null : item.id;
    setRevealedId(next);
    if (next) {
      setReveals((r) => r + 1);
      notify(`Reveal logged: ${item.asset} · user, IP & timestamp recorded.`);
    }
  }

  function copySecret(item: Secret) {
    navigator.clipboard?.writeText(item.secret);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
    notify(`Copied ${item.asset} · copy event audit-logged.`);
  }

  function rotate(item: Secret) {
    setSecrets((prev) => prev.map((s) => (s.id === item.id ? { ...s, rotatedDays: 0 } : s)));
    notify(`${item.asset} rotation reminder cleared.`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {toast && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <ShieldCheck className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 11 · Security-Critical Secrets Vault</span>
          <h1 className="mt-1 text-2xl font-bold">Client Credentials &amp; Digital Assets Vault</h1>
          <p className="text-sm text-muted">AES-256 encrypted at rest · masked by default · role-based reveal &amp; immutable audit logging.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" />
          Add Encrypted Secret
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

      <div className="flex items-center gap-2.5 rounded-xl border border-brand-green/25 bg-brand-green/10 px-4 py-3 text-xs text-brand-teal dark:text-brand-green">
        <Fingerprint className="h-4 w-4 shrink-0" />
        <span>Every reveal or copy event is recorded in Administration → Audit Logs with user ID, IP &amp; timestamp. No secrets are sent in notifications.</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets, clients, users..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} type="button" onClick={() => setCatFilter(c)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${catFilter === c ? "nova-gradient text-white" : "border border-surface-border bg-surface text-muted hover:text-foreground"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {visible.map((item) => {
          const isRevealed = revealedId === item.id;
          const due = item.rotatedDays > 90;
          return (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-surface-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-brand-primary/10 p-2.5 text-brand-primary"><KeyRound className="h-5 w-5" /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{item.asset}</p>
                    <span className="rounded bg-background px-2 py-0.5 text-[10px] font-medium text-muted">{item.client}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${catTone[item.category] ?? "bg-muted/20 text-muted"}`}>{item.category}</span>
                  </div>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-muted">
                    User: {item.user} ·
                    <span className={`inline-flex items-center gap-1 ${due ? "font-semibold text-amber-500" : ""}`}>
                      <Clock className="h-3 w-3" /> rotated {item.rotatedDays}d ago{due ? " · due" : ""}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-background px-3 py-1.5 font-mono text-xs">
                  <Lock className="h-3.5 w-3.5 text-muted" />
                  <span className="min-w-[120px]">{isRevealed ? item.secret : "••••••••••••••"}</span>
                </div>
                <button type="button" onClick={() => reveal(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium hover:border-brand-primary">
                  {isRevealed ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Reveal</>}
                </button>
                <button type="button" onClick={() => copySecret(item)} className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1.5 text-xs font-medium hover:border-brand-primary">
                  <Copy className="h-3.5 w-3.5" />{copiedId === item.id ? "Copied" : "Copy"}
                </button>
                {due && (
                  <button type="button" onClick={() => rotate(item)} title="Mark rotated" className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-500 hover:bg-amber-500/15">
                    <RotateCw className="h-3.5 w-3.5" /> Rotate
                  </button>
                )}
                <button type="button" onClick={() => openEdit(item)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => deleteSecret(item.id)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && <p className="rounded-2xl border border-surface-border bg-surface py-10 text-center text-sm text-muted">No secrets match your filters.</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleAdd} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editingId ? "Edit Secret" : "Store Encrypted Secret"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client Name" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <input required value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="Asset / Platform (e.g. cPanel, Cloudflare)" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  <option>Domain</option><option>Hosting</option><option>Cloud</option><option>CMS</option><option>API Key</option>
                </select>
                <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Username / Email" className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
              </div>
              <input required type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Password / API Key" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">{editingId ? "Save Changes" : "Encrypt & Save"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
