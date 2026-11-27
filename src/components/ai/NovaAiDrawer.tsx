"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Eraser, Send, Sparkles, X } from "lucide-react";

const SAMPLE_PROMPTS = [
  "How much revenue this month?",
  "Which clients have pending payments?",
  "Which subscriptions expire soon?",
  "Which SEO clients lost traffic?",
  "Which projects are overdue?",
  "Best performing ad campaign?",
  "Pending timesheets?",
  "Total monthly recurring revenue?",
];

type Entry = { keywords: string[]; answer: string };

const KB: Entry[] = [
  { keywords: ["revenue", "earn", "income", "made", "sales this"], answer: "Monthly Revenue (MTD) is Rs.12.85L — up 18.4% MoM — with Rs.4.92L net profit. Top contributors: Kroma Apparel (Rs.1.10L), Verve Healthcare (Rs.82K), Apex Infra (Rs.65K)." },
  { keywords: ["mrr", "recurring", "retainer"], answer: "Total Monthly Recurring Revenue is Rs.3.60L across 5 active retainers. Avg margin 45.6%. Biggest: Kroma Apparel at Rs.1.10L/mo." },
  { keywords: ["pending payment", "unpaid", "overdue", "receivable", "outstanding"], answer: "Outstanding receivables: Rs.4.37L. 2 invoices need attention — Verve Healthcare (Rs.96,760, due in 3 days) and Kroma Apparel ($2,400, overdue 41 days via Stripe — reminder re-sent)." },
  { keywords: ["subscription", "renewal", "expire", "expiring", "domain", "hosting"], answer: "3 critical renewals: apexinfra.in domain (3 days), AWS EC2 Verve Prod (7 days), M365 Business 12 seats (15 days). Account managers + clients already notified per the 30/15/7/3-day rule." },
  { keywords: ["seo", "organic", "traffic", "ranking", "keyword"], answer: "All 3 SEO retainers are net positive MoM (+11.2% avg clicks). 184 keywords now in Top 10 (+26). Flag: apexinfra.in had 12 new 404s in yesterday's crawl — task auto-assigned to the SEO executive." },
  { keywords: ["ad", "campaign", "roas", "meta", "google ads", "tiktok", "linkedin", "cpl"], answer: "Blended ROAS across connected accounts is 4.3x on Rs.4.80L spend. Best campaign: 'Verve Dental — Search High Intent' at 4.6x ROAS, 194 conversions. Lowest CPL: Meta instant forms at Rs.295." },
  { keywords: ["project", "overdue", "delayed", "delivery", "deadline"], answer: "19 active projects — 14 on track, 3 in review, 2 at risk (<50% and open). Nearest deadline: 'Verve Dental GMB & Local Citations' (29 Nov, 92% done, under review)." },
  { keywords: ["lead", "pipeline", "crm", "conversion"], answer: "Open pipeline is Rs.18.4L across 24 leads (11 Hot). 142 leads MTD — top source Meta Lead Forms (34%). Conversion rate this month ~16%." },
  { keywords: ["timesheet", "attendance", "billable", "utilization", "hr", "employee", "staff"], answer: "26 active staff — 22 present, 2 WFH, 2 on leave. Billable utilization 78.4% (target 75%+). 2 timesheets pending approval." },
  { keywords: ["client", "how many client", "active client"], answer: "48 active clients — 42 on retainers, 6 on hold. 1 account flagged At Risk (FinEdge Advisory). Avg profit margin 46%." },
  { keywords: ["vault", "credential", "password", "secret", "security"], answer: "Secrets vault holds 5 encrypted credentials (AES-256). 1 rotation overdue (>90 days): Meta Business Token for FinEdge. All reveals/copies are audit-logged with user, IP & timestamp." },
  { keywords: ["expense", "profit", "p&l", "cost"], answer: "This month: Rs.12.85L revenue vs Rs.7.93L expenses = Rs.4.92L net profit (38.3% margin). Biggest cost line: salaries (Rs.5.20L), then pass-through ad spend." },
];

function answerFor(q: string): string {
  const text = q.toLowerCase();
  let best: { score: number; answer: string } | null = null;
  for (const e of KB) {
    const score = e.keywords.reduce((s, k) => (text.includes(k) ? s + k.length : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { score, answer: e.answer };
  }
  return (
    best?.answer ??
    `Permission-checked snapshot: 48 active clients, Rs.18.4L open pipeline, 19 active projects, 4.3x avg ad ROAS, Rs.12.85L revenue (+18.4% MoM). Ask me about revenue, payments, SEO, ads, renewals, projects, leads or HR for specifics.`
  );
}

type Msg = { role: "assistant" | "user"; text: string };
const GREETING: Msg = {
  role: "assistant",
  text: "Namaste! Main NOVA AI hoon. Aapke role permissions ke hisaab se CRM, Finance, SEO, Ads, Projects aur Renewals ka real-time summary de sakta hoon. Neeche se koi sawaal chuno ya type karo.",
};

export function NovaAiDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => () => { if (typingTimer.current) clearTimeout(typingTimer.current); }, []);

  if (!open) return null;

  function ask(promptText: string) {
    const q = promptText.trim();
    if (!q || typing) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    typingTimer.current = setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", text: answerFor(q) }]);
      setTyping(false);
    }, 650 + Math.min(900, q.length * 12));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col border-l border-surface-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="nova-gradient rounded-xl p-2 text-white"><Sparkles className="h-4 w-4" /></div>
            <div>
              <h2 className="text-sm font-bold">NOVA AI Business Assistant</h2>
              <p className="text-[11px] text-muted">RBAC-Scoped Intelligence · Phase 6</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setMessages([GREETING])} title="Clear chat" className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-foreground"><Eraser className="h-4 w-4" /></button>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => ask(p)} className="rounded-full border border-surface-border bg-background/80 px-2.5 py-1 text-left text-[11px] text-muted transition-colors hover:border-brand-primary hover:text-foreground">{p}</button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-teal/15 text-brand-teal dark:text-brand-green"><Bot className="h-4 w-4" /></div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${m.role === "user" ? "nova-gradient text-white" : "border border-surface-border bg-background/80 text-foreground"}`}>{m.text}</div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-teal/15 text-brand-teal dark:text-brand-green"><Bot className="h-4 w-4" /></div>
                <div className="flex items-center gap-1 rounded-2xl border border-surface-border bg-background/80 px-3.5 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-center gap-2 border-t border-surface-border p-3">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about revenue, SEO drops, renewals..." className="flex-1 rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none" />
          <button type="submit" disabled={typing} className="nova-gradient rounded-xl p-2 text-white disabled:opacity-60"><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  );
}
