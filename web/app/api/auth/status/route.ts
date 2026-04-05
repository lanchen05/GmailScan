import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const TOKEN_PATH = path.join(process.cwd(), "..", "token.json");

export async function GET() {
  if (!fs.existsSync(TOKEN_PATH)) {
    return NextResponse.json({ loggedIn: false });
  }
  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    const expiry = token.expiry ? new Date(token.expiry) : null;
    const expired = expiry ? expiry < new Date() : false;
    const hasRefresh = !!token.refresh_token;
    // expired but has refresh_token → Python will auto-refresh, still considered logged in
    const loggedIn = !expired || hasRefresh;
    return NextResponse.json({ loggedIn, expiry: token.expiry ?? null });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
