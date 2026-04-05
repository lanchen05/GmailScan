interface MetricCardProps {
  label: string;
  value: number | string;
  tone: "neutral" | "danger" | "success" | "accent";
  subtitle?: string;
}

const toneAccent: Record<string, string> = {
  neutral: "rgba(255,255,255,0.1)",
  danger:  "var(--danger)",
  success: "var(--success)",
  accent:  "var(--accent)",
};

const toneGlow: Record<string, string> = {
  neutral: "transparent",
  danger:  "rgba(244,63,94,0.15)",
  success: "rgba(16,185,129,0.15)",
  accent:  "rgba(99,102,241,0.15)",
};

export default function MetricCard({ label, value, tone, subtitle }: MetricCardProps) {
  return (
    <article
      className="rounded-2xl p-5 flex flex-col gap-2 relative overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Glow blob */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl pointer-events-none"
        style={{ background: toneGlow[tone], transform: "translate(30%, -30%)" }}
      />
      <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div
        className="text-3xl font-bold tabular-nums"
        style={{ color: tone === "neutral" ? "var(--text)" : toneAccent[tone] }}
      >
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px]" style={{ color: "var(--muted)" }}>{subtitle}</div>
      )}
    </article>
  );
}
