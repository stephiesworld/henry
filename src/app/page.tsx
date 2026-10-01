import Link from "next/link";
import BoxMark from "@/components/BoxMark";
import { QUESTION_CATEGORIES, TOTAL_QUESTIONS } from "@/lib/questions";

// A handful of real questions from the catalog, shown as an "unanswered inbox".
const INBOX = [
  { cat: "cost-increases", q: 1, waiting: "9 days" },
  { cat: "chargebacks", q: 0, waiting: "6 days" },
  { cat: "inventory-po", q: 0, waiting: "2 weeks" },
  { cat: "profitability", q: 1, waiting: "4 days" },
  { cat: "negotiation", q: 0, waiting: "11 days" },
].flatMap(({ cat, q, waiting }) => {
  const group = QUESTION_CATEGORIES.find((c) => c.id === cat);
  const subject = group?.questions[q];
  return group && subject ? [{ topic: group.label, subject, waiting }] : [];
});

// Packing-slip version of the Profitability tab's margin waterfall, using the
// built-in sample portfolio (not real customer data).
const SLIP = [
  { label: "Wholesale price", value: "24.00", amt: 24, kind: "base" },
  { label: "COGS", value: "-9.50", amt: 9.5, kind: "cost" },
  { label: "Co-op & allowances", value: "-3.60", amt: 3.6, kind: "cost" },
  { label: "Freight in", value: "-1.80", amt: 1.8, kind: "cost" },
  { label: "Chargebacks", value: "-1.20", amt: 1.2, kind: "cost" },
  { label: "Returns & damages", value: "-0.90", amt: 0.9, kind: "cost" },
  { label: "Ads", value: "-2.40", amt: 2.4, kind: "cost" },
];

const MANIFEST = [
  { name: "ASIN toolkit", what: "Buy-box owner, missing featured offers, 30 and 60-day price lows, anything moving more than 5%" },
  { name: "Profitability", what: "Net PPM per ASIN after co-op, freight, chargebacks, returns and ads, with a what-if slider" },
  { name: "Chargebacks", what: "Drop in the Vendor Central export and get every deduction sorted by cause, plus a dispute letter" },
  { name: "Weekly brief", what: "What Amazon changed this week, pulled from live search with the sources linked" },
  { name: "Vendor Q&A", what: `${TOTAL_QUESTIONS} questions vendors actually ask, each one a click away from an answer` },
  { name: "Playbooks", what: "Step-by-step guides for FNSKU labels, Subscribe & Save, ungating, AVN prep and more" },
  { name: "Generators", what: "Cost-increase requests, 1P vs 3P analysis, dispute letters and listing rewrites" },
  { name: "Chat", what: "Ask anything. Send a photo of a carton label and it'll tell you what's missing" },
];

export default function Landing() {
  return (
    <div className="landing" id="top">
      <header className="l-nav">
        <nav className="l-nav-inner">
          <a href="#top" className="l-brand">
            <BoxMark />
            <span className="l-word">HENRY</span>
          </a>
          <div className="l-nav-links">
            <a href="#tools">What&apos;s inside</a>
            <a href="#questions">Questions</a>
            <Link href="/app" className="l-launch">
              Open HENRY
            </Link>
          </div>
        </nav>
      </header>

      <section className="l-hero">
        <div className="l-hero-copy l-rise">
          <p className="l-kicker">For Amazon 1P vendors (and 3P sellers too)</p>
          <h1>What is Amazon actually paying you per unit?</h1>
          <p className="l-hero-sub">
            Enter your wholesale price and costs for each ASIN and HENRY takes out co-op, freight,
            chargebacks, returns and ad spend, so you can see what every product really makes and
            which ones are worth fighting for.
          </p>
          <div className="l-hero-cta">
            <Link href="/app" className="l-btn">
              Try it with sample data
            </Link>
            <span className="l-hero-note">Free while in beta. No login, no API key.</span>
          </div>
        </div>

        <div className="l-slip-wrap l-rise-delay">
          <div className="l-slip">
            <div className="l-slip-tape" />
            <div className="l-slip-head">
              <span>PACKING SLIP</span>
              <span>SKU 32OZ-BTL-BLK</span>
            </div>
            <p className="l-slip-item">32oz insulated bottle, per unit</p>
            <div className="l-slip-rows">
              {SLIP.map((r, i) => (
                <div key={r.label} className={`l-slip-row ${r.kind}`}>
                  <span>{r.label}</span>
                  <span
                    className="l-slip-bar"
                    style={{
                      width: `${Math.max(3, (r.amt / 24) * 100).toFixed(1)}%`,
                      animationDelay: `${(0.35 + i * 0.07).toFixed(2)}s`,
                    }}
                  />
                  <span className="l-slip-val">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="l-slip-total">
              <span>You keep</span>
              <span>$4.60</span>
            </div>
            <p className="l-slip-stamp">19% net PPM</p>
            <div className="l-slip-barcode" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="l-sample">
        <p>
          In the sample catalog, <b>$184,600</b> a month in sales turns into <b>$35,400</b> after
          every deduction, and <b className="neg">3 SKUs</b> lose money on each unit Amazon orders.
          Most vendors don&apos;t find that out until the annual negotiation.
        </p>
      </section>

      <section id="tools" className="l-section">
        <div className="l-section-head">
          <h2>What&apos;s in the box</h2>
          <p>Eight tools, all in one tab. Load the sample data and poke around.</p>
        </div>
        <ol className="l-manifest">
          {MANIFEST.map((m, i) => (
            <li key={m.name}>
              <span className="l-manifest-qty">{i + 1}</span>
              <span className="l-manifest-name">{m.name}</span>
              <span className="l-manifest-what">{m.what}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="questions" className="l-questions">
        <div className="l-section l-q-grid">
          <div className="l-section-head">
            <h2>Still waiting to hear back from your vendor manager?</h2>
            <p>
              These come straight from what vendors email Amazon and then wait days on. HENRY
              answers {TOTAL_QUESTIONS} of them right away, using Amazon&apos;s own published
              guidance and a live search to check it&apos;s current.
            </p>
            <Link href="/app" className="l-btn dark">
              Ask HENRY instead
            </Link>
          </div>
          <div className="l-inbox" role="list">
            <div className="l-inbox-bar">
              <span>Sent</span>
              <span>{INBOX.length} awaiting reply</span>
            </div>
            {INBOX.map((m) => (
              <div key={m.subject} className="l-inbox-row" role="listitem">
                <span className="l-inbox-to">To: Vendor Manager</span>
                <span className="l-inbox-subj">{m.subject}</span>
                <span className="l-inbox-wait">{m.waiting}, no reply</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="l-cta">
        <h2>Got a catalog? Paste some ASINs and see what turns up</h2>
        <Link href="/app" className="l-btn">
          Open HENRY
        </Link>
        <p className="l-cta-steps">There&apos;s nothing to install, and your data stays in your browser.</p>
      </section>

      <footer className="l-footer">
        <div className="l-footer-inner">
          <div className="l-footer-brand">
            <BoxMark size={18} />
            <span>
              HENRY, your local fulfillment center
              <small>Helpful Expert, Navigating Retail Yield</small>
            </span>
          </div>
          <p className="l-footer-disclaimer">
            An independent project built from Amazon&apos;s public seller and vendor documentation,
            using Claude with web search. Not affiliated with or endorsed by Amazon, and no
            confidential data is used.
          </p>
        </div>
      </footer>
    </div>
  );
}
