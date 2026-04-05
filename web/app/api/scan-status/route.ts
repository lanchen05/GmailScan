import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const STATUS_PATH = path.join(process.cwd(), "..", "data", "scan_status.json");

const IDLE = { status: "idle", startedAt: null, finishedAt: null };

export async function GET() {
  if (!fs.existsSync(STATUS_PATH)) {
    return NextResponse.json(IDLE);
  }
  try {
    const data = JSON.parse(fs.readFileSync(STATUS_PATH, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(IDLE);
  }
}
