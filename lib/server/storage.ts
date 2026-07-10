/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Server-side storage for the progress document.
 *
 * Two adapters behind one interface:
 *   - NeonStore: Postgres over HTTP (production, requires DATABASE_URL).
 *   - FileStore: a JSON file under data/ (local development fallback).
 *
 * The app is single-user, so storage is a single keyed document. The
 * passphrase check happens in the route handler, not here.
 */

import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface ProgressStore {
  /** Returns the stored document as a JSON string, or null when empty. */
  load(): Promise<string | null>;
  save(json: string): Promise<void>;
}

const DOC_ID = "default";

class NeonStore implements ProgressStore {
  private sql = neon(process.env.DATABASE_URL!);
  private ready: Promise<unknown> | null = null;

  private ensureTable(): Promise<unknown> {
    this.ready ??= this.sql`
      CREATE TABLE IF NOT EXISTS progress (
        id TEXT PRIMARY KEY,
        doc JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    return this.ready;
  }

  async load(): Promise<string | null> {
    await this.ensureTable();
    const rows = await this.sql`
      SELECT doc FROM progress WHERE id = ${DOC_ID}`;
    return rows.length > 0 ? JSON.stringify(rows[0].doc) : null;
  }

  async save(json: string): Promise<void> {
    await this.ensureTable();
    await this.sql`
      INSERT INTO progress (id, doc, updated_at)
      VALUES (${DOC_ID}, ${json}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET doc = ${json}::jsonb, updated_at = now()`;
  }
}

class FileStore implements ProgressStore {
  private file = path.join(process.cwd(), "data", "progress.json");

  async load(): Promise<string | null> {
    try {
      return await fs.readFile(this.file, "utf8");
    } catch {
      return null;
    }
  }

  async save(json: string): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, json, "utf8");
  }
}

let store: ProgressStore | null = null;

export function getStore(): ProgressStore {
  store ??= process.env.DATABASE_URL ? new NeonStore() : new FileStore();
  return store;
}
