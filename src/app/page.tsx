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
    body: "A live digest of the Amazon updates that are easy to miss — plus a curated library of how-tos: FNSKU labels, Subscribe & Save, Climate Pledge, ungating, chargeback disputes, and more.",
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
  { n: "3", t: "Ask & act", d: "Get plain-English, account-specific guidance to fix it, grounded in Amazon's published rules." },
];

// A faithful, static render of the Profitability tab's margin waterfall — reuses the
// real .waterfall / .wf-* classes so the preview matches the actual product exactly.
// Numbers are the built-in sample portfolio (clearly tagged), not real customer data.
const WATERFALL = [
  { label: "Wholesale price", kind: "in", val: "$24.00", w: 100 },
  { label: "COGS", kind: "out", val: "−$9.50", w: 40 },
  { label: "Co-op / allowances", kind: "out", val: "−$3.60", w: 15 },
  { label: "Freight / inbound", kind: "out", val: "−$1.80", w: 8 },
  { label: "Chargebacks", kind: "out", val: "−$1.20", w: 5 },
  { label: "Returns / damages", kind: "out", val: "−$0.90", w: 4 },
  { label: "Advertising", kind: "out", val: "−$2.40", w: 10 },
  { label: "Net PPM", kind: "net", val: "$4.60", w: 19 },
];

function ProductPreview() {
  return (
    <div className="pv-panel" aria-hidden>
      <div className="pv-head">
        <div className="pv-dots"><span /><span /><span /></div>
        <span className="pv-title">Profitability — net PPM by ASIN</span>
        <span className="pv-tag">sample portfolio</span>
      </div>
      <div className="pv-body">
        <div className="pv-stats">
          <div className="pv-stat"><span className="pv-stat-lbl">Monthly revenue</span><span className="pv-stat-val">$184,600</span></div>
          <div className="pv-stat"><span className="pv-stat-lbl">Net contribution</span><span className="pv-stat-val">$35,400</span></div>
          <div className="pv-stat"><span className="pv-stat-lbl">Blended margin</span><span className="pv-stat-val pv-teal">19.2%</span></div>
          <div className="pv-stat"><span className="pv-stat-lbl">Losing SKUs</span><span className="pv-stat-val pv-red">3</span></div>
        </div>
        <div className="pv-wf-head">32oz Insulated Bottle — margin waterfall</div>
        <div className="waterfall">
          {WATERFALL.map((r) => (
            <div key={r.label} className="wf-row">
              <div className="wf-label">{r.label}</div>
              <div className="wf-track">
                <div className={`wf-fill wf-${r.kind}`} style={{ width: `${r.w}%` }} />
              </div>
              <div className={`wf-val ${r.kind === "out" ? "wf-neg" : ""}`}>{r.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          Vendor Central <span className="h">analytics and answers</span>, in one place.
        </h1>
        <p className="hero-sub">
          Cost increases that get auto-rejected, surprise chargebacks, CRAP-status SKUs, the 1P-vs-3P
          question — Vendor Central is unforgiving and the answers are buried. HENRY gathers
          Amazon&apos;s published guidance, checks it against live sources, and hands it back in plain
          English. Track your buy box and pricing, and ask an Amazonian anything.
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

      <section className="preview-band">
        <div className="preview-cap">
          <span className="eyebrow">See it in action</span>
          <h2>Every SKU&apos;s true net margin — after co-op, chargebacks, and ads.</h2>
          <p>
            HENRY breaks down net PPM per ASIN — the contribution Vendor Central&apos;s reports
            don&apos;t hand you directly — so you can see which SKUs actually make money.
          </p>
        </div>
        <ProductPreview />
      </section>

      <section className="problem">
        <p>
          Amazon publishes label specs, fee changes, and program deadlines constantly — across
          notifications and help pages that are easy to miss. 1P vendors lose margin to chargebacks,
          suppressed buy boxes, and missed deadlines. The answers exist; they&apos;re just buried.
          HENRY surfaces them.
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
        <h2>The questions vendors email in &mdash; answered instantly</h2>
        <p className="ask-sub">
          These are the real questions 1P vendors send their Amazon vendor manager and wait days to
          hear back on. HENRY answers {TOTAL_QUESTIONS}+ of them on the spot, grounded in
          Amazon&apos;s published guidance.
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
          Vendor Central answers, <span className="h">without the digging.</span>
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
        <span className="muted footer-disclaimer">
          An independent prototype. Built from Amazon&apos;s publicly published seller &amp; vendor
          documentation using Claude + web search — not affiliated with or endorsed by Amazon, and
          using no confidential or internal data.
        </span>
      </footer>
    </div>
  );
}
