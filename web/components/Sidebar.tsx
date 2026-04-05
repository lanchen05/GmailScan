"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 min-h-screen flex flex-col shrink-0"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "#fff",
              boxShadow: "0 0 12px var(--accent-glow)",
            }}
          >
            G
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>GmailScan</div>
            <div className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>PII Audit</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: active ? "rgba(99,102,241,0.12)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-dim)",
                boxShadow: active ? "inset 0 0 0 1px rgba(99,102,241,0.25)" : "none",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.5 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>
          v0.6 · Local LLM
        </div>
      </div>
    </aside>
  );
}
