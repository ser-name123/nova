"use client";

import { useState } from "react";

const MONTHS = [
  { m: "Jun", rev: 8.2, exp: 5.1 },
  { m: "Jul", rev: 9.1, exp: 5.4 },
  { m: "Aug", rev: 9.8, exp: 5.8 },
  { m: "Sep", rev: 10.6, exp: 6.2 },
  { m: "Oct", rev: 11.4, exp: 6.9 },
  { m: "Nov", rev: 12.85, exp: 7.93 },
];

export function RevenueTrendChart() {
  const [hovered, setHovered] = useState<number>(MONTHS.length - 1);
  const w = 560;
  const h = 165;
  const padX = 24;
  const padY = 18;
  const maxVal = 14;

  const pointsRev = MONTHS.map((d, i) => {
    const x = padX + (i * (w - padX * 2)) / (MONTHS.length - 1);
    const y = h - padY - (d.rev / maxVal) * (h - padY * 2);
    return { x, y, ...d };
  });

  const pointsExp = MONTHS.map((d, i) => {
    const x = padX + (i * (w - padX * 2)) / (MONTHS.length - 1);
    const y = h - padY - (d.exp / maxVal) * (h - padY * 2);
    return { x, y, ...d };
  });

  const lineRev = pointsRev.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaRev = `${lineRev} L${pointsRev[pointsRev.length - 1].x},${h - padY} L${pointsRev[0].x},${h - padY} Z`;
  const lineExp = pointsExp.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  const active = pointsRev[hovered];
  const profit = (active.rev - active.exp).toFixed(2);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />
            Revenue
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" />
            Expenses
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-background/80 px-3 py-1 tabular-nums">
          <span className="font-semibold text-foreground">{active.m}</span>
          <span className="text-brand-teal dark:text-brand-green">
            Rev: ₹{active.rev}L
          </span>
          <span className="text-muted">Exp: ₹{active.exp}L</span>
          <span className="font-semibold text-brand-primary">
            Net: ₹{profit}L
          </span>
        </div>
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full overflow-visible">
          <defs>
            <linearGradient id="novaRevFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0eb57d" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#1677e8" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="novaRevStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0eb57d" />
              <stop offset="50%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#1677e8" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = padY + ratio * (h - padY * 2);
            return (
              <line
                key={ratio}
                x1={padX}
                y1={y}
                x2={w - padX}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="4 4"
              />
            );
          })}

          <path d={areaRev} fill="url(#novaRevFill)" />
          <path
            d={lineExp}
            fill="none"
            stroke="#1677e8"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          <path
            d={lineRev}
            fill="none"
            stroke="url(#novaRevStroke)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {pointsRev.map((p, i) => (
            <g
              key={p.m}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hovered === i ? 6 : 4}
                fill={hovered === i ? "#0eb57d" : "#ffffff"}
                stroke="#0eb57d"
                strokeWidth="2.5"
              />
              <text
                x={p.x}
                y={h - 2}
                textAnchor="middle"
                fontSize="11"
                fill="currentColor"
                opacity={hovered === i ? 1 : 0.55}
              >
                {p.m}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function LeadSourceRingChart() {
  const sources = [
    { name: "Meta Lead Forms", pct: 34, color: "#0eb57d" },
    { name: "Google Ads", pct: 28, color: "#1677e8" },
    { name: "WhatsApp Bot", pct: 20, color: "#0d9488" },
    { name: "Website & Organic", pct: 18, color: "#3898e2" },
  ];

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
          {sources.map((s) => {
            const dash = (s.pct / 100) * circumference;
            const currentOffset = offset;
            offset += dash;
            return (
              <circle
                key={s.name}
                cx="55"
                cy="55"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums">142</span>
          <span className="text-[10px] text-muted">MTD Leads</span>
        </div>
      </div>

      <div className="w-full space-y-2">
        {sources.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-muted">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniSparkline({
  points,
  color = "#0eb57d",
}: {
  points: number[];
  color?: string;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const d = points
    .map((v, i) => {
      const x = (i * 64) / (points.length - 1);
      const y = 20 - ((v - min) / span) * 16;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 64 22" className="h-6 w-16 overflow-visible">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
