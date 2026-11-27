"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 21 21" className="h-4 w-4 shrink-0" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@novatech.in");
  const [password, setPassword] = useState("NovaOne@2026");
  const [showPass, setShowPass] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [portalType, setPortalType] = useState<"admin" | "client">("admin");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaRequired) {
      setMfaRequired(true);
      return;
    }
    setLoadingProvider("password");
    setTimeout(() => {
      router.push("/");
    }, 500);
  }

  function handleSso(provider: "google" | "microsoft") {
    setLoadingProvider(provider);
    setTimeout(() => {
      router.push("/");
    }, 650);
  }

  return (
    <div className="nova-ambient flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-surface-border bg-surface shadow-2xl">
        <div className="nova-gradient h-1.5 w-full" />

        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <Image
              src="/images/logo.png"
              alt="NOVA TECH"
              width={160}
              height={36}
              className="h-8 w-auto object-contain"
              priority
              unoptimized
            />
            <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-[10px] font-bold tracking-wider text-brand-teal uppercase dark:text-brand-green">
              NOVA ONE
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight">
            {mfaRequired ? "Two-Factor Verification" : "Sign in to your workspace"}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {mfaRequired
              ? "Enter the 6-digit authenticator code for your Admin account."
              : "Unified CRM, Projects, SEO, Finance & Vault access."}
          </p>

          {!mfaRequired && (
            <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-xl border border-surface-border bg-background/70 p-1">
              {(
                [
                  { id: "admin", label: "Admin / Staff" },
                  { id: "client", label: "Client Portal" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPortalType(t.id)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    portalType === t.id
                      ? "nova-gradient text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {resetSent && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand-green/30 bg-brand-green/10 px-3 py-2 text-xs font-medium text-brand-teal dark:text-brand-green">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Password reset link sent to {email}.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {!mfaRequired ? (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-surface-border bg-background py-2.5 pr-3 pl-9 text-sm focus:border-brand-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <label className="font-medium text-muted">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetSent(true);
                        setTimeout(() => setResetSent(false), 3000);
                      }}
                      className="font-medium text-brand-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-surface-border bg-background py-2.5 pr-10 pl-9 text-sm focus:border-brand-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  6-Digit MFA Code (enter any 6 digits for UI demo)
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-brand-green" />
                  <input
                    autoFocus
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-xl border border-surface-border bg-background py-2.5 pr-3 pl-9 font-mono text-sm tracking-widest focus:border-brand-primary focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMfaRequired(false)}
                  className="mt-2 text-xs text-brand-primary hover:underline"
                >
                  ← Back to email &amp; password
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loadingProvider !== null}
              className="nova-gradient flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-70"
            >
              {loadingProvider === "password"
                ? "Signing in..."
                : mfaRequired
                  ? "Verify & Enter Dashboard"
                  : "Continue with MFA"}
              <ArrowRight className="h-4 w-4" />
            </button>

            {!mfaRequired && (
              <>
                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-surface-border" />
                  <span className="mx-3 shrink-0 text-[11px] text-muted">
                    or continue with SSO
                  </span>
                  <div className="flex-grow border-t border-surface-border" />
                </div>

                <div className="grid gap-2.5">
                  <button
                    type="button"
                    disabled={loadingProvider !== null}
                    onClick={() => handleSso("google")}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-surface-border bg-background/70 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-brand-primary disabled:opacity-70"
                  >
                    <GoogleIcon />
                    {loadingProvider === "google"
                      ? "Connecting Google OAuth..."
                      : "Continue with Google"}
                  </button>

                  <button
                    type="button"
                    disabled={loadingProvider !== null}
                    onClick={() => handleSso("microsoft")}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-surface-border bg-background/70 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-brand-primary disabled:opacity-70"
                  >
                    <MicrosoftIcon />
                    {loadingProvider === "microsoft"
                      ? "Connecting Microsoft Outlook..."
                      : "Continue with Microsoft Outlook"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
