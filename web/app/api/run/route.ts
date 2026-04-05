import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

const PROJECT_ROOT = path.join(process.cwd(), "..");

export async function POST() {
  const child = spawn("python3", ["main.py"], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  return NextResponse.json({ ok: true, pid: child.pid });
}
