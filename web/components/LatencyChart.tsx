"use client";
import { useRef, useState, useEffect } from "react";
import { Email } from "@/lib/types";

function fmtMs(ms: number | null): string {
  if (ms == null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

interface Tooltip { x: number; y: number; email: Email; }

export default function LatencyChart({ emails }: { emails: Email[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setWidth(el.clientWidth || 800));
    obs.observe(el);
    setWidth(el.clientWidth || 800);
    return () => obs.disconnect();
  }, []);

  const timed = [...emails].filter((e) => e.totalTimeMs != null).reverse();

  if (!timed.length) {
    return (
      <div ref={containerRef} className="flex items-center justify-center py-10" style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
        No timing data yet.
      </div>
    );
  }

  const H = 200;
  const PAD = { top: 20, right: 16, bottom: 44, left: 56 };
  const innerW = width - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const Y_INSET = 20;

  const maxVal = Math.max(...timed.map((e) => e.totalTimeMs!)) || 1;
  const drawH = innerH - Y_INSET * 2;

  const toX = (i: number) => PAD.left + (i / Math.max(timed.length - 1, 1)) * innerW;
  const toY = (v: number) => PAD.top + Y_INSET + drawH - (v / maxVal) * drawH;

  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => (maxVal / ticks) * i);
  const points = timed.map((e, i) => `${toX(i)},${toY(e.totalTimeMs!)}`).join(" ");

  // Build gradient fill area
  const areaPoints = [
    `${toX(0)},${toY(0)}`,
    ...timed.map((e, i) => `${toX(i)},${toY(e.totalTimeMs!)}`),
    `${toX(timed.length - 1)},${toY(0)}`,
  ].join(" ");

  return (
    <div ref={containerRef} className="relative w-full">
      <svg width="100%" height={H} viewBox={`0 0 ${width} ${H}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0)" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {tickValues.map((v, i) => {
          const y = toY(v);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={width - PAD.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--muted)">
                {fmtMs(Math.round(v))}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#chartGrad)" />

        {/* Line */}
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />

        {/* Dots */}
        {timed.map((e, i) => {
          const cx = toX(i);
          const cy = toY(e.totalTimeMs!);
          return (
            <g key={e.gmailId}>
              <circle cx={cx} cy={cy} r={12} fill="transparent" style={{ cursor: "crosshair" }}
                onMouseEnter={() => setTooltip({ x: cx, y: cy, email: e })}
                onMouseLeave={() => setTooltip(null)}
              />
              <circle cx={cx} cy={cy} r={3.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2}
                style={{ pointerEvents: "none" }}
              />
            </g>
          );
        })}

        {/* X labels */}
        {timed.length > 1 && (
          <>
            <text x={PAD.left} y={H - 8} fontSize={10} fill="var(--muted)" textAnchor="start">oldest</text>
            <text x={width - PAD.right} y={H - 8} fontSize={10} fill="var(--muted)" textAnchor="end">newest</text>
          </>
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none rounded-xl px-3 py-2.5 text-xs leading-relaxed"
          style={{
            background: "var(--surface-elevated)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            left: Math.min(tooltip.x + 14, width - 140),
            top: tooltip.y - 10,
            fontFamily: "monospace",
            color: "var(--text-dim)",
            minWidth: 120,
          }}
        >
          <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 4, fontFamily: "inherit" }}>
            Timing
          </div>
          <div>Total <span style={{ color: "var(--accent)", float: "right", marginLeft: 16 }}>{fmtMs(tooltip.email.totalTimeMs)}</span></div>
          <div>LLM <span style={{ color: "var(--text)", float: "right", marginLeft: 16 }}>{fmtMs(tooltip.email.llmTimeMs)}</span></div>
          <div>Fetch <span style={{ color: "var(--text)", float: "right", marginLeft: 16 }}>{fmtMs(tooltip.email.fetchTimeMs)}</span></div>
        </div>
      )}
    </div>
  );
}
