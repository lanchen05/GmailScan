import { Finding } from "@/lib/types";

export default function FindingChip({ finding }: { finding: Finding }) {
  return (
    <div
      className="rounded-xl p-3 mt-2"
      style={{ background: "var(--danger-soft)", border: "1px solid rgba(244,63,94,0.2)" }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--danger)" }}>
        {finding.type || "unknown"}
      </div>
      <div className="text-sm font-semibold font-mono" style={{ color: "var(--text)" }}>
        {finding.value}
      </div>
      {finding.context && (
        <div className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-dim)" }}>
          {finding.context}
        </div>
      )}
    </div>
  );
}
