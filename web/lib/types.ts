export interface Finding {
  type: string;
  value: string;
  context: string;
}

export interface Email {
  gmailId: string;
  date: string;
  sender: string;
  subject: string;
  hasPii: boolean;
  findings: Finding[];
  findingCount: number;
  processedAt: string;
  fetchTimeMs: number | null;
  llmTimeMs: number | null;
  totalTimeMs: number | null;
}

export interface Summary {
  totalScanned: number;
  piiHits: number;
  cleanEmails: number;
  totalFindings: number;
  avgFetchMs: number | null;
  avgLlmMs: number | null;
  avgTotalMs: number | null;
}

export interface DashboardPayload {
  summary: Summary;
  emails: Email[];
}

export type ScanStatus = "idle" | "running" | "done";

export interface ScanStatusPayload {
  status: ScanStatus;
  startedAt: string | null;
  finishedAt: string | null;
}
