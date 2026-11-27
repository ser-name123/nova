"use client";

import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Video,
  X,
} from "lucide-react";
import { MiniSparkline } from "@/components/charts/MiniCharts";

type EventType = "Meeting" | "Follow-up" | "Deadline" | "Internal";
type CalEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  type: EventType;
  withWhom: string;
};

const typeTone: Record<EventType, string> = {
  Meeting: "bg-brand-primary/15 text-brand-primary",
  "Follow-up": "bg-amber-500/15 text-amber-500",
  Deadline: "bg-rose-500/15 text-rose-500",
  Internal: "bg-brand-green/15 text-brand-teal dark:text-brand-green",
};
const typeDot: Record<EventType, string> = {
  Meeting: "bg-brand-primary",
  "Follow-up": "bg-amber-500",
  Deadline: "bg-rose-500",
  Internal: "bg-brand-green",
};

const INITIAL: CalEvent[] = [
  { id: "EV-1", title: "Apex Infra — Website review call", date: "2026-11-27", time: "15:30", type: "Meeting", withWhom: "Rohan Mehta" },
  { id: "EV-2", title: "Follow-up: Kroma Q4 proposal", date: "2026-11-27", time: "17:00", type: "Follow-up", withWhom: "Karan Gill" },
  { id: "EV-3", title: "Verve Dental — Ads performance", date: "2026-11-28", time: "11:00", type: "Meeting", withWhom: "Ananya Verma" },
  { id: "EV-4", title: "Internal: Monthly SEO standup", date: "2026-11-28", time: "10:00", type: "Internal", withWhom: "SEO Team" },
  { id: "EV-5", title: "Verve project delivery due", date: "2026-11-29", time: "18:00", type: "Deadline", withWhom: "Project Team" },
  { id: "EV-6", title: "FinEdge — LinkedIn kickoff", date: "2026-12-02", time: "14:00", type: "Meeting", withWhom: "Priya Nair" },
  { id: "EV-7", title: "Apex Infra website go-live", date: "2026-12-04", time: "12:00", type: "Deadline", withWhom: "Delivery Team" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY = "2026-11-27";

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(10); // November (0-indexed)
  const [events, setEvents] = useState<CalEvent[]>(INITIAL);
  const [selected, setSelected] = useState<string>(TODAY);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("10:00");
  const [type, setType] = useState<EventType>("Meeting");
  const [withWhom, setWithWhom] = useState("");

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const grid = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: ({ day: number; key: string } | null)[] = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: ymd(year, month, d) });
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const e of events) (map[e.date] ??= []).push(e);
    return map;
  }, [events]);

  const selectedEvents = (eventsByDay[selected] ?? []).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = useMemo(
    () => [...events].filter((e) => e.date >= TODAY).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5),
    [events]
  );

  function move(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setEvents((prev) => [...prev, { id: `EV-${prev.length + 1}`, title: title.trim(), date: selected, time, type, withWhom: withWhom.trim() || "—" }]);
    setTitle(""); setWithWhom("");
    setModalOpen(false);
    notify(`Event added on ${selected}.`);
  }

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    notify("Event removed.");
  }

  const KPIS = [
    { label: "This Week", value: `${events.filter((e) => e.date >= "2026-11-24" && e.date <= "2026-11-30").length}`, delta: "scheduled", color: "#0f67a6", spark: [4, 5, 6, 7, 6, 8] },
    { label: "Today", value: `${(eventsByDay[TODAY] ?? []).length}`, delta: "meetings & tasks", color: "#0eb57d", spark: [1, 2, 1, 2, 1, 2] },
    { label: "Follow-ups", value: `${events.filter((e) => e.type === "Follow-up").length}`, delta: "due", color: "#d97706", spark: [1, 1, 2, 1, 1, 1] },
    { label: "Deadlines", value: `${events.filter((e) => e.type === "Deadline").length}`, delta: "upcoming", color: "#e11d48", spark: [1, 2, 1, 2, 2, 2] },
  ];

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
          <span className="text-xs font-semibold tracking-wider text-brand-teal uppercase dark:text-brand-green">Overview · Calendar &amp; Meetings</span>
          <h1 className="mt-1 text-2xl font-bold">Calendar &amp; Appointments</h1>
          <p className="text-sm text-muted">Client meetings, internal standups, follow-ups &amp; deadlines — with Google Calendar sync.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-green/30 bg-brand-green/10 px-3 py-2 text-xs font-semibold text-brand-teal dark:text-brand-green"><Video className="h-3.5 w-3.5" /> Google Calendar synced</span>
          <button type="button" onClick={() => setModalOpen(true)} className="nova-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-95"><Plus className="h-4 w-4" /> New Event</button>
        </div>
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

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Month grid */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 lg:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">{MONTHS[month]} {year}</h2>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(-1)} className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => { setYear(2026); setMonth(10); setSelected(TODAY); }} className="rounded-lg border border-surface-border px-2.5 py-1.5 text-[11px] font-semibold text-muted hover:text-foreground">Today</button>
              <button type="button" onClick={() => move(1)} className="rounded-lg border border-surface-border p-1.5 text-muted hover:text-foreground"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DOW.map((d) => <div key={d} className="pb-1 text-center text-[10px] font-semibold text-muted uppercase">{d}</div>)}
            {grid.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const evs = eventsByDay[cell.key] ?? [];
              const isToday = cell.key === TODAY;
              const isSel = cell.key === selected;
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelected(cell.key)}
                  className={`flex min-h-[64px] flex-col rounded-lg border p-1.5 text-left transition-colors ${isSel ? "border-brand-primary bg-brand-primary/5" : "border-surface-border hover:bg-background/60"}`}
                >
                  <span className={`text-xs font-semibold ${isToday ? "grid h-5 w-5 place-items-center rounded-full bg-brand-primary text-white" : "text-foreground"}`}>{cell.day}</span>
                  <span className="mt-1 flex flex-wrap gap-0.5">
                    {evs.slice(0, 3).map((e) => <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${typeDot[e.type]}`} />)}
                    {evs.length > 3 && <span className="text-[8px] text-muted">+{evs.length - 3}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail + upcoming */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-surface-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{selected === TODAY ? "Today" : selected}</h3>
              <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
            <div className="space-y-2">
              {selectedEvents.length === 0 && <p className="py-4 text-center text-xs text-muted">No events this day.</p>}
              {selectedEvents.map((e) => (
                <div key={e.id} className="group rounded-xl border border-surface-border bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${typeTone[e.type]}`}>{e.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted"><Clock className="h-3 w-3" /> {e.time}</span>
                      <button type="button" onClick={() => removeEvent(e.id)} className="rounded p-0.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500"><X className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-foreground">{e.title}</p>
                  <p className="text-[11px] text-muted">with {e.withWhom}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-brand-primary" /> Upcoming</div>
            <div className="space-y-2.5">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-center gap-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${typeDot[e.type]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{e.title}</p>
                    <p className="text-[10px] text-muted">{e.date} · {e.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <form onSubmit={addEvent} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">New Event · {selected}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <input value={withWhom} onChange={(e) => setWithWhom(e.target.value)} placeholder="With (client / team)" className="w-full rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl border border-surface-border bg-background px-3 py-2 text-sm focus:border-brand-primary focus:outline-none" />
                <select value={type} onChange={(e) => setType(e.target.value as EventType)} className="rounded-xl border border-surface-border bg-background px-3 py-2 text-xs focus:border-brand-primary focus:outline-none">
                  <option>Meeting</option><option>Follow-up</option><option>Deadline</option><option>Internal</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-surface-border px-4 py-2 text-xs font-semibold text-muted">Cancel</button>
              <button type="submit" className="nova-gradient rounded-xl px-4 py-2 text-xs font-semibold text-white">Add Event</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
