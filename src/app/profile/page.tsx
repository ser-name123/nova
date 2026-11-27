"use client";

import { useState } from "react";
import { Bell, CheckCircle2, KeyRound, Laptop, Lock, Save, ShieldCheck, User } from "lucide-react";

export default function ProfilePage() {
  const [name, setName] = useState("Aarav Sharma");
  const [email, setEmail] = useState("aarav@novatech.in");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [designation, setDesignation] = useState("Super Admin & Managing Director");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST +05:30)");
  const [currency, setCurrency] = useState("INR (₹)");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [notifs, setNotifs] = useState({
    inApp: true,
    email: true,
    whatsapp: true,
    weeklyDigest: false,
  });

  const [sessions, setSessions] = useState([
    { id: "SES-1", device: "Chrome on Windows 11 · Current", ip: "103.42.18.92", lastActive: "Active now" },
    { id: "SES-2", device: "Safari on iPhone 16 Pro", ip: "103.42.18.95", lastActive: "2 hours ago" },
  ]);

  function notify(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(null), 2400);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {savedMsg && (
        <div className="fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-xl border border-brand-green/30 bg-surface px-4 py-2.5 text-xs font-semibold text-brand-teal shadow-xl dark:text-brand-green">
          <CheckCircle2 className="h-4 w-4" />
          {savedMsg}
        </div>
      )}

      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface p-6">
        <div className="nova-gradient absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="nova-gradient flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{name}</h1>
                <span className="rounded-full bg-brand-green/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-teal dark:text-brand-green">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-muted">
                {designation} · Employee ID: NT-EMP-001
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-green/30 bg-brand-green/10 px-3 py-1.5 text-xs font-semibold text-brand-teal dark:text-brand-green">
            <ShieldCheck className="h-4 w-4" />
            MFA Protected
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Personal & Work Details */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            notify("Profile details saved successfully.");
          }}
          className="space-y-4 rounded-2xl border border-surface-border bg-surface p-6 lg:col-span-7"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-brand-primary" />
            Personal &amp; Workspace Details
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Phone / WhatsApp</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Designation</label>
              <input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none"
              >
                <option>Asia/Kolkata (IST +05:30)</option>
                <option>Asia/Dubai (GST +04:00)</option>
                <option>Europe/London (GMT +00:00)</option>
                <option>America/New_York (EST -05:00)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none"
              >
                <option>INR (₹)</option>
                <option>USD ($)</option>
                <option>GBP (£)</option>
                <option>AED (د.إ)</option>
                <option>EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white"
            >
              <Save className="h-3.5 w-3.5" />
              Save Profile
            </button>
          </div>
        </form>

        {/* Security & Notification Preferences */}
        <div className="space-y-6 lg:col-span-5">
          <div className="space-y-4 rounded-2xl border border-surface-border bg-surface p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-4 w-4 text-brand-primary" />
              Security &amp; Multi-Factor Auth
            </div>

            <div className="flex items-center justify-between rounded-xl border border-surface-border bg-background/60 p-3.5">
              <div>
                <p className="text-xs font-semibold">Authenticator App (2FA)</p>
                <p className="text-[11px] text-muted">Required for Vault &amp; Finance</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMfaEnabled((v) => !v);
                  notify(`2FA ${!mfaEnabled ? "enabled" : "disabled"}.`);
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  mfaEnabled
                    ? "bg-brand-green/15 text-brand-teal dark:text-brand-green"
                    : "bg-surface-border text-muted"
                }`}
              >
                {mfaEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => notify("Password reset link sent to your email.")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border py-2 text-xs font-semibold hover:border-brand-primary"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Update Password
            </button>
          </div>

          <div className="space-y-3 rounded-2xl border border-surface-border bg-surface p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4 text-brand-green" />
              Notification Channels
            </div>
            {(
              [
                { key: "inApp", label: "In-App Real-Time Alerts" },
                { key: "email", label: "Email Notifications" },
                { key: "whatsapp", label: "WhatsApp Urgent Alerts" },
                { key: "weeklyDigest", label: "Weekly Executive Digest" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setNotifs((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                }
                className="flex w-full items-center justify-between rounded-xl border border-surface-border bg-background/60 px-3.5 py-2.5 text-xs"
              >
                <span className="font-medium">{item.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    notifs[item.key]
                      ? "bg-brand-green/15 text-brand-teal dark:text-brand-green"
                      : "bg-surface-border text-muted"
                  }`}
                >
                  {notifs[item.key] ? "On" : "Off"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-2xl border border-surface-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Laptop className="h-4 w-4 text-brand-primary" />
          Active Login Sessions
        </div>
        <div className="divide-y divide-surface-border">
          {sessions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
              <div>
                <p className="font-semibold text-foreground">{s.device}</p>
                <p className="text-muted">
                  IP: {s.ip} · {s.lastActive}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSessions((prev) => prev.filter((item) => item.id !== s.id));
                  notify(`Session ${s.id} revoked.`);
                }}
                className="rounded-lg border border-surface-border px-3 py-1 font-medium text-rose-500 hover:border-rose-500/40"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
