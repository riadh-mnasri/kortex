# ADR 0002: Leitner boxes instead of SM-2 for spaced repetition

Date: 2026-07-10
Status: accepted

## Context

Spaced repetition needs a scheduling algorithm. SM-2 (Anki's ancestor)
tracks a floating ease factor per card; Leitner uses a small number of
boxes with fixed intervals.

## Decision

Leitner with 5 boxes and intervals of 0, 1, 3, 7 and 14 days
(`lib/engine/srs.ts`), with two adjustments: "easy" jumps two boxes and
"hard" keeps the box but halves the wait.

## Rationale

- Single expert user doing short daily sessions: the extra precision of
  SM-2's ease factor does not pay for its opacity.
- Fixed intervals are predictable ("box 4 means I see it every two
  weeks"), which supports the coverage metric and mastery badges.
- The state is one small record per card, trivial to merge across
  devices and to unit test.

## Consequences

- The `Grade` type and `CardState` shape are stable API for the UI and
  the sync layer; swapping in SM-2 later would only change `review()`.
