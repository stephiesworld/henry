"use client";

import { useState } from "react";
import { IconArrowLeft, IconCopy, IconCheck } from "@tabler/icons-react";
import Markdown from "./Markdown";
import { streamPost } from "@/lib/clientStream";
import CostIncreaseBuilder from "./CostIncreaseBuilder";

type GenTask = "chargeback" | "optimize" | "cost-increase" | "decision";

type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
};

const FIELDS: Record<GenTask, Field[]> = {
  chargeback: [
    {
      name: "type",
      label: "Chargeback type",
      type: "select",
      options: [
        "PO on-time / fill-rate",
        "ASN accuracy",
        "Carton / labeling compliance",
        "Prep requirements",
        "Shortage claim",
        "Other / not sure",
      ],
    },
    { name: "reference", label: "PO / reference #", type: "text", placeholder: "e.g. 7AB12CD3" },
    { name: "marketplace", label: "Marketplace", type: "text", placeholder: "amazon.com" },
    {
      name: "details",
      label: "What happened (your side of the story)",
      type: "textarea",
      placeholder: "We shipped the full PO quantity on time; the deduction claims a shortage of 40 units…",
    },
    { name: "evidence", label: "Evidence you have", type: "textarea", placeholder: "Signed BOL, ASN, packing list, carrier delivery confirmation…" },
  ],
  optimize: [
    { name: "product", label: "Product", type: "text", placeholder: "32oz insulated stainless steel water bottle" },
    { name: "category", label: "Category", type: "text", placeholder: "Sports & Outdoors > Hydration" },
    { name: "features", label: "Key features / details", type: "textarea", placeholder: "Double-wall vacuum insulation, leakproof lid, BPA-free, keeps cold 24h…" },
    { name: "keywords", label: "Target keywords (optional)", type: "text", placeholder: "water bottle, thermos, gym" },
  ],
  "cost-increase": [
    { name: "product", label: "Product / ASIN", type: "text", placeholder: "B08N5WRWNW — Coconut oil 16oz" },
    { name: "current", label: "Current wholesale cost", type: "text", placeholder: "$8.40" },
    { name: "requested", label: "Requested new cost (or %)", type: "text", placeholder: "$9.20 (+9.5%)" },
    {
      name: "reason",
      label: "Reason for the increase",
      type: "textarea",
      placeholder: "Raw-material costs up 12%, new 25% tariff on imported components, freight increases…",
    },
    { name: "evidence", label: "Supporting evidence you have", type: "textarea", placeholder: "Supplier invoices, tariff notices, freight quotes, higher street price on other channels…" },
  ],
  decision: [
    { name: "product", label: "Product", type: "text", placeholder: "Memory foam pillow, queen" },
    {
      name: "current",
      label: "Current model",
      type: "select",
      options: ["Currently 1P (Vendor Central)", "Currently 3P (Seller Central)", "Not selling yet / deciding"],
    },
    { name: "volume", label: "Monthly volume / revenue", type: "text", placeholder: "~$40k/mo, 1,500 units" },
    { name: "margin", label: "Approx. margin / profitability", type: "text", placeholder: "Gross 35%, but net PPM thin after co-op" },
    { name: "goals", label: "Main goals or concerns", type: "textarea", placeholder: "Losing money after deductions; want price control; protect MAP…" },
  ],
};

const META: Record<GenTask, { title: string; lead: string; cta: string }> = {
  chargeback: {
    title: "Chargeback dispute writer",
    lead: "Describe the deduction and what you can prove. HENRY drafts the dispute narrative, maps your evidence to the chargeback type, and flags what's missing.",
    cta: "Draft my dispute",
  },
  optimize: {
    title: "Listing optimizer",
    lead: "Give HENRY the product and its features. You'll get a compliant, conversion-focused title, bullets, A+ content angles, and backend search terms.",
    cta: "Optimize my listing",
  },
  "cost-increase": {
    title: "Cost-increase request writer",
    lead: "Amazon auto-rejects most cost-increase requests. Give HENRY the details and it drafts a justification framed to survive the bot and win approval.",
    cta: "Draft my request",
  },
  decision: {
    title: "1P vs 3P decision analyzer",
    lead: "Describe the product and your numbers. HENRY weighs price control, economics, and effort, then recommends 1P, 3P, or hybrid — with the trade-offs.",
    cta: "Analyze my options",
  },
};

const TILES: { task: GenTask; num: string; audience: string; title: string; body: string }[] = [
  { task: "cost-increase", num: "01", audience: "1P", title: "Cost-increase request writer", body: "Draft a wholesale cost-increase justification built to survive Amazon's auto-rejection." },
  { task: "decision", num: "02", audience: "1P + 3P", title: "1P vs 3P decision analyzer", body: "Get a recommendation on whether a product belongs on Vendor Central, Seller Central, or both." },
  { task: "chargeback", num: "03", audience: "1P", title: "Chargeback dispute writer", body: "Enter the chargeback details and HENRY drafts a ready-to-submit dispute + evidence checklist." },
  { task: "optimize", num: "04", audience: "1P + 3P", title: "Listing optimizer", body: "Generate an optimized title, bullets, A+ angles, and backend keywords from your product." },
];

function GenTool({ task }: { task: GenTask }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fields = FIELDS[task];
  const cta = META[task].cta;

  const set = (name: string, v: string) => setValues((p) => ({ ...p, [name]: v }));

  async function run() {
    setLoading(true);
    setOut("");
    setCopied(false);
    try {
      await streamPost("/api/generate", { task, input: values }, setOut);
    } catch (e) {
      setOut(`Sorry — something went wrong: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }
  function copy() {
    navigator.clipboard.writeText(out).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const canRun = !!values[fields[0].name]?.trim() || task === "chargeback";

  return (
    <div>
      <div className="gen-form">
        {fields.map((f) => (
          <label key={f.name} className="gen-field">
            <span>{f.label}</span>
            {f.type === "textarea" ? (
              <textarea rows={3} placeholder={f.placeholder} value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />
            ) : f.type === "select" ? (
              <select value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">Select…</option>
                {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type="text" placeholder={f.placeholder} value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />
            )}
          </label>
        ))}
        <button className="primary" onClick={run} disabled={loading || !canRun}>
          {loading ? "Drafting…" : cta}
        </button>
      </div>

      {loading && (
        <div className="generated">
          <div className="loading-state"><span className="spinner" />HENRY is drafting…</div>
        </div>
      )}
      {!loading && out && (
        <div className="generated">
          <div className="row end" style={{ marginBottom: 8 }}>
            <button className="ghost" onClick={copy}>
              {copied ? <IconCheck size={15} stroke={2} /> : <IconCopy size={15} stroke={2} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <Markdown text={out} />
        </div>
      )}
    </div>
  );
}

export default function Generators({ onAsk }: { onAsk: (q: string) => void }) {
  const [view, setView] = useState<GenTask | "menu">("menu");

  if (view === "menu") {
    return (
      <div>
        <div className="page-head">
          <p className="eyebrow">Drafting / 01</p>
          <h1>Generators</h1>
          <p>
            Put HENRY to work on the writing-heavy vendor tasks — cost-increase requests, 1P-vs-3P
            decisions, chargeback disputes, and listing optimization.
          </p>
        </div>
        <div className="card-grid two">
          {TILES.map((t) => (
            <div key={t.task} className="feature-tile" onClick={() => setView(t.task)}>
              <div className="tile-top">
                <span className="tile-num">{t.num}</span>
                <span className="pill">{t.audience}</span>
              </div>
              <h3>{t.title}</h3>
              <p>{t.body}</p>
              <span className="tile-link">Open →</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="ghost" onClick={() => setView("menu")}>
        <IconArrowLeft size={15} stroke={2} />
        Generators
      </button>
      <div className="page-head" style={{ marginTop: 14 }}>
        <h1>{META[view].title}</h1>
        <p>{META[view].lead}</p>
      </div>
      {view === "cost-increase" ? <CostIncreaseBuilder onAsk={onAsk} /> : <GenTool task={view} />}
    </div>
  );
}
