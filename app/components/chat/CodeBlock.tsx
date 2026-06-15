'use client';

import { useEffect, useState } from 'react';
import { codeToTokens, type BundledLanguage, type ThemedToken } from 'shiki';

interface Props {
  code: string;
  lang: string;
}

interface HighlightResult {
  lines: ThemedToken[][];
  bg: string;
  fg: string;
}

export default function CodeBlock({ code, lang }: Props) {
  const [result, setResult] = useState<HighlightResult | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    codeToTokens(code, {
      lang: (lang || 'text') as BundledLanguage,
      theme: isDark ? 'one-dark-pro' : 'github-light',
    })
      .then(({ tokens, bg, fg }) => setResult({ lines: tokens, bg: bg ?? '', fg: fg ?? '' }))
      .catch(() => setResult(null));
  }, [code, lang]);

  if (!result) {
    return (
      <pre className="overflow-x-auto rounded-md bg-zinc-100 p-4 text-sm dark:bg-zinc-800">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <pre
      style={{ backgroundColor: result.bg, color: result.fg }}
      className="overflow-x-auto rounded-md p-4 text-sm"
    >
      <code>
        {result.lines.map((line, i) => (
          <span key={i} className="block min-h-[1em]">
            {line.map((token, j) => (
              <span
                key={j}
                style={{
                  color: token.color,
                  fontWeight: (token.fontStyle ?? 0) & 1 ? 'bold' : undefined,
                  fontStyle: (token.fontStyle ?? 0) & 2 ? 'italic' : undefined,
                }}
              >
                {token.content}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  );
}
