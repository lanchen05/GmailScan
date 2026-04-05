"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import MetricsGrid from "@/components/MetricsGrid";
import LatencyChart from "@/components/LatencyChart";
import EmailTable from "@/components/EmailTable";
import RiskQueue from "@/components/RiskQueue";
import { DashboardPayload } from "@/lib/types";

const EMPTY: DashboardPayload = {
  summary: { totalScanned: 0, piiHits: 0, cleanEmails: 0, totalFindings: 0, avgFetchMs: null, avgLlmMs: null, avgTotalMs: null },
  emails: [],
};

export default function DashboardPage() {
  const [payload, setPayload] = useState<DashboardPayload>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/emails");
      if (!res.ok) throw new Error();
      setPayload(await res.json());
      setLastUpdated(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Topbar */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(7,7,15,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "var(--muted)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Home
          </Link>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>PII Review Board</span>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs hidden md:block" style={{ color: "var(--muted)" }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--success)", boxShadow: "0 0 6px var(--success)", animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <span className="text-xs" style={{ color: "var(--muted)" }}>Live</span>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--surface-alt)", color: "var(--text-dim)", border: "1px solid var(--border-strong)" }}
          >
            {refreshing ? (
              <div className="w-3 h-3 rounded-full border border-t-indigo-400 border-indigo-400/20 animate-spin-slow" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            )}
            Refresh
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-5">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-t-indigo-400 border-indigo-400/20 animate-spin-slow" />
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading data…</p>
            </div>
          </div>
        ) : error ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "var(--surface)", border: "1px solid rgba(244,63,94,0.2)" }}
          >
            <p className="text-sm" style={{ color: "var(--danger)" }}>Failed to load dashboard data.</p>
          </div>
        ) : (
          <>
            <MetricsGrid summary={payload.summary} />

            {/* Chart */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", overflow: "visible" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Processing Latency</h2>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {payload.emails.filter(e => e.totalTimeMs != null).length} timed
                </span>
              </div>
              <LatencyChart emails={payload.emails} />
            </div>

            {/* Email table + risk queue */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
              <EmailTable emails={payload.emails} />
              <RiskQueue emails={payload.emails} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
