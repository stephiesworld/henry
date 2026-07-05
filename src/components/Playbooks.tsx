"use client";

import { useMemo, useState } from "react";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { PLAYBOOKS, type Playbook } from "@/lib/knowledge";

function md(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>
    );
    const heading = line.startsWith("## ");
    return (
      <p key={i} className={heading ? "md-h md-h3" : "md-p"}>
        {heading ? line.slice(3) : parts}
      </p>
    );
  });
}

const CATEGORIES = [
  "All",
  "Pricing",
  "Profitability",
  "Strategy",
  "Inventory",
  "Negotiation",
  "Disputes",
  "Listings",
  "Programs",
  "Compliance",
  "Events",
];

export default function Playbooks({ onAsk }: { onAsk: (q: string) => void }) {
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<Playbook | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return PLAYBOOKS.filter((p) => cat === "All" || p.category === cat).filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
    );
  }, [cat, query]);

  if (open) {
    return (
      <div>
        <button className="ghost" onClick={() => setOpen(null)}>
          <IconArrowLeft size={15} stroke={2} />
          All playbooks
        </button>
        <div className="detail-meta">
          <span className="pb-cat">{open.category}</span>
          <span className="pill">{open.audience === "Both" ? "1P + 3P" : open.audience}</span>
        </div>
        <div className="page-head" style={{ marginTop: 12, marginBottom: 8 }}>
          <h1>{open.title}</h1>
        </div>
        <div className="md">{md(open.body)}</div>
        <div className="row" style={{ marginTop: 20 }}>
          <button
            className="primary"
            onClick={() =>
              onAsk(`About "${open.title}": ${open.summary} Walk me through it for my account and confirm the current specifics.`)
            }
          >
            Ask HENRY about this
            <IconArrowRight size={16} stroke={2} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <p className="eyebrow">Knowledge / 03</p>
        <h1>Playbooks</h1>
        <p>
          HENRY&apos;s curated library of Amazon how-tos for 1P &amp; 3P sellers — the stuff Amazon
          publishes but vendors never read. Open one, or send it to the chat for an account-specific
          walkthrough.
        </p>
      </div>

      <input
        type="text"
        className="search-input"
        placeholder="Search playbooks — labels, SNS, climate pledge, ungating…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="filters">
        {CATEGORIES.map((c) => (
          <button key={c} className={`filter ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="card-grid">
        {filtered.map((p) => (
          <div key={p.id} className="feature-tile" onClick={() => setOpen(p)}>
            <div className="tile-top">
              <span className="pb-cat">{p.category}</span>
              <span className="tile-audience">{p.audience === "Both" ? "1P + 3P" : p.audience}</span>
            </div>
            <h3>{p.title}</h3>
            <p>{p.summary}</p>
            <span className="tile-link">Open →</span>
          </div>
        ))}
        {filtered.length === 0 && <p className="muted">No playbooks match that search.</p>}
      </div>
    </div>
  );
}
