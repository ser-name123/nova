"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Target,
  UserCircle,
  X,
} from "lucide-react";
import { NAV_GROUPS } from "@/lib/navigation";
import { NovaAiDrawer } from "@/components/ai/NovaAiDrawer";
import { CommandPalette } from "./CommandPalette";
import { NavIcon } from "./NavIcon";

const ROLES = [
  "Super Admin · Nova Tech HQ",
  "Director · Executive View",
  "SEO & Marketing Lead",
  "Finance Manager",
  "Client Portal Preview",
];

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <div className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-wider text-muted/80 uppercase">
              {group.label}
            </div>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.title : undefined}
                  className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? "nova-gradient text-white shadow-xs"
                      : "text-muted hover:bg-background hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <NavIcon
                      name={item.icon}
                      className={`h-4 w-4 shrink-0 ${
                        active
                          ? "text-white"
                          : "text-muted group-hover:text-brand-primary"
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                  </span>
                  {!collapsed && item.badge && (
                    <span
                      className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-brand-primary/12 text-brand-primary"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([
    { id: 1, text: "Meta Lead Form: Rohan Mehta assigned to you", time: "2m ago", read: false },
    { id: 2, text: "Domain apexinfra.in expires in 3 days", time: "1h ago", read: false },
    { id: 3, text: "Quotation #QT-218 accepted by client", time: "3h ago", read: false },
    { id: 4, text: "SEO Audit: 12 new 404s detected on apexinfra.in", time: "5h ago", read: false },
    { id: 5, text: "Payment overdue: Kroma Apparel ($2,400)", time: "Yesterday", read: true },
  ]);
  const [isDark, setIsDark] = useState(true);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const headerActionsRef = useRef<HTMLDivElement>(null);

  function closeAllMenus() {
    setRoleMenuOpen(false);
    setQuickOpen(false);
    setNotifOpen(false);
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next ? "dark" : "light");
    try {
      localStorage.setItem("nova-theme", next ? "dark" : "light");
    } catch {}
  }

  // Restore persisted theme + brand accent on first load.
  useEffect(() => {
    try {
      const theme = localStorage.getItem("nova-theme");
      if (theme === "light" || theme === "dark") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from persisted storage
        setIsDark(theme === "dark");
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
      }
      const accent = localStorage.getItem("nova-accent");
      if (accent) document.documentElement.style.setProperty("--brand-primary", accent);
    } catch {}
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      } else if (e.key === "Escape") {
        closeAllMenus();
      }
    }
    function onPointerDown(e: MouseEvent) {
      if (
        headerActionsRef.current &&
        !headerActionsRef.current.contains(e.target as Node)
      ) {
        closeAllMenus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-surface-border bg-surface transition-all duration-200 lg:sticky lg:top-0 lg:h-screen ${
          collapsed ? "w-[74px]" : "w-[84vw] max-w-[280px] lg:w-68"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-surface-border px-4">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            {collapsed ? (
              <Image
                src="/images/icon.png"
                alt="NOVA ONE"
                width={34}
                height={34}
                className="h-8.5 w-8.5 shrink-0 rounded-lg"
                unoptimized
              />
            ) : (
              <Image
                src="/images/logo.png"
                alt="NOVA TECH"
                width={150}
                height={32}
                className="h-6.5 w-auto object-contain"
                priority
                unoptimized
              />
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden rounded-lg p-1.5 text-muted hover:bg-background hover:text-foreground lg:inline-flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-muted hover:bg-background lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <Suspense
          fallback={
            <div className="flex-1 px-3 py-4 text-xs text-muted">
              Loading menu...
            </div>
          }
        >
          <SidebarNav
            collapsed={collapsed}
            onNavigate={() => setMobileOpen(false)}
          />
        </Suspense>

        {/* Multi-Tenant Org & Mobile Profile Footer */}
        {!collapsed && (
          <div className="space-y-2 border-t border-surface-border p-3">
            <div className="flex items-center justify-between gap-2 md:hidden">
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex flex-1 items-center gap-2 rounded-xl border border-surface-border bg-background/70 px-3 py-2 text-xs font-medium"
              >
                <UserCircle className="h-4 w-4 text-brand-primary" />
                <span>Profile</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-background/70 px-3 py-2 text-xs font-medium text-rose-500"
              >
                <LogOut className="h-4 w-4" />
                <span>Login</span>
              </Link>
            </div>
            <div className="rounded-xl border border-surface-border bg-background/70 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground">
                  Nova Tech Digital
                </span>
                <span className="rounded bg-brand-green/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-teal dark:text-brand-green">
                  SaaS Core
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                12 Systems · 40+ Modules
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-surface-border bg-surface/95 px-3 backdrop-blur-xl lg:h-16 lg:gap-3 lg:px-6">
          {/* Mobile Brand + Search */}
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:max-w-xl lg:gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2 lg:hidden">
              <Image
                src="/images/icon.png"
                alt="NOVA ONE"
                width={30}
                height={30}
                className="h-7.5 w-7.5 rounded-lg"
                unoptimized
              />
            </Link>

            {/* Desktop Search Trigger */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden min-w-0 flex-1 items-center justify-between rounded-xl border border-surface-border bg-background/80 px-3 py-2 text-left text-sm text-muted transition-colors hover:border-brand-primary/50 sm:flex"
            >
              <span className="flex min-w-0 items-center gap-2.5 truncate">
                <Search className="h-4 w-4 shrink-0 text-muted" />
                <span className="truncate">
                  Search modules, leads, clients, invoices...
                </span>
              </span>
              <kbd className="hidden shrink-0 rounded border border-surface-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted md:inline-block">
                Ctrl K
              </kbd>
            </button>

            {/* Mobile Compact Search */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-surface-border bg-background/80 px-2.5 py-1.5 text-xs text-muted sm:hidden"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Search NOVA ONE...</span>
            </button>
          </div>

          <div ref={headerActionsRef} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Role Switcher */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => {
                  setQuickOpen(false);
                  setNotifOpen(false);
                  setRoleMenuOpen((v) => !v);
                }}
                className="flex items-center gap-2 rounded-xl border border-surface-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground hover:border-brand-primary/50"
              >
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                <span>{selectedRole}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted" />
              </button>
              {roleMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-surface-border bg-surface p-1.5 shadow-lg">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r);
                        setRoleMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${
                        selectedRole === r
                          ? "bg-brand-primary/10 font-semibold text-brand-primary"
                          : "text-foreground hover:bg-background"
                      }`}
                    >
                      <span>{r}</span>
                    </button>
                  ))}
                  <div className="my-1 border-t border-surface-border" />
                  <Link
                    href="/profile"
                    onClick={() => setRoleMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-background"
                  >
                    <UserCircle className="h-3.5 w-3.5 text-brand-primary" />
                    Profile Management
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setRoleMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-500 hover:bg-background"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Admin Login / Switch Account
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Create */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setRoleMenuOpen(false);
                  setNotifOpen(false);
                  setQuickOpen((v) => !v);
                }}
                className="nova-gradient inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Quick Create</span>
              </button>
              {quickOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-surface-border bg-surface p-1.5 shadow-lg">
                  {[
                    { label: "New CRM Lead", href: "/crm" },
                    { label: "New Proposal", href: "/proposals" },
                    { label: "New Project", href: "/projects" },
                    { label: "New GST Invoice", href: "/finance" },
                    { label: "Store Credential", href: "/vault" },
                  ].map((act) => (
                    <Link
                      key={act.label}
                      href={act.href}
                      onClick={() => setQuickOpen(false)}
                      className="block rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-background"
                    >
                      + {act.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle Light / Dark theme"
              className="rounded-xl border border-surface-border bg-background/80 p-2 text-muted hover:text-foreground"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* AI Assistant Pill */}
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              title="NOVA AI Business Assistant (Phase 6)"
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-teal/30 bg-brand-teal/10 px-2.5 py-2 text-xs font-medium text-brand-teal hover:bg-brand-teal/15 dark:text-brand-green"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setRoleMenuOpen(false);
                  setQuickOpen(false);
                  setNotifOpen((v) => !v);
                }}
                className="relative rounded-xl border border-surface-border bg-background/80 p-2 text-muted hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-green px-1 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-1.5 w-80 rounded-2xl border border-surface-border bg-surface p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                    <span>Notifications ({unreadCount} new)</span>
                    <button
                      type="button"
                      onClick={() => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))}
                      className="text-brand-primary hover:underline disabled:text-muted disabled:no-underline"
                      disabled={unreadCount === 0}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto text-xs">
                    {notifs.length === 0 && (
                      <p className="py-6 text-center text-muted">You&apos;re all caught up 🎉</p>
                    )}
                    {notifs.map((n) => (
                      <div
                        key={n.id}
                        className={`group flex items-start gap-2 rounded-lg border px-2.5 py-2 ${
                          n.read
                            ? "border-surface-border bg-background/40 text-muted"
                            : "border-brand-primary/30 bg-brand-primary/5 text-foreground"
                        }`}
                      >
                        {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />}
                        <button
                          type="button"
                          onClick={() => setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                          className="flex-1 text-left"
                          title={n.read ? "" : "Mark as read"}
                        >
                          <p className="leading-snug">{n.text}</p>
                          <p className="mt-0.5 text-[10px] text-muted/80">{n.time}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifs((prev) => prev.filter((x) => x.id !== n.id))}
                          title="Dismiss"
                          className="rounded p-0.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {notifs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotifs([])}
                        className="flex-1 rounded-lg border border-surface-border py-1.5 text-[11px] font-semibold text-muted hover:text-foreground"
                      >
                        Clear all
                      </button>
                    )}
                    <Link
                      href="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="nova-gradient flex-1 rounded-lg py-1.5 text-center text-[11px] font-semibold text-white"
                    >
                      View all
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="nova-ambient flex-1 p-3.5 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Native Mobile Bottom Tab Bar */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-surface-border bg-surface/95 px-2 pt-1.5 backdrop-blur-xl lg:hidden">
        {[
          { label: "Home", href: "/", icon: LayoutDashboard },
          { label: "CRM", href: "/crm", icon: Target },
          { label: "Inbox", href: "/inbox", icon: Inbox, badge: "9" },
          { label: "Projects", href: "/projects", icon: FolderKanban },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold transition-all active:scale-95 ${
                active
                  ? "bg-brand-primary/12 text-brand-primary"
                  : "text-muted"
              }`}
            >
              <div className="relative">
                <Icon className="h-4.5 w-4.5" />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 rounded-full bg-brand-green px-1 text-[8px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold text-muted active:scale-95"
        >
          <Menu className="h-4.5 w-4.5" />
          <span>Menu</span>
        </button>
      </nav>

      <NovaAiDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onOpenAi={() => setAiOpen(true)}
      />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background">{children}</div>}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
