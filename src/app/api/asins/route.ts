import { NextRequest, NextResponse } from "next/server";
import { analyzeAsins } from "@/lib/keepa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { asins?: unknown; keepaKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const keepaKey = typeof body.keepaKey === "string" ? body.keepaKey : undefined;
  const raw = body.asins;
  let asins: string[] = [];
  if (Array.isArray(raw)) {
    asins = raw.map(String);
  } else if (typeof raw === "string") {
    asins = raw.split(/[\s,;\n]+/);
  }

  if (!asins.length) {
    return NextResponse.json(
      { error: "Provide one or more ASINs (comma, space, or newline separated)." },
      { status: 400 }
    );
  }

  try {
    const data = await analyzeAsins(asins, keepaKey);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: `Analysis failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
