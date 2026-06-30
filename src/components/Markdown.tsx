"use client";

import React from "react";

// Minimal, dependency-free markdown renderer: headings, bold, inline links,
// bullet + numbered lists, and paragraphs. Enough for HENRY's generated output.
function inline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on **bold** and [text](url) while keeping delimiters.
  const regex = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  parts.forEach((p, i) => {
    if (!p) return;
    if (p.startsWith("**") && p.endsWith("**")) {
      nodes.push(<strong key={`${keyBase}-b${i}`}>{p.slice(2, -2)}</strong>);
    } else if (p.startsWith("[")) {
      const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        nodes.push(
          <a key={`${keyBase}-a${i}`} href={m[2]} target="_blank" rel="noreferrer">
            {m[1]}
          </a>
        );
      } else {
        nodes.push(<span key={`${keyBase}-s${i}`}>{p}</span>);
      }
    } else {
      nodes.push(<span key={`${keyBase}-s${i}`}>{p}</span>);
    }
  });
  return nodes;
}

export default function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flush = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it, `li${key}-${i}`)}</li>);
    out.push(
      list.ordered ? (
        <ol key={`l${key++}`} className="md-ol">
          {items}
        </ol>
      ) : (
        <ul key={`l${key++}`} className="md-ul">
          {items}
        </ul>
      )
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (h) {
      flush();
      const level = h[1].length;
      const cls = `md-h md-h${level}`;
      out.push(
        <p key={`h${key++}`} className={cls}>
          {inline(h[2], `h${key}`)}
        </p>
      );
    } else if (bullet) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
    } else if (num) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(num[1]);
    } else {
      flush();
      out.push(
        <p key={`p${key++}`} className="md-p">
          {inline(line, `p${key}`)}
        </p>
      );
    }
  }
  flush();
  return <div className="md">{out}</div>;
}
