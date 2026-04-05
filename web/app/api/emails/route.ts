import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const PROJECT_ROOT = path.join(process.cwd(), "..");
const DB_PATH = path.join(PROJECT_ROOT, "data", "gmailscan.db");

interface Row {
  gmail_id: string;
  date: string | null;
  sender: string | null;
  subject: string | null;
  has_pii: number;
  findings: string | null;
  processed_at: string | null;
  fetch_time_ms: number | null;
  llm_time_ms: number | null;
  total_time_ms: number | null;
}

function parseFindings(raw: string | null): object[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const empty = {
    summary: {
      totalScanned: 0,
      piiHits: 0,
      cleanEmails: 0,
      totalFindings: 0,
      avgFetchMs: null,
      avgLlmMs: null,
      avgTotalMs: null,
    },
    emails: [],
  };

  if (!fs.existsSync(DB_PATH)) {
    return NextResponse.json(empty);
  }

  let db: Database.Database | null = null;
  try {
    db = new Database(DB_PATH, { readonly: true });
    const rows = db.prepare(`
      SELECT gmail_id, date, sender, subject, has_pii, findings, processed_at,
             fetch_time_ms, llm_time_ms, total_time_ms
      FROM scanned_emails
      ORDER BY processed_at DESC
    `).all() as Row[];

    let piiHits = 0;
    let totalFindings = 0;
    const timedRows: { fetch: number; llm: number | null; total: number }[] = [];

    const emails = rows.map((row) => {
      const parsedFindings = parseFindings(row.findings);
      const hasPii = Boolean(row.has_pii);
      if (hasPii) piiHits++;
      totalFindings += parsedFindings.length;
      if (row.total_time_ms != null) {
        timedRows.push({ fetch: row.fetch_time_ms!, llm: row.llm_time_ms, total: row.total_time_ms });
      }
      return {
        gmailId: row.gmail_id,
        date: row.date ?? "",
        sender: row.sender ?? "",
        subject: row.subject ?? "",
        hasPii,
        findings: parsedFindings,
        findingCount: parsedFindings.length,
        processedAt: row.processed_at ?? "",
        fetchTimeMs: row.fetch_time_ms,
        llmTimeMs: row.llm_time_ms,
        totalTimeMs: row.total_time_ms,
      };
    });

    const n = timedRows.length;
    const llmRows = timedRows.filter((r) => r.llm != null);
    const avgFetchMs = n ? Math.round(timedRows.reduce((s, r) => s + r.fetch, 0) / n) : null;
    const avgLlmMs = llmRows.length ? Math.round(llmRows.reduce((s, r) => s + r.llm!, 0) / llmRows.length) : null;
    const avgTotalMs = n ? Math.round(timedRows.reduce((s, r) => s + r.total, 0) / n) : null;

    return NextResponse.json({
      summary: {
        totalScanned: emails.length,
        piiHits,
        cleanEmails: emails.length - piiHits,
        totalFindings,
        avgFetchMs,
        avgLlmMs,
        avgTotalMs,
      },
      emails,
    });
  } finally {
    db?.close();
  }
}
