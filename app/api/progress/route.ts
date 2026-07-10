/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Progress sync endpoint (single user).
 *
 * Auth: the client sends the passphrase in the x-kortex-passphrase
 * header; it must match the KORTEX_PASSPHRASE environment variable.
 * Timing-safe comparison avoids leaking the passphrase length byte
 * by byte, cheap insurance even for a personal app.
 */

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/server/storage";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.KORTEX_PASSPHRASE;
  if (!expected) return false; // sync disabled until configured
  const given = request.headers.get("x-kortex-passphrase") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const doc = await getStore().load();
  if (doc === null) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return new NextResponse(doc, {
    headers: { "content-type": "application/json" },
  });
}

export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.text();
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed !== "object" || parsed === null || !parsed.updatedAt) {
      throw new Error("invalid document");
    }
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  await getStore().save(body);
  return NextResponse.json({ ok: true });
}
