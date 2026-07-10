# ADR 0003: Offline-first progress with passphrase sync

Date: 2026-07-10
Status: accepted

## Context

Progress must never be lost when switching machines, but the app should
also work with zero configuration and no network.

## Decision

- The progress document lives in `localStorage` and every mutation is
  persisted there synchronously (offline-first).
- When a passphrase is configured, the client pushes the document
  (debounced) to `PUT /api/progress` and pulls it at startup. The server
  checks the passphrase against the `KORTEX_PASSPHRASE` environment
  variable with a timing-safe comparison.
- Storage behind the API is an interface with two adapters: Neon
  Postgres when `DATABASE_URL` is set (production on Vercel), a local
  JSON file under `data/` otherwise (development).
- Conflict resolution is last-write-wins on the whole document, using
  the `updatedAt` timestamp.

## Rationale

Single user, single document: per-field merging (CRDTs, vector clocks)
is not worth the complexity. The realistic failure mode is "reviewed on
machine A yesterday, opening machine B today", which last-write-wins
handles correctly. Simultaneous active sessions on two machines can lose
one session's delta; accepted trade-off, documented here.

## Consequences

- The API stays a two-verb endpoint; the whole sync layer is ~100 lines.
- If multi-device simultaneous use becomes real, revisit with per-key
  timestamps (the document shape already isolates cards by id).
