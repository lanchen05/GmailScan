"use client";
import { useMemo, useState } from "react";
import { Email } from "@/lib/types";

function fmtMs(ms: number | null): string {
  if (ms == null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export default function EmailTable({ emails }: { emails: Email[] }) {
  const [senderFilter, setSenderFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [piiOnly, setPiiOnly] = useState(false);

  const filtered = useMemo(() =>
    emails.filter((e) => {
      const s = !senderFilter || e.sender.toLowerCase().includes(senderFilter.toLowerCase());
      const sub = !subjectFilter || e.subject.toLowerCase().includes(subjectFilter.toLowerCase());
      const p = !piiOnly || e.hasPii;
      return s && sub && p;
    }),
    [emails, senderFilter, subjectFilter, piiOnly]
  );

  const inputStyle: React.CSSProperties = {
    background: "var(--surface-alt)",
    border: "1px solid var(--border-strong)",
    borderRadius: 10,
    color: "var(--text)",
    padding: "8px 12px",
    fontSize: "0.82rem",
    width: "100%",
    outline: "none",
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Email Review</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Sender</label>
          <input style={inputStyle} placeholder="Filter…" value={senderFilter} onChange={(e) => setSenderFilter(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Subject</label>
          <input style={inputStyle} placeholder="Filter…" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              className="relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer"
              style={{ background: piiOnly ? "var(--accent)" : "var(--surface-elevated)", border: "1px solid var(--border-strong)" }}
              onClick={() => setPiiOnly(!piiOnly)}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                style={{ transform: piiOnly ? "translateX(17px)" : "translateX(2px)" }}
              />
            </div>
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>PII only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--border)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ background: "var(--surface-alt)" }}>
              {["Processed", "Sender", "Subject", "Status", "Findings", "Timing", "ID"].map((h) => (
                <th
                  key={h}
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.68rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    padding: "10px 14px",
                    textAlign: "left",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!filtered.length ? (
              <tr>
                <td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                  No emails match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((email) => (
                <tr
                  key={email.gmailId}
                  className="transition-colors duration-100"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {email.processedAt.replace("T", " ").slice(0, 19)}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "var(--text-dim)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {email.sender}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "var(--text)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {email.subject || "(No subject)"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 9px", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700,
                        background: email.hasPii ? "var(--danger-soft)" : "var(--success-soft)",
                        color: email.hasPii ? "var(--danger)" : "var(--success)",
                        border: `1px solid ${email.hasPii ? "rgba(244,63,94,0.25)" : "rgba(16,185,129,0.25)"}`,
                      }}
                    >
                      <span
                        style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: email.hasPii ? "var(--danger)" : "var(--success)",
                        }}
                      />
                      {email.hasPii ? "PII" : "Clean"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "var(--text-dim)", textAlign: "center" }}>
                    {email.findingCount}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div className="flex flex-col gap-0.5" style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "monospace" }}>
                      <span><span style={{ color: "var(--muted)", marginRight: 4 }}>F</span>{fmtMs(email.fetchTimeMs)}</span>
                      <span><span style={{ color: "var(--muted)", marginRight: 4 }}>L</span>{fmtMs(email.llmTimeMs)}</span>
                      <span><span style={{ color: "var(--muted)", marginRight: 4 }}>T</span>{fmtMs(email.totalTimeMs)}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: "0.7rem", fontFamily: "monospace", color: "var(--muted)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {email.gmailId}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs" style={{ color: "var(--muted)" }}>
        Showing {filtered.length} of {emails.length} emails
      </div>
    </div>
  );
}
