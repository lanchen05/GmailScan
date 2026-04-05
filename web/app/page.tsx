"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import LoginButton from "@/components/LoginButton";
import RunScanButton from "@/components/RunScanButton";
import { ScanStatus } from "@/lib/types";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/auth/status").catch(() => null);
    if (res?.ok) setLoggedIn((await res.json()).loggedIn);
  }, []);

  const checkScanStatus = useCallback(async () => {
    const res = await fetch("/api/scan-status").catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      setScanStatus(d.status);
      setStartedAt(d.startedAt);
      setFinishedAt(d.finishedAt);
    }
  }, []);

  const checkEmailCount = useCallback(async () => {
    const res = await fetch("/api/emails").catch(() => null);
    if (res?.ok) setEmailCount((await res.json()).summary?.totalScanned ?? 0);
  }, []);

  useEffect(() => {
    Promise.all([checkAuth(), checkScanStatus(), checkEmailCount()]).finally(() => setLoading(false));
  }, [checkAuth, checkScanStatus, checkEmailCount]);

  useEffect(() => {
    if (scanStatus !== "running") return;
    const id = setInterval(checkScanStatus, 3000);
    return () => clearInterval(id);
  }, [scanStatus, checkScanStatus]);

  const statusConfig = {
    idle:    { label: "Idle",     dot: "var(--muted)",   bg: "rgba(255,255,255,0.04)", border: "var(--border)" },
    running: { label: "Running",  dot: "var(--amber)",   bg: "var(--amber-soft)",      border: "rgba(245,158,11,0.3)" },
    done:    { label: "Complete", dot: "var(--success)", bg: "var(--success-soft)",    border: "rgba(16,185,129,0.3)" },
  }[scanStatus];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-indigo-400 border-indigo-400/20 animate-spin-slow" />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Gradient hero background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 px-8 pt-12 pb-16 max-w-3xl mx-auto w-full gap-10">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.3)" }}>
              Privacy Audit
            </span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Gmail<span style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Scan</span>
          </h1>
          <p className="text-base" style={{ color: "var(--text-dim)", maxWidth: 480 }}>
            Scan your inbox for exposed PII — SSNs, credit cards, credentials — using a two-stage local LLM pipeline.
          </p>
        </div>

        {/* Cards row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Auth card */}
          <div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Gmail Account</span>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: loggedIn ? "var(--success)" : "var(--muted)",
                    boxShadow: loggedIn ? "0 0 6px var(--success)" : "none",
                  }}
                />
                <span className="text-xs font-medium" style={{ color: loggedIn ? "var(--success)" : "var(--muted)" }}>
                  {loggedIn ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              {loggedIn
                ? "Your Gmail account is authorized. You can run a scan."
                : "Connect your Gmail account to begin scanning for PII."}
            </p>
            <LoginButton loggedIn={loggedIn} onAuthChange={checkAuth} />
          </div>

          {/* Scan card */}
          <div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Scan Status</span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                style={{ background: statusConfig.bg, color: statusConfig.dot, border: `1px solid ${statusConfig.border}` }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: statusConfig.dot, animation: scanStatus === "running" ? "pulse-dot 1.5s ease-in-out infinite" : "none" }}
                />
                {statusConfig.label}
              </span>
            </div>

            {startedAt && (
              <div className="flex flex-col gap-1">
                <div className="text-xs flex justify-between" style={{ color: "var(--muted)" }}>
                  <span>Started</span>
                  <span style={{ color: "var(--text-dim)" }}>{new Date(startedAt).toLocaleTimeString()}</span>
                </div>
                {finishedAt && (
                  <div className="text-xs flex justify-between" style={{ color: "var(--muted)" }}>
                    <span>Finished</span>
                    <span style={{ color: "var(--text-dim)" }}>{new Date(finishedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            )}

            {!startedAt && (
              <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                Scans your primary inbox with regex pre-filtering and LLM confirmation.
              </p>
            )}

            <RunScanButton
              loggedIn={loggedIn}
              scanStatus={scanStatus}
              onScanStart={() => { setScanStatus("running"); checkScanStatus(); }}
            />
          </div>
        </div>

        {/* Stats strip */}
        {emailCount > 0 && (
          <div
            className="rounded-2xl px-6 py-5 flex items-center justify-between"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(99,102,241,0.2)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {emailCount.toLocaleString()} emails processed
                </div>
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>Results ready to review</div>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: "var(--accent)",
                color: "#fff",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            >
              View Dashboard
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* How it works */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { step: "01", title: "Pre-screen", desc: "Regex + keyword filters scan every email in milliseconds." },
              { step: "02", title: "LLM Confirm", desc: "Suspicious emails are passed to Ollama for PII confirmation." },
              { step: "03", title: "Label & Report", desc: "Hits are labeled in Gmail and displayed in the dashboard." },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
              >
                <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>{s.step}</span>
                <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{s.title}</span>
                <span className="text-xs leading-relaxed" style={{ color: "var(--text-dim)" }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
