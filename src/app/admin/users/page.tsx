"use client";

import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Mail,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type Status = "Active" | "Invited" | "Suspended";
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: Status;
  mfa: boolean;
  lastActive: string;
};

const ROLES = ["Super Admin", "Director", "Finance Manager", "Sales Manager", "SEO Manager", "Ads Manager", "HR Manager", "Support Executive", "Client"];

const INITIAL: User[] = [
  { id: "U-01", name: "Aarav Sharma", email: "aarav@novatech.in", role: "Super Admin", status: "Active", mfa: true, lastActive: "Active now" },
  { id: "U-02", name: "Neha Kapoor", email: "neha@novatech.in", role: "SEO Manager", status: "Active", mfa: true, lastActive: "12m ago" },
  { id: "U-03", name: "Vikram Patel", email: "vikram@novatech.in", role: "Ads Manager", status: "Active", mfa: false, lastActive: "1h ago" },
  { id: "U-04", name: "Ishita Rao", email: "ishita@novatech.in", role: "Finance Manager", status: "Active", mfa: true, lastActive: "3h ago" },
  { id: "U-05", name: "Sana Qureshi", email: "sana@novatech.in", role: "Support Executive", status: "Invited", mfa: false, lastActive: "Pending" },
  { id: "U-06", name: "Rohan Mehta", email: "rohan@apexinfra.in", role: "Client", status: "Active", mfa: true, lastActive: "Yesterday" },
  { id: "U-07", name: "Dev Anand", email: "dev@novarealty.in", role: "Client", status: "Suspended", mfa: false, lastActive: "5d ago" },
];

const statusTone: Record<Status, string> = {
  Active: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
  Invited: "bg-amber-500/10 text-amber-500",
  Suspended: "bg-rose-500/10 text-rose-500",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Sales Manager");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const roles = useMemo(() => ["All", ...Array.from(new Set(users.map((u) => u.role)))], [users]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const mR = roleFilter === "All" || u.role === roleFilter;
      const mQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return mR && mQ;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "Active").length;
    const invited = users.filter((u) => u.status === "Invited").length;
    const mfa = Math.round((users.filter((u) => u.mfa).length / Math.max(1, users.length)) * 100);
    return { active, invited, mfa };
  }, [users]);

  const KPIS = [
    { label: "Total Users", value: `${users.length}`, delta: `${stats.active} active`, color: "#0f67a6", spark: [18, 20, 22, 24, 25, users.length + 20] },
    { label: "Active", value: `${stats.active}`, delta: "signed in 24h", color: "#0eb57d", spark: [14, 16, 17, 18, 19, stats.active + 15] },
    { label: "Pending Invites", value: `${stats.invited}`, delta: "awaiting accept", color: "#d97706", spark: [1, 2, 1, 2, 1, stats.invited + 1] },
    { label: "MFA Coverage", value: `${stats.mfa}%`, delta: "enforced", color: "#1677e8", spark: [70, 76, 80, 84, 86, stats.mfa] },
  ];

  function openCreate() {
    setEditingId(null);
    setName(""); setEmail(""); setRole("Sales Manager");
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditingId(u.id);
    setName(u.name); setEmail(u.email); setRole(u.role);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (editingId) {
      setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...u, name: name.trim(), email: email.trim(), role } : u)));
      notify(`User ${editingId} updated.`);
    } else {
      setUsers((prev) => [{ id: `U-0${prev.length + 1}`, name: name.trim(), email: email.trim(), role, status: "Invited", mfa: false, lastActive: "Pending" }, ...prev]);
      notify(`Invite sent to ${email.trim()}.`);
    }
    setModalOpen(false);
  }

  function setRoleOf(id: string, r: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: r } : u)));
    notify(`Role updated.`);
  }

  function toggleStatus(id: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: u.status === "Suspended" ? "Active" : "Suspended" } : u)));
  }

  function remove(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    notify(`User ${id} removed.`);
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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Administration · User Management</span>
          <h1 className="mt-1 text-2xl font-bold">Users, Accounts &amp; Access</h1>
          <p className="text-sm text-muted">Staff &amp; client accounts, MFA enforcement, session control &amp; login activity across the tenant.</p>
        </div>
        <button type="button" onClick={openCreate} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95">
          <Plus className="h-4 w-4" /> Invite User
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
        <div className="relative w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full rounded-lg border border-surface-border bg-surface py-1.5 pr-3 pl-8 text-xs focus:border-brand-primary focus:outline-none" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-muted focus:border-brand-primary focus:outline-none">
          {roles.map((r) => <option key={r}>{r === "All" ? "All Roles" : r}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-xs text-muted">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">MFA</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visible.map((u) => (
                <tr key={u.id} className="hover:bg-background/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-primary/10 text-[10px] font-bold text-brand-primary">{u.name.split(" ").map((w) => w[0]).join("")}</span>
                      <div>
                        <div className="font-semibold text-foreground">{u.name}</div>
                        <div className="text-xs text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <select value={u.role} onChange={(e) => setRoleOf(u.id, e.target.value)} className="rounded-md border border-surface-border bg-background px-2 py-1 text-xs font-medium text-foreground focus:border-brand-primary focus:outline-none">
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3.5">
                    {u.mfa ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal dark:text-brand-green"><ShieldCheck className="h-3.5 w-3.5" /> On</span> : <span className="text-xs text-muted">Off</span>}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted"><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{u.lastActive}</span></td>
                  <td className="px-4 py-3.5">
                    <button type="button" onClick={() => toggleStatus(u.id)} className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-transform hover:scale-105 ${statusTone[u.status]}`}>{u.status}</button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {u.status === "Invited" && <button type="button" onClick={() => notify(`Invite re-sent to ${u.email}.`)} title="Resend invite" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Mail className="h-3.5 w-3.5" /></button>}
                      <button type="button" onClick={() => openEdit(u)} title="Edit" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-brand-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => remove(u.id)} title="Delete" className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface p-5">
        <Users className="h-5 w-5 text-brand-primary" />
        <p className="text-xs text-muted">Multi-tenant org isolation · session expiry &amp; login history tracked · temporary access &amp; permission changes audit-logged.</p>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editingId ? "Edit User" : "Invite User"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work Email" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">{editingId ? "Save Changes" : "Send Invite"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
