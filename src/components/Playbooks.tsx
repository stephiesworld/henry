"use client";

import { useMemo, useState, type ReactNode } from "react";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { PLAYBOOKS, getPlaybook, type Playbook } from "@/lib/knowledge";

/** Inline markdown: **bold**, *italic*, and [[playbook-cross-links]]. */
function inline(text: string, openById: (id: string) => void): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[\[[^\]]+\]\])/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const id = part.slice(2, -2);
      const target = getPlaybook(id);
      if (!target) return <span key={i}>{id.replace(/-/g, " ")}</span>;
      return (
        <button key={i} className="pb-xlink" onClick={() => openById(id)}>
          {target.title}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Block markdown: paragraphs, - bullets, 1. numbered steps, *fine print*. */
function Md({ text, openById }: { text: string; openById: (id: string) => void }) {
  const blocks: ReactNode[] = [];
  let list: { type: "ul" | "ol"; items: ReactNode[] } | null = null;

  const flush = () => {
    if (!list) return;
    const key = `l${blocks.length}`;
    blocks.push(
      list.type === "ul" ? <ul key={key}>{list.items}</ul> : <ol key={key}>{list.items}</ol>
    );
    list = null;
  };

  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    const bullet = line.match(/^- (.*)/);
    const step = line.match(/^\d+\. (.*)/);
    if (bullet || step) {
      const type = bullet ? "ul" : "ol";
      if (!list || list.type !== type) {
        flush();
        list = { type, items: [] };
      }
      list.items.push(<li key={i}>{inline((bullet ?? step)![1], openById)}</li>);
      return;
    }
    flush();
    if (!line) return;
    if (/^\*[^*].*\*$/.test(line)) {
      blocks.push(<p key={i} className="pb-fine">{inline(line.slice(1, -1), openById)}</p>);
      return;
    }
    blocks.push(<p key={i}>{inline(line, openById)}</p>);
  });
  flush();

  return <>{blocks}</>;
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

  const openById = (id: string) => {
    const p = getPlaybook(id);
    if (p) {
      setOpen(p);
      window.scrollTo({ top: 0 });
    }
  };

  if (open) {
    const structured = Boolean(open.whyItMatters || open.problem || open.resolve);
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

        {structured ? (
          <div className="pb-detail">
            {open.whyItMatters && (
              <section className="pb-why">
                <p className="pb-label">Why it matters to you</p>
                <Md text={open.whyItMatters} openById={openById} />
              </section>
            )}
            {open.problem && (
              <section className="pb-section">
                <p className="pb-label">What&rsquo;s the problem</p>
                <Md text={open.problem} openById={openById} />
              </section>
            )}
            {open.whatYouNeed && (
              <section className="pb-section">
                <p className="pb-label">What you&rsquo;ll need</p>
                <Md text={open.whatYouNeed} openById={openById} />
              </section>
            )}
            {open.resolve && (
              <section className="pb-section">
                <p className="pb-label">How to resolve</p>
                <Md text={open.resolve} openById={openById} />
              </section>
            )}
            {open.caveat && <p className="pb-caveat">{inline(open.caveat, openById)}</p>}
          </div>
        ) : (
          <div className="md pb-legacy">
            <Md text={open.body ?? ""} openById={openById} />
          </div>
        )}

        <div className="row" style={{ marginTop: 24 }}>
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
