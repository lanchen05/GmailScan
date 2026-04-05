import MetricCard from "./MetricCard";
import { Summary } from "@/lib/types";

function fmtMs(ms: number | null): string {
  if (ms == null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export default function MetricsGrid({ summary }: { summary: Summary }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Scanned" value={summary.totalScanned.toLocaleString()} tone="neutral" />
        <MetricCard label="PII Hits" value={summary.piiHits.toLocaleString()} tone="danger" />
        <MetricCard label="Clean" value={summary.cleanEmails.toLocaleString()} tone="success" />
        <MetricCard label="Findings" value={summary.totalFindings.toLocaleString()} tone="accent" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Avg Fetch" value={fmtMs(summary.avgFetchMs)} tone="neutral" subtitle="Gmail API" />
        <MetricCard label="Avg LLM" value={fmtMs(summary.avgLlmMs)} tone="neutral" subtitle="Ollama (flagged only)" />
        <MetricCard label="Avg Total" value={fmtMs(summary.avgTotalMs)} tone="neutral" subtitle="End-to-end" />
      </div>
    </div>
  );
}
