import { NextResponse, NextRequest } from "next/server";
import { sshExec } from "@/lib/ssh";

const ALLOWED_ACTIONS = ["start", "stop", "restart"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

export async function POST(req: NextRequest) {
  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as Action;
  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const { stdout, stderr } = await sshExec(
      `systemctl ${action} rental-scraper && sleep 1 && systemctl is-active rental-scraper`
    );
    const status = stdout.trim();
    return NextResponse.json({ ok: true, action, status, stderr: stderr.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "SSH error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}