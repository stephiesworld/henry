import Link from "next/link";
import {
  IconListSearch,
  IconNews,
  IconMessage2,
  IconArrowRight,
} from "@tabler/icons-react";
import { QUESTION_CATEGORIES, TOTAL_QUESTIONS } from "@/lib/questions";

const ASK_PREVIEW = QUESTION_CATEGORIES.filter((c) =>
  ["cost-increases", "chargebacks", "model-strategy", "profitability", "inventory-po", "negotiation"].includes(c.id)
);

function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="3" y="3" width="34" height="34" rx="9" fill="rgba(255,153,0,0.14)" />
      <path d="M11 15l9-4 9 4v10l-9 4-9-4V15z" stroke="#ff9900" strokeWidth="1.8" fill="none" />
      <path d="M11 15l9 4 9-4M20 19v10" stroke="#ff9900" strokeWidth="1.8" />
      <path d="M13 31c4 2.4 10 2.4 14 0" stroke="#ff9900" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const FEATURES = [
  {
    Icon: IconListSearch,
    title: "ASIN toolkit",
    body: "Paste your catalog and instantly see who's winning the buy box, which ASINs have no featured offer, the 30/60-day price lows, and anything swinging more than ±5%. Export to CSV.",
  },
  {
    Icon: IconNews,
    title: "Weekly brief & playbooks",
    body: "A live digest of the Amazon updates vendors never read — plus a curated library of how-tos: FNSKU labels, Subscribe & Save, Climate Pledge, ungating, chargeback disputes, and more.",
  },
  {
    Icon: IconMessage2,
    title: "Ask an Amazonian",
    body: "A chat that answers anything — grounded in the playbooks and checked against current published guidance via live web search. Even scan a label photo and HENRY flags what's missing.",
  },
];

const STEPS = [
  { n: "1", t: "Bring your catalog", d: "Paste your ASINs — no integration or login required to start." },
  { n: "2", t: "See what's wrong", d: "HENRY surfaces buy-box losses, suppressed offers, and price risk at a glance." },
  { n: "3", t: "Ask & act", d: "Get plain-English, account-specific guidance to fix it — like having a CSM on call." },
];

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="brand">
            <Logo />
            <span className="brand-word">
              <span className="h">HENRY</span>
            </span>
          </div>
          <Link href="/app" className="nav-cta">
            Launch HENRY →
          </Link>
        </div>
      </nav>

      <section className="hero">
        <span className="eyebrow">Built for Amazon 1P vendors (and 3P sellers)</span>
        <h1 className="hero-title">
          The Vendor Central <span className="h">co-pilot</span> Amazon never gave you.
        </h1>
        <p className="hero-sub">
          Cost increases that get auto-rejected, surprise chargebacks, CRAP-status SKUs, the 1P-vs-3P
          question — Vendor Central is brutal and the answers are buried. HENRY gathers Amazon&apos;s
          guidance, checks it, and hands it back in plain English. Track your buy box and pricing, and
          ask an Amazonian anything. Like a CSM, but digital.
        </p>
        <div className="hero-cta">
          <Link href="/app" className="btn-lg primary-lg">
            Try it free
            <IconArrowRight size={18} stroke={2} />
          </Link>
          <Link href="/app" className="btn-lg ghost-lg">
            Browse the playbooks
          </Link>
        </div>
        <p className="hero-note">No login or API key needed to explore — runs on built-in demo data.</p>
      </section>

      <section className="problem">
        <p>
          &ldquo;Amazon told us the label spec changed&hellip; in a notification we never opened.&rdquo;
          1P vendors lose margin to chargebacks, suppressed buy boxes, and missed program deadlines —
          not because the answers don&apos;t exist, but because they&apos;re buried. HENRY surfaces them.
        </p>
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="fc-icon">
              <f.Icon size={28} stroke={1.6} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="ask-section">
        <h2>What you can ask HENRY</h2>
        <p className="ask-sub">
          {TOTAL_QUESTIONS}+ real vendor questions, answered for your account — here&apos;s a taste.
        </p>
        <div className="ask-grid">
          {ASK_PREVIEW.map((c) => (
            <div key={c.id} className="ask-cat">
              <div className="ask-cat-label">{c.label}</div>
              <ul>
                {c.questions.slice(0, 3).map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 30 }}>
          <Link href="/app" className="btn-lg primary-lg">
            Ask HENRY
            <IconArrowRight size={18} stroke={2} />
          </Link>
        </div>
      </section>

      <section className="steps">
        <h2>How it works</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div key={s.n} className="step">
              <div className="step-n">{s.n}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>
          Stop reading Amazon&apos;s fine print. <span className="h">Ask HENRY instead.</span>
        </h2>
        <Link href="/app" className="btn-lg primary-lg">
          Launch HENRY
          <IconArrowRight size={18} stroke={2} />
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="brand">
          <Logo size={26} />
          <span className="brand-word">
            <span className="h">HENRY</span>
          </span>
        </div>
        <span className="muted">Prototype · pricing via Keepa, answers via Claude + web search.</span>
      </footer>
    </div>
  );
}
