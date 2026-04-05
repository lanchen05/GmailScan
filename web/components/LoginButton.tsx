"use client";
import { useState } from "react";

interface LoginButtonProps {
  loggedIn: boolean;
  onAuthChange: () => void;
}

export default function LoginButton({ loggedIn, onAuthChange }: LoginButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.detail || "Login failed. Please try again.");
      } else {
        onAuthChange();
      }
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleLogin}
        disabled={pending}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
        style={
          loggedIn
            ? { background: "rgba(255,255,255,0.06)", color: "var(--text-dim)", border: "1px solid var(--border-strong)" }
            : {
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "#fff",
                boxShadow: pending ? "none" : "0 0 20px var(--accent-glow)",
              }
        }
      >
        {pending ? (
          <>
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
            Opening browser…
          </>
        ) : loggedIn ? (
          "Reconnect Gmail"
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            Login with Gmail
          </>
        )}
      </button>
      {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
