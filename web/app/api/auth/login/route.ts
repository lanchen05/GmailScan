import { NextResponse } from "next/server";
import { spawnSync } from "child_process";
import path from "path";

const PROJECT_ROOT = path.join(process.cwd(), "..");

export async function POST() {
  const result = spawnSync("python3", ["src/auth_cli.py"], {
    cwd: PROJECT_ROOT,
    timeout: 120_000,
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    const detail = result.stderr || result.error?.message || "Unknown error";
    return NextResponse.json({ error: "OAuth failed", detail }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
