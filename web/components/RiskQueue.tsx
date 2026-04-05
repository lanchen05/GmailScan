import { Email } from "@/lib/types";
import FindingChip from "./FindingChip";

export default function RiskQueue({ emails }: { emails: Email[] }) {
  const piiEmails = emails.filter((e) => e.hasPii).slice(0, 5);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Risk Queue</h2>
        {piiEmails.length > 0 && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid rgba(244,63,94,0.2)" }}
          >
            {piiEmails.length} flagged
          </span>
        )}
      </div>

      {!piiEmails.length ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No flagged emails yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px]">
          {piiEmails.map((email) => (
            <div
              key={email.gmailId}
              className="rounded-xl p-4"
              style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
            >
              <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                {email.subject || "(No subject)"}
              </h3>
              <div className="text-xs mt-1 mb-3 truncate" style={{ color: "var(--muted)" }}>
                {email.sender}
              </div>
              {email.findings.length ? (
                email.findings.map((f, i) => <FindingChip key={i} finding={f} />)
              ) : (
                <p className="text-xs" style={{ color: "var(--muted)" }}>No findings stored.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
