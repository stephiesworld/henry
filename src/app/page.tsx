import Link from "next/link";
import { QUESTION_CATEGORIES, TOTAL_QUESTIONS } from "@/lib/questions";

// The "Answers" section shows six real question groups, drawn from the live
// question catalog, in the order the design lays them out.
const ANSWER_GROUP_IDS = [
  "cost-increases",
  "profitability",
  "chargebacks",
  "inventory-po",
  "negotiation",
  "model-strategy",
];
const ANSWER_GROUPS = ANSWER_GROUP_IDS.map((id) =>
  QUESTION_CATEGORIES.find((c) => c.id === id)
).filter((c): c is (typeof QUESTION_CATEGORIES)[number] => Boolean(c));

// Static render of the Profitability tab's margin waterfall — the built-in
// sample portfolio (clearly tagged), not real customer data.
const INK = "rgba(241,238,230,0.85)";
const DIM = "rgba(241,238,230,0.55)";
const MONO = "rgba(241,238,230,0.7)";
const RED = "#C4643F";
const GREEN = "#8FBFA4";
const WF_MAX = 24;
const WATERFALL = [
  { label: "Wholesale price", value: "$24.00", amt: 24.0, kind: "base" },
  { label: "COGS", value: "−$9.50", amt: 9.5, kind: "cost" },
  { label: "Co-op / allowances", value: "−$3.60", amt: 3.6, kind: "cost" },
  { label: "Freight / inbound", value: "−$1.80", amt: 1.8, kind: "cost" },
  { label: "Chargebacks", value: "−$1.20", amt: 1.2, kind: "cost" },
  { label: "Returns / damages", value: "−$0.90", amt: 0.9, kind: "cost" },
  { label: "Advertising", value: "−$2.40", amt: 2.4, kind: "cost" },
  { label: "Net PPM", value: "$4.60", amt: 4.6, kind: "net" },
].map((r, i) => ({
  ...r,
  labelColor: r.kind === "cost" ? DIM : INK,
  valColor: r.kind === "net" ? GREEN : r.kind === "cost" ? "rgba(196,100,63,0.9)" : MONO,
  barColor: r.kind === "net" ? GREEN : r.kind === "cost" ? RED : "rgba(241,238,230,0.8)",
  width: `${Math.max(2, (r.amt / WF_MAX) * 100).toFixed(1)}%`,
  delay: `${(0.3 + i * 0.08).toFixed(2)}s`,
}));

const WORKSPACE_ROWS = [
  {
    marker: "A",
    title: "ASIN toolkit",
    body: "Paste your catalog. See who holds the buy box, which ASINs have no featured offer, 30/60-day price lows, and anything swinging past ±5%. Export to CSV.",
  },
  {
    marker: "B",
    title: "Weekly brief & playbooks",
    body: "A live digest of the Amazon updates that slip past you, plus a curated library of how-tos: FNSKU labels, Subscribe & Save, Climate Pledge, ungating, chargeback disputes.",
  },
  {
    marker: "C",
    title: "Ask an Amazonian",
    body: "A chat grounded in the playbooks and checked against current published guidance via live search. Send a photo of a label and HENRY flags what's missing.",
  },
];

const HOW = [
  { roman: "i.", title: "Bring your catalog", body: "Paste your ASINs. No integration, no login, nothing to install." },
  { roman: "ii.", title: "See what's wrong", body: "Buy-box losses, suppressed offers, and price risk surface at a glance." },
  { roman: "iii.", title: "Ask & act", body: "Plain-English, account-specific guidance, grounded in Amazon's published rules." },
];

export default function Landing() {
  return (
    <div className="landing" id="top">
      {/* NAV */}
      <header className="l-nav">
        <nav className="l-nav-inner">
          <a href="#top" className="l-brand">
            <span className="l-word">HENRY</span>
            <span className="l-brand-tag">for Amazon 1P vendors</span>
          </a>
          <div className="l-nav-links">
            <a href="#margin">Profitability</a>
            <a href="#answers">Answers</a>
            <a href="#how">How it works</a>
            <Link href="/app" className="l-launch">
              Launch HENRY
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="l-hero">
        <div className="l-hero-inner">
          <div className="l-rise">
            <p className="l-eyebrow">Vendor Central intelligence</p>
            <h1>
              Everything a 1P vendor needs, <em>in one place.</em>
            </h1>
            <p className="l-hero-sub">
              Pricing and buy-box tracking, true per-SKU margins, chargeback disputes, playbooks for
              every program, and an Amazonian who answers anything. Vendor Central buries the answers
              — HENRY puts them in one place, in plain English.
            </p>
            <div className="l-hero-cta">
              <Link href="/app" className="l-btn-cream">
                Start using — free in beta
              </Link>
              <Link href="/app" className="l-link-underline">
                Browse the playbooks
              </Link>
            </div>
            <p className="l-hero-note">Free while in beta · no login or API key needed.</p>
          </div>

          {/* Margin-waterfall card */}
          <div className="l-rise-delay">
            <div className="l-card">
              <div className="l-card-head">
                <p className="mono-lbl">Margin waterfall</p>
                <p className="mono-sub">32oz Insulated Bottle</p>
              </div>
              <div className="l-wf">
                {WATERFALL.map((r) => (
                  <div key={r.label} style={{ display: "contents" }}>
                    <span className="l-wf-label" style={{ color: r.labelColor }}>
                      {r.label}
                    </span>
                    <span
                      className="l-wf-bar"
                      style={{
                        background: r.barColor,
                        width: r.width,
                        animation: `barGrow 0.8s cubic-bezier(0.2,0.7,0.2,1) ${r.delay} both`,
                      }}
                    />
                    <span className="l-wf-val" style={{ color: r.valColor }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="l-card-foot">
                <span className="lbl">Net PPM per unit</span>
                <span className="val">$4.60</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STAT BAND */}
      <section className="l-statband">
        <div className="l-statband-inner">
          <div className="l-stat">
            <p className="num">$184,600</p>
            <p className="cap">Monthly revenue, sample portfolio</p>
          </div>
          <div className="l-stat">
            <p className="num">$35,400</p>
            <p className="cap">Net contribution after every deduction</p>
          </div>
          <div className="l-stat">
            <p className="num">19.2%</p>
            <p className="cap">Blended margin, net PPM basis</p>
          </div>
          <div className="l-stat">
            <p className="num neg">3</p>
            <p className="cap">SKUs quietly losing money</p>
          </div>
        </div>
      </section>

      {/* SECTION 01 — ONE WORKSPACE */}
      <section id="margin" className="l-section">
        <div className="l-grid-2">
          <div>
            <p className="l-section-eyebrow">01 — One workspace</p>
            <h2 className="l-h2">
              Your catalog, your margins, your questions — one tab instead of twelve.
            </h2>
            <p className="l-body">
              Today the job means Vendor Central reports, help-page archaeology, and emails that take
              days. HENRY pulls it into one workspace: live pricing and buy-box data, true net PPM per
              ASIN, playbooks for every program, and answers on demand.
            </p>
          </div>
          <div className="l-rows">
            {WORKSPACE_ROWS.map((r) => (
              <div key={r.marker} className="l-row">
                <span className="l-row-marker">{r.marker}</span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 02 — ANSWERS */}
      <section id="answers" className="l-answers">
        <div className="l-section tight">
          <div className="l-answers-head">
            <p className="l-section-eyebrow">02 — Answers</p>
            <h2 className="l-h2">The questions vendors email in, answered on the spot.</h2>
            <p className="l-body">
              These are real questions vendors send their vendor manager, then wait days on. HENRY
              answers {TOTAL_QUESTIONS} of them instantly, each grounded in Amazon&apos;s published
              guidance.
            </p>
          </div>
          <div className="l-qgroups">
            {ANSWER_GROUPS.map((group) => (
              <div key={group.id} className="l-qgroup">
                <h3>{group.label}</h3>
                <div className="qs">
                  {group.questions.slice(0, 3).map((q) => (
                    <p key={q}>{q}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 64 }}>
            <Link href="/app" className="l-btn-ink">
              Ask HENRY
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 03 — HOW IT WORKS */}
      <section id="how" className="l-section tight">
        <p className="l-section-eyebrow">03 — How it works</p>
        <div className="l-how">
          {HOW.map((h) => (
            <div key={h.roman} className="l-how-item">
              <p className="l-roman">{h.roman}</p>
              <h3>{h.title}</h3>
              <p>{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CLOSING CTA + FOOTER */}
      <section className="l-cta-band">
        <div className="l-cta-inner">
          <h2>
            Vendor Central answers, <em>without the digging.</em>
          </h2>
          <Link href="/app" className="l-btn-cream">
            Launch HENRY
          </Link>
        </div>
        <footer className="l-footer">
          <div className="l-footer-inner">
            <div>
              <p className="l-footer-word">HENRY</p>
              <p className="l-footer-backronym">
                <b>H</b>elpful <b>E</b>xpert, <b>N</b>avigating <b>R</b>etail <b>Y</b>ield
              </p>
            </div>
            <p className="l-footer-disclaimer">
              An independent prototype built from Amazon&apos;s publicly published seller &amp; vendor
              documentation, using Claude with web search. Not affiliated with or endorsed by Amazon.
              No confidential or internal data.
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}
