---
name: kotlin-news
description: Update Kortex content with the latest Kotlin language features. Searches recent Kotlin release notes, compares them with the covered version, generates new bilingual lessons, flashcards and exercises, and presents a summary before committing.
---

# kotlin-news: keep Kortex up to date with the Kotlin language

## What this skill does

Brings the Kortex content pack up to date with Kotlin releases published
since the last update. It is a content pipeline, not a code refactoring
tool: it only touches files under `content/packs/kotlin/`.

## Workflow

1. **Read the tracking file** `content/packs/kotlin/version.json`.
   `covered` is the last Kotlin version whose features are in the pack.

2. **Research what is new.** Search the official sources for every stable
   release after `covered`:
   - https://kotlinlang.org/docs/releases.html (release list)
   - https://blog.jetbrains.com/kotlin/ (release announcements)
   - https://github.com/Kotlin/KEEP (accepted language proposals)
   Collect: new language features, stdlib additions, deprecations and
   behavior changes. Ignore build tooling and IDE news unless they change
   how the language is written.

3. **Compare with existing content.** Grep the module JSON files under
   `content/packs/kotlin/modules/` to check which findings are already
   covered. Only genuinely new material moves forward.

4. **Generate content** following the shapes in `lib/content/types.ts`:
   - For each significant feature: a lesson (3 to 6 blocks, always include
     at least one `code` block and one `gotcha` when relevant).
   - 2 to 4 flashcards per feature, question on the front, precise
     expert-level answer on the back.
   - 1 to 2 exercises per feature (`mcq`, `predict-output` or `find-bug`).
   - Every `L10n` field must have both `en` and `fr`, same information in
     both languages. Match the tone of the existing content: expert
     refresh, concise, gotcha-oriented.
   - Small features go into the existing `whats-new` module; a major
     feature set (e.g. a new concurrency model) may justify a new module,
     added to `pack.json` with `"status": "available"`.

5. **Wire it up.** If a module was added, register its import in
   `lib/content/index.ts` and its entry in `pack.json`.

6. **Update the tracking file** `version.json`: set `covered` to the
   newest stable version integrated and append an entry to `history`.

7. **Verify.** Run `npm run test` and `npm run build`. Fix any failure.

8. **Present a summary before committing.** List: versions covered,
   features added, number of lessons/cards/exercises created, and wait
   for explicit approval. Then commit with a message describing the
   content update (author Riadh MNASRI, no tool attribution of any kind)
   and push.

## Adapting this skill to another pack (rust-news, gcp-news, ...)

Copy this folder, then change: the tracking file path, the official
sources in step 2, and the pack folder name. The content shapes and the
workflow stay identical; that is the point of the engine/content split.
