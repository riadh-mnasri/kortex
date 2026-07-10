/*
 * Copyright (c) 2026 Riadh MNASRI. All rights reserved.
 *
 * Minimal Kotlin syntax highlighting. A handwritten tokenizer keeps the
 * bundle free of a heavy highlighting dependency; good enough for the
 * short, curated snippets used in lessons and exercises.
 */
import type { ReactNode } from "react";

const KEYWORDS = new Set([
  "fun", "val", "var", "if", "else", "when", "for", "while", "do", "return",
  "class", "object", "interface", "data", "sealed", "enum", "companion",
  "suspend", "inline", "noinline", "crossinline", "reified", "in", "out",
  "is", "as", "by", "try", "catch", "finally", "throw", "import", "package",
  "null", "true", "false", "this", "super", "override", "open", "private",
  "public", "internal", "protected", "lateinit", "init", "constructor",
]);

type Token = { text: string; kind: "kw" | "str" | "com" | "num" | "plain" };

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  // Order matters: comments, then strings, then words and numbers.
  const re =
    /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|(\b\d[\d_]*\b)|([A-Za-z_][A-Za-z0-9_]*)|([\s\S])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(code)) !== null) {
    const [, com, str, num, word, other] = match;
    if (com) tokens.push({ text: com, kind: "com" });
    else if (str) tokens.push({ text: str, kind: "str" });
    else if (num) tokens.push({ text: num, kind: "num" });
    else if (word)
      tokens.push({ text: word, kind: KEYWORDS.has(word) ? "kw" : "plain" });
    else tokens.push({ text: other, kind: "plain" });
  }
  return tokens;
}

const COLOR: Record<Token["kind"], string> = {
  kw: "text-accent font-medium",
  str: "text-teal",
  com: "text-muted italic",
  num: "text-gold",
  plain: "",
};

export function CodeBlock({
  code,
  caption,
}: {
  code: string;
  caption?: ReactNode;
}) {
  return (
    <figure className="my-3">
      <pre className="rounded-xl border border-border bg-surface-2 p-4 text-[13px] leading-relaxed overflow-x-auto">
        <code>
          {tokenize(code).map((token, i) => (
            <span key={i} className={COLOR[token.kind]}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
      {caption && (
        <figcaption className="mt-1.5 text-xs text-muted px-1">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
