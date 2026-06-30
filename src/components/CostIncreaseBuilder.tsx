"use client";

import { useMemo, useState } from "react";
import { IconSparkles, IconCopy, IconCheck } from "@tabler/icons-react";
import Markdown from "./Markdown";
import { streamPost } from "@/lib/clientStream";

interface CostLine {
  label: string;
  current: number;
  next: number;
}

const INITIAL: CostLine[] = [
  { label: "Materials", current: 0, next: 0 },
  { label: "Labor", current: 0, next: 0 },
  { label: "Freight & duty", current: 0, next: 0 },
  { label: "Tariffs", current: 0, next: 0 },
  { label: "Overhead", current: 0, next: 0 },
];

const SAMPLE: CostLine[] = [
  { label: "Materials", current: 3.2, next: 3.9 },
  { label: "Labor", current: 1.1, next: 1.25 },
  { label: "Freight & duty", current: 0.6, next: 0.85 },
  { label: "Tariffs", current: 0.2, next: 0.6 },
  { label: "Overhead", current: 0.4, next: 0.45 },
];

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

export default function CostIncreaseBuilder({ onAsk }: { onAsk: (q: string) => void }) {
  const [product, setProduct] = useState("");
  const [lines, setLines] = useState<CostLine[]>(INITIAL);
  const [wholesale, setWholesale] = useState(0);
  const [retail, setRetail] = useState(0);
  const [externalRaised, setExternalRaised] = useState(false);
  const [docsReady, setDocsReady] = useState(false);
  const [goodTiming, setGoodTiming] = useState(false);
  const [letter, setLetter] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  function setLine(i: number, key: "current" | "next", v: string) {
    setLines((p) => p.map((l, j) => (j === i ? { ...l, [key]: parseFloat(v) || 0 } : l)));
  }

  const calc = useMemo(() => {
    const currentCOGS = lines.reduce((s, l) => s + l.current, 0);
    const newCOGS = lines.reduce((s, l) => s + l.next, 0);
    const cogsDelta = newCOGS - currentCOGS;
    const suggestedWholesale = wholesale + cogsDelta;
    const askPct = wholesale > 0 ? (cogsDelta / wholesale) * 100 : 0;
    const marginNow = wholesale > 0 ? ((wholesale - currentCOGS) / wholesale) * 100 : 0;
    const marginIfUnapproved = wholesale > 0 ? ((wholesale - newCOGS) / wholesale) * 100 : 0;
    const amazonMarginNow = retail > 0 ? ((retail - wholesale) / retail) * 100 : null;
    const amazonMarginAfter = retail > 0 ? ((retail - suggestedWholesale) / retail) * 100 : null;

    // Likelihood-to-approve heuristic
    let score = 10;
    if (askPct < 5) score += 30;
    else if (askPct < 10) score += 22;
    else if (askPct < 20) score += 12;
    else score += 3;
    if (externalRaised) score += 20;
    if (docsReady) score += 15;
    if (goodTiming) score += 15;
    if (amazonMarginAfter === null) score += 8;
    else if (amazonMarginAfter >= 15) score += 20;
    else if (amazonMarginAfter >= 8) score += 10;
    score = Math.max(5, Math.min(95, score));

    const tier = score >= 70 ? "high" : score >= 45 ? "medium" : "low";

    let angle: string;
    if (amazonMarginAfter !== null && amazonMarginAfter >= 12) {
      angle = `Frame it around Amazon's profit: even at the new cost, Amazon keeps roughly ${amazonMarginAfter.toFixed(0)}% retail margin — the increase doesn't threaten its economics.`;
    } else if (!externalRaised) {
      angle = "Raise your price on other channels first — Amazon benchmarks external pricing, and a higher street price is your single strongest lever before submitting.";
    } else if (askPct >= 20) {
      angle = "A 20%+ ask rarely clears in one pass. Consider phasing the increase, or pair it with a cost-savings program (Direct Import / Vendor Flex) to offset Amazon's economics.";
    } else {
      angle = "Lead with the documented input-cost drivers and tie the request to keeping the item sustainable to supply — frame it as protecting Amazon's in-stock position, not just your margin.";
    }

    return { currentCOGS, newCOGS, cogsDelta, suggestedWholesale, askPct, marginNow, marginIfUnapproved, amazonMarginNow, amazonMarginAfter, score, tier, angle };
  }, [lines, wholesale, retail, externalRaised, docsReady, goodTiming]);

  async function draft() {
    setDrafting(true);
    setLetter("");
    setCopied(false);
    const increased = lines.filter((l) => l.next > l.current).map((l) => `${l.label} ${usd(l.current)}→${usd(l.next)}`).join(", ");
    try {
      await streamPost(
        "/api/generate",
        {
          task: "cost-increase",
          input: {
            product: product || "(unspecified)",
            current: `$${wholesale.toFixed(2)} wholesale / $${calc.currentCOGS.toFixed(2)} landed COGS`,
            requested: `$${calc.suggestedWholesale.toFixed(2)} (+${calc.askPct.toFixed(1)}%)`,
            reason: `Landed COGS rose from $${calc.currentCOGS.toFixed(2)} to $${calc.newCOGS.toFixed(2)}. Drivers: ${increased || "input costs"}. Without relief, our margin on this item compresses from ${calc.marginNow.toFixed(1)}% to ${calc.marginIfUnapproved.toFixed(1)}%.`,
            evidence: [externalRaised && "Higher price already live on other channels", docsReady && "Supplier invoices / tariff & freight documentation ready", retail > 0 && `Amazon retains ~${calc.amazonMarginAfter?.toFixed(0)}% retail margin after the increase`].filter(Boolean).join("; "),
          },
        },
        setLetter
      );
    } catch (e) {
      setLetter(`Couldn't draft: ${(e as Error).message}`);
    } finally {
      setDrafting(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div>
      <label className="gen-field" style={{ maxWidth: 420, marginBottom: 18 }}>
        <span>Product / ASIN</span>
        <input type="text" placeholder="B08N5WRWNW — Coconut oil 16oz" value={product} onChange={(e) => setProduct(e.target.value)} />
      </label>

      <h3 className="cb-h" style={{ marginTop: 0 }}>Landed COGS breakdown ($/unit)</h3>
      <div className="cib-cogs">
        <div className="cib-cogs-head"><span>Component</span><span>Current</span><span>New</span><span>Change</span></div>
        {lines.map((l, i) => (
          <div key={l.label} className="cib-cogs-row">
            <span className="cib-comp">{l.label}</span>
            <input className="pnl-in" type="number" value={l.current} onChange={(e) => setLine(i, "current", e.target.value)} />
            <input className="pnl-in" type="number" value={l.next} onChange={(e) => setLine(i, "next", e.target.value)} />
            <span className={`cib-delta ${l.next > l.current ? "up" : ""}`}>{l.next - l.current > 0 ? "+" : ""}{usd(l.next - l.current)}</span>
          </div>
        ))}
        <div className="cib-cogs-row cib-total">
          <span className="cib-comp">Total landed COGS</span>
          <span>{usd(calc.currentCOGS)}</span>
          <span>{usd(calc.newCOGS)}</span>
          <span className={`cib-delta ${calc.cogsDelta > 0 ? "up" : ""}`}>{calc.cogsDelta > 0 ? "+" : ""}{usd(calc.cogsDelta)}</span>
        </div>
      </div>
      <button className="ghost" style={{ marginTop: 10 }} onClick={() => setLines(SAMPLE)}>Load sample costs</button>

      <h3 className="cb-h">Your pricing</h3>
      <div className="row">
        <label className="gen-field" style={{ maxWidth: 220 }}>
          <span>Current wholesale ($/unit Amazon pays)</span>
          <input type="number" value={wholesale} onChange={(e) => setWholesale(parseFloat(e.target.value) || 0)} />
        </label>
        <label className="gen-field" style={{ maxWidth: 220 }}>
          <span>Amazon retail price (optional)</span>
          <input type="number" value={retail} onChange={(e) => setRetail(parseFloat(e.target.value) || 0)} />
        </label>
      </div>

      <div className="statgrid" style={{ marginTop: 18 }}>
        <div className="statcard">
          <div className="lbl">Suggested new wholesale</div>
          <div className="num">{usd(calc.suggestedWholesale)}</div>
        </div>
        <div className="statcard warn">
          <div className="lbl">The ask</div>
          <div className="num">+{calc.askPct.toFixed(1)}%</div>
        </div>
        <div className="statcard bad">
          <div className="lbl">Your margin if rejected</div>
          <div className="num">{calc.marginIfUnapproved.toFixed(1)}%</div>
        </div>
        {calc.amazonMarginAfter !== null && (
          <div className="statcard teal">
            <div className="lbl">Amazon margin after</div>
            <div className="num">{calc.amazonMarginAfter.toFixed(0)}%</div>
          </div>
        )}
      </div>
      {wholesale > 0 && (
        <p className="footnote">
          Without relief, your margin on this item drops from {calc.marginNow.toFixed(1)}% to{" "}
          {calc.marginIfUnapproved.toFixed(1)}% — that compression is your strongest justification.
        </p>
      )}

      <h3 className="cb-h">Strengthen the case</h3>
      <div className="cib-factors">
        <button className={`cib-factor ${externalRaised ? "on" : ""}`} onClick={() => setExternalRaised((v) => !v)}>
          {externalRaised ? "✓ " : ""}Raised price on other channels first
        </button>
        <button className={`cib-factor ${docsReady ? "on" : ""}`} onClick={() => setDocsReady((v) => !v)}>
          {docsReady ? "✓ " : ""}Supplier invoices / tariff docs ready
        </button>
        <button className={`cib-factor ${goodTiming ? "on" : ""}`} onClick={() => setGoodTiming((v) => !v)}>
          {goodTiming ? "✓ " : ""}Submitting during AVN / cost window
        </button>
      </div>

      <div className="cib-likelihood">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Likelihood to approve</span>
          <span className={`cib-tier cib-${calc.tier}`}>{calc.tier === "high" ? "High" : calc.tier === "medium" ? "Medium" : "Low"} · {calc.score}/100</span>
        </div>
        <div className="cib-meter"><div className={`cib-meter-fill cib-${calc.tier}-bg`} style={{ width: `${calc.score}%` }} /></div>
        <p className="cib-angle"><strong>Suggested angle:</strong> {calc.angle}</p>
      </div>

      <div className="row" style={{ marginTop: 16 }}>
        <button className="primary" onClick={draft} disabled={drafting || wholesale <= 0}>
          <IconSparkles size={15} stroke={2} />
          {drafting ? "Drafting…" : "Draft the request with HENRY"}
        </button>
        <button
          className="ghost"
          onClick={() => onAsk(`I need to raise my wholesale cost on ${product || "an ASIN"} by ${calc.askPct.toFixed(1)}% because landed COGS rose from $${calc.currentCOGS.toFixed(2)} to $${calc.newCOGS.toFixed(2)}. How do I get Amazon to approve it?`)}
        >
          Ask HENRY for strategy
        </button>
      </div>

      {drafting && !letter && <div className="generated"><div className="loading-state"><span className="spinner" />HENRY is drafting…</div></div>}
      {letter && (
        <div className="generated" style={{ marginTop: 16 }}>
          <div className="row end" style={{ marginBottom: 8 }}>
            <button className="ghost" onClick={copy}>
              {copied ? <IconCheck size={15} stroke={2} /> : <IconCopy size={15} stroke={2} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <Markdown text={letter} />
        </div>
      )}
    </div>
  );
}
