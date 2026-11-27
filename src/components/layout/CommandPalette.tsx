"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Search, Sparkles, X } from "lucide-react";
import { ALL_NAV_ITEMS } from "@/lib/navigation";
import { NavIcon } from "./NavIcon";

export function CommandPalette({
  open,
  onClose,
  onOpenAi,
}: {
  open: boolean;
  onClose: () => void;
  onOpenAi: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = (
    query.trim()
      ? ALL_NAV_ITEMS.filter(
          (m) =>
            m.title.toLowerCase().includes(query.toLowerCase()) ||
            m.description.toLowerCase().includes(query.toLowerCase())
        )
      : ALL_NAV_ITEMS.slice(0, 8)
  ).slice(0, 8);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[selectedIndex]) {
        router.push(results[selectedIndex].href);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, selectedIndex, router, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-20 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3.5">
          <Search className="h-4 w-4 text-brand-primary" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Jump to any of 40+ NOVA ONE modules..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAi();
            }}
            className="mb-2 flex w-full items-center justify-between rounded-xl border border-brand-teal/25 bg-brand-teal/10 px-3 py-2.5 text-left text-xs font-semibold text-brand-teal dark:text-brand-green"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Ask NOVA AI Business Assistant
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {results.map((item, idx) => (
            <button
              key={item.href}
              type="button"
              onClick={() => {
                router.push(item.href);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                idx === selectedIndex
                  ? "bg-brand-primary/12 text-foreground"
                  : "text-muted hover:bg-background"
              }`}
            >
              <span className="flex items-center gap-3">
                <NavIcon name={item.icon} className="h-4 w-4 text-brand-primary" />
                <span>
                  <span className="block text-xs font-semibold text-foreground">
                    {item.title}
                  </span>
                  <span className="block max-w-sm truncate text-[11px] text-muted">
                    {item.description}
                  </span>
                </span>
              </span>
              <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted">
                Phase {item.phase}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
