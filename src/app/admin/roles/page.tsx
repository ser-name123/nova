"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Download, Lock, Plus, Save, Shield, Trash2, Users, X } from "lucide-react";

const DEFAULT_ROLES = [
  "Super Admin", "Director", "Finance Manager", "Sales Manager", "Sales Executive",
  "Project Manager", "SEO Manager", "SEO Executive", "Ads Manager", "HR Manager", "Client Portal",
];

type PermKey = "view" | "create" | "edit" | "approve" | "del" | "exp";
const PERM_KEYS: PermKey[] = ["view", "create", "edit", "approve", "del", "exp"];
const PERM_LABEL: Record<PermKey, string> = { view: "View", create: "Create", edit: "Edit", approve: "Approve", del: "Delete", exp: "Export" };

type PermRow = { module: string } & Record<PermKey, boolean>;

const MODULES = ["CRM & Sales", "Client Portal & Profiles", "Projects & Tasks", "SEO & Digital Ads", "Finance & Double-Entry", "AES-256 Credentials Vault", "HR & Payroll", "Administration & RBAC"];

function baseRow(module: string, all: boolean): PermRow {
  return { module, view: all, create: all, edit: all, approve: all, del: all, exp: all };
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState("SEO Manager");
  const [addOpen, setAddOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [matrix, setMatrix] = useState<Record<string, PermRow[]>>(() =>
    Object.fromEntries(
      DEFAULT_ROLES.map((r) => {
        const god = r === "Super Admin" || r === "Director";
        return [r, MODULES.map((m) => {
          if (god) return baseRow(m, true);
          // sensible defaults
          const row = baseRow(m, false);
          row.view = m !== "Finance & Double-Entry";
          if (m === "SEO & Digital Ads") { row.edit = true; row.exp = true; }
          if (m === "CRM & Sales") { row.create = true; row.edit = true; }
          return row;
        })];
      })
    )
  );

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function togglePerm(modName: string, key: PermKey) {
    setMatrix((prev) => ({
      ...prev,
      [selectedRole]: prev[selectedRole].map((row) => (row.module === modName ? { ...row, [key]: !row[key] } : row)),
    }));
  }

  const rows = matrix[selectedRole] ?? MODULES.map((m) => baseRow(m, false));
  const grantCount = useMemo(() => rows.reduce((s, r) => s + PERM_KEYS.filter((k) => r[k]).length, 0), [rows]);

  function addRole(e: React.FormEvent) {
    e.preventDefault();
    const name = newRole.trim();
    if (!name || roles.includes(name)) return;
    setRoles((prev) => [...prev, name]);
    setMatrix((prev) => ({ ...prev, [name]: MODULES.map((m) => baseRow(m, false)) }));
    setSelectedRole(name);
    setNewRole("");
    setAddOpen(false);
    notify(`Custom role "${name}" created.`);
  }

  function deleteRole(name: string) {
    setRoles((prev) => prev.filter((r) => r !== name));
    setMatrix((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (selectedRole === name) setSelectedRole("Super Admin");
    notify(`Role "${name}" deleted.`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {toast && (
        <div className="fixed right-5 bottom-5 z-[60] flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <Check className="h-4 w-4" />
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Module 12 · Administration &amp; RBAC</span>
          <h1 className="mt-1 text-2xl font-bold">Granular Roles &amp; Permissions Matrix</h1>
          <p className="text-sm text-muted">Module, page, client-scoped &amp; credential-restricted access across {roles.length} roles. Click any cell to toggle.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => notify("Permissions matrix exported to CSV.")} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-xs font-semibold text-muted hover:text-foreground"><Download className="h-3.5 w-3.5" /> Export</button>
          <button type="button" onClick={() => notify(`Permissions for ${selectedRole} saved.`)} className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white"><Save className="h-3.5 w-3.5" /> Save Changes</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "System Roles", value: `${roles.length}`, icon: Shield },
          { label: "Protected Modules", value: `${MODULES.length}`, icon: Lock },
          { label: `Grants · ${selectedRole}`, value: `${grantCount}`, icon: Users },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface p-4">
              <div>
                <p className="text-xs text-muted">{s.label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{s.value}</p>
              </div>
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-surface-border bg-surface p-3 lg:col-span-4">
          <div className="mb-2 flex items-center justify-between px-2 py-1">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted uppercase"><Shield className="h-3.5 w-3.5 text-brand-primary" /> System Roles</span>
            <button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-2 py-1 text-[11px] font-semibold text-brand-primary hover:bg-brand-primary/5"><Plus className="h-3 w-3" /> Add</button>
          </div>
          <div className="max-h-[420px] space-y-1 overflow-y-auto">
            {roles.map((r) => {
              const custom = !DEFAULT_ROLES.includes(r);
              const active = selectedRole === r;
              return (
                <div key={r} className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium ${active ? "nova-gradient text-white" : "text-foreground hover:bg-background"}`}>
                  <button type="button" onClick={() => setSelectedRole(r)} className="flex-1 text-left">{r}</button>
                  {custom ? (
                    <button type="button" onClick={() => deleteRole(r)} title="Delete role" className={`rounded p-0.5 ${active ? "text-white/80 hover:text-white" : "text-muted opacity-0 group-hover:opacity-100 hover:text-rose-500"}`}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : (
                    <Lock className="h-3 w-3 opacity-70" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface lg:col-span-8">
          <div className="border-b border-surface-border px-5 py-3.5">
            <h2 className="text-sm font-semibold">Permissions for: <span className="text-brand-primary">{selectedRole}</span></h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Module</th>
                  {PERM_KEYS.map((k) => <th key={k} className="px-3 py-3 text-center font-medium">{PERM_LABEL[k]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {rows.map((p) => (
                  <tr key={p.module} className="hover:bg-background/50">
                    <td className="px-5 py-3 text-xs font-semibold">{p.module}</td>
                    {PERM_KEYS.map((k) => {
                      const allowed = p[k];
                      return (
                        <td key={k} className="px-3 py-3 text-center">
                          <button type="button" onClick={() => togglePerm(p.module, k)} title={`${PERM_LABEL[k]} — click to toggle`} className={`inline-flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${allowed ? "bg-brand-green/15 text-brand-teal dark:text-brand-green" : "bg-background text-muted/50 hover:text-foreground"}`}>
                            {allowed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setAddOpen(false)}>
          <form onSubmit={addRole} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Create Custom Role</h2>
              <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <input autoFocus required value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role name (e.g. Content Lead)" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
            <p className="text-[11px] text-muted">New roles start with no permissions. Toggle grants in the matrix after creating.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">Create Role</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
