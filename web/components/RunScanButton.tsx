"use client";
import { useState } from "react";
import { ScanStatus } from "@/lib/types";

interface RunScanButtonProps {
  loggedIn: boolean;
  scanStatus: ScanStatus;
  onScanStart: () => void;
}

export default function RunScanButton({ loggedIn, scanStatus, onScanStart }: RunScanButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const disabled = !loggedIn || scanStatus === "running";

  async function handleRun() {
    setError(null);
    try {
      const res = await fetch("/api/run", { method: "POST" });
      if (!res.ok) setError("Failed to start scan.");
      else onScanStart();
    } catch {
      setError("Network error.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleRun}
        disabled={disabled}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={
          disabled
            ? { background: "rgba(255,255,255,0.04)", color: "var(--muted)", border: "1px solid var(--border)" }
            : {
                background: "linear-gradient(135deg, #059669, #10b981)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(16,185,129,0.25)",
              }
        }
      >
        {scanStatus === "running" ? (
          <>
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
            Scanning in progress…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
            </svg>
            Run Scan
          </>
        )}
      </button>
      {!loggedIn && (
        <p className="text-xs text-center" style={{ color: "var(--muted)" }}>Login with Gmail first</p>
      )}
      {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
