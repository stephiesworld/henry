"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  IconReportMoney,
  IconCoin,
  IconPercentage,
  IconAlertTriangle,
  IconDownload,
  IconUpload,
  IconPlus,
  IconTrash,
  IconX,
  IconFileText,
  IconPlugConnected,
} from "@tabler/icons-react";
import {
  computePortfolio,
  computeRow,
  mapPnlRows,
  STATUS_LABEL,
  newId,
  NO_ADJUST,
  SAMPLE_SKUS,
  type SkuInput,
  type Adjustments,
} from "@/lib/profitability";

const LS = "henry.pnl.rows";
const LS_BENCH = "henry.pnl.benchmark";

const usd = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const usd2 = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;

const EDITABLE: { key: keyof SkuInput; label: string; w: number }[] = [
  { key: "units", label: "Units/mo", w: 78 },
  { key: "wholesale", label: "Wholesale", w: 86 },
  { key: "cogs", label: "COGS", w: 74 },
  { key: "coopPct", label: "Co-op %", w: 72 },
  { key: "freight", label: "Freight", w: 74 },
  { key: "chargebacks", label: "Chargeb.", w: 78 },
  { key: "returns", label: "Returns", w: 74 },
  { key: "ads", label: "Ads", w: 64 },
];

export default function Profitability({ onAsk, onConnect }: { onAsk: (q: string) => void; onConnect?: () => void }) {
  const [rows, setRows] = useState<SkuInput[]>([]);
  const [benchmark, setBenchmark] = useState(18);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adj, setAdj] = useState<Adjustments>(NO_ADJUST);
  const [importNote, setImportNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const r = localStorage.getItem(LS);
      if (r) setRows(JSON.parse(r));
      const b = localStorage.getItem(LS_BENCH);
      if (b) setBenchmark(parseFloat(b));
    } catch {
      /* ignore */
    }
  }, []);

  function persist(next: SkuInput[]) {
    setRows(next);
    try {
      localStorage.setItem(LS, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function update(id: string, key: keyof SkuInput, value: string) {
    persist(
      rows.map((r) =>
        r.id === id ? { ...r, [key]: key === "asin" || key === "title" ? value : parseFloat(value) || 0 } : r
      )
    );
  }
  function addRow() {
    persist([...rows, { id: newId(), asin: "", title: "New product", units: 0, wholesale: 0, cogs: 0, coopPct: 0, freight: 0, chargebacks: 0, returns: 0, ads: 0 }]);
  }
  function removeRow(id: string) {
    persist(rows.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportNote(null);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = Papa.parse<Record<string, string>>(String(reader.result).trim(), {
        header: true,
        skipEmptyLines: true,
      });
      const mapped = mapPnlRows(parsed.data);
      if (!mapped.length) {
        setImportNote("Couldn't read SKUs — need at least a wholesale price and COGS column.");
        return;
      }
      persist([...rows, ...mapped]);
      setImportNote(`Imported ${mapped.length} SKU${mapped.length > 1 ? "s" : ""}.`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const portfolio = useMemo(() => computePortfolio(rows), [rows]);
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const selBase = selected ? computeRow(selected) : null;
  const selAdj = selected ? computeRow(selected, adj) : null;

  function exportCsv() {
    const head = ["ASIN", "Title", "Units/mo", "Wholesale", "COGS", "Co-op %", "Freight", "Chargebacks", "Returns", "Ads", "Net PPM", "Margin %", "Monthly contribution", "Status"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = portfolio.rows.map((r) =>
      [r.asin, r.title, r.units, r.wholesale, r.cogs, r.coopPct, r.freight, r.chargebacks, r.returns, r.ads,
       r.netPPM.toFixed(2), r.marginPct.toFixed(1), r.monthlyContribution.toFixed(0), STATUS_LABEL[r.status]].map(esc).join(",")
    );
    const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `henry-net-ppm-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="page-head">
        <div className="head-row">
          <h1>Profitability — net PPM by ASIN</h1>
          {onConnect && (
            <button className="connect-btn" onClick={onConnect}>
              <IconPlugConnected size={15} stroke={1.8} />
              Connect Vendor Central
              <span className="soon-tag">soon</span>
            </button>
          )}
        </div>
        <p>
          What you <em>actually</em> earn per unit after every Amazon deduction — co-op, freight,
          chargebacks, returns, and ads. Vendor Central hides this; HENRY makes it the headline. Edit
          the numbers inline, or load a sample to explore.
        </p>
      </div>

      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={onFile} />

      {rows.length === 0 ? (
        <div className="upload-zone">
          <div className="upload-inner" style={{ cursor: "default" }}>
            <IconReportMoney size={30} stroke={1.5} />
            <div className="uz-title">No SKUs yet</div>
            <div className="uz-sub">Add your products, or load a sample portfolio to explore.</div>
            <div className="row" style={{ marginTop: 16, justifyContent: "center" }}>
              <button className="primary" onClick={() => persist(SAMPLE_SKUS)}>
                <IconFileText size={15} stroke={2} />
                Load sample portfolio
              </button>
              <button className="ghost" onClick={() => fileRef.current?.click()}>
                <IconUpload size={15} stroke={2} />
                Upload CSV
              </button>
              <button className="ghost" onClick={addRow}>
                <IconPlus size={15} stroke={2} />
                Add a SKU
              </button>
            </div>
            {importNote && <div className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>{importNote}</div>}
          </div>
        </div>
      ) : (
        <>
          <div className="statgrid">
            <div className="statcard">
              <div className="lbl"><IconCoin size={14} stroke={1.8} />Monthly revenue</div>
              <div className="num">{usd(portfolio.totalRevenue)}</div>
            </div>
            <div className={`statcard ${portfolio.totalContribution < 0 ? "bad" : "teal"}`}>
              <div className="lbl"><IconReportMoney size={14} stroke={1.8} />Net contribution</div>
              <div className="num">{usd(portfolio.totalContribution)}</div>
            </div>
            <div className={`statcard ${portfolio.blendedMarginPct < benchmark ? "warn" : "teal"}`}>
              <div className="lbl"><IconPercentage size={14} stroke={1.8} />Blended margin</div>
              <div className="num">{portfolio.blendedMarginPct.toFixed(1)}%</div>
            </div>
            <div className={`statcard ${portfolio.lossCount > 0 ? "bad" : ""}`}>
              <div className="lbl"><IconAlertTriangle size={14} stroke={1.8} />Losing SKUs</div>
              <div className="num">{portfolio.lossCount}</div>
            </div>
          </div>

          <div className="bench-note">
            Blended net margin <strong style={{ color: portfolio.blendedMarginPct < benchmark ? "var(--yellow)" : "var(--teal)" }}>
              {portfolio.blendedMarginPct.toFixed(1)}%
            </strong>{" "}
            vs. category benchmark of{" "}
            <input
              type="number"
              value={benchmark}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setBenchmark(v);
                try { localStorage.setItem(LS_BENCH, String(v)); } catch { /* ignore */ }
              }}
              style={{ width: 56, display: "inline-block", padding: "4px 8px" }}
            />
            %{" "}
            {portfolio.blendedMarginPct < benchmark
              ? `— you're ${(benchmark - portfolio.blendedMarginPct).toFixed(1)} pts below.`
              : "— you're at or above it."}
          </div>

          {portfolio.foolsGoldCount > 0 && (
            <div className="cb-flag" style={{ marginTop: 14 }}>
              <IconAlertTriangle size={16} stroke={2} />
              {portfolio.foolsGoldCount} &ldquo;Fool&apos;s Gold&rdquo; ASIN{portfolio.foolsGoldCount > 1 ? "s" : ""} — high
              revenue but margin under 5%. High volume is hiding thin profit; these are the ones to
              re-price, re-SKU, or move to 3P.
            </div>
          )}

          <div className="row" style={{ margin: "18px 0 0" }}>
            <button className="ghost" onClick={addRow}><IconPlus size={15} stroke={2} />Add SKU</button>
            <button className="ghost" onClick={() => fileRef.current?.click()}><IconUpload size={15} stroke={2} />Upload CSV</button>
            <div className="spacer" />
            <button className="ghost" onClick={exportCsv}><IconDownload size={15} stroke={2} />Export</button>
          </div>
          {importNote && <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>{importNote}</div>}

          <div className="table-wrap">
            <table className="pnl-table">
              <thead>
                <tr>
                  <th>ASIN</th>
                  {EDITABLE.map((c) => <th key={c.key} style={{ textAlign: "right" }}>{c.label}</th>)}
                  <th style={{ textAlign: "right" }}>Net PPM</th>
                  <th style={{ textAlign: "right" }}>Margin</th>
                  <th style={{ textAlign: "right" }}>Contribution</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {portfolio.rows.map((r) => (
                  <tr key={r.id} className={selectedId === r.id ? "pnl-sel" : ""} onClick={() => { setSelectedId(r.id); setAdj(NO_ADJUST); }}>
                    <td>
                      <input className="pnl-in pnl-asin" value={r.asin} placeholder="ASIN" onClick={(e) => e.stopPropagation()} onChange={(e) => update(r.id, "asin", e.target.value)} />
                    </td>
                    {EDITABLE.map((c) => (
                      <td key={c.key} style={{ textAlign: "right" }}>
                        <input
                          className="pnl-in"
                          type="number"
                          value={r[c.key] as number}
                          style={{ width: c.w }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => update(r.id, c.key, e.target.value)}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: "right" }} className={r.netPPM <= 0 ? "var-hi" : ""}>{usd2(r.netPPM)}</td>
                    <td style={{ textAlign: "right" }} className={r.netPPM <= 0 ? "var-hi" : ""}>{r.marginPct.toFixed(1)}%</td>
                    <td style={{ textAlign: "right" }}>{usd(r.monthlyContribution)}</td>
                    <td><span className={`tag pnl-${r.status}`}>{r.foolsGold ? "Fool's Gold" : STATUS_LABEL[r.status]}</span></td>
                    <td>
                      <button className="pnl-del" onClick={(e) => { e.stopPropagation(); removeRow(r.id); }} aria-label="Remove"><IconTrash size={14} stroke={2} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="footnote">
            Net PPM = wholesale − COGS − co-op − freight − chargebacks − returns − ads (all per unit).
            All values editable; everything saves in your browser. Click a row for its margin waterfall
            and a what-if simulator.
          </p>

          {selected && selBase && selAdj && (
            <div className="pnl-panel">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{selected.title || selected.asin || "SKU"} — margin waterfall</h3>
                <button className="pnl-del" onClick={() => setSelectedId(null)} aria-label="Close"><IconX size={16} stroke={2} /></button>
              </div>

              <div className="waterfall">
                {[
                  { label: "Wholesale price", val: selBase.wholesale, kind: "in" },
                  { label: "COGS", val: -selBase.cogs, kind: "out" },
                  { label: "Co-op / allowances", val: -selBase.coopDollar, kind: "out" },
                  { label: "Freight / inbound", val: -selBase.freight, kind: "out" },
                  { label: "Chargebacks", val: -selBase.chargebacks, kind: "out" },
                  { label: "Returns / damages", val: -selBase.returns, kind: "out" },
                  { label: "Advertising", val: -selBase.ads, kind: "out" },
                  { label: "Net PPM", val: selBase.netPPM, kind: "net" },
                ].map((s) => (
                  <div key={s.label} className="wf-row">
                    <div className="wf-label">{s.label}</div>
                    <div className="wf-track">
                      <div
                        className={`wf-fill wf-${s.kind}`}
                        style={{ width: `${Math.min(100, (Math.abs(s.val) / (selBase.wholesale || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className={`wf-val ${s.kind === "out" ? "wf-neg" : ""}`}>{s.kind === "out" ? "−" : ""}{usd2(Math.abs(s.val))}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: 15, margin: "20px 0 4px" }}>What-if simulator</h3>
              <div className="whatif">
                <WhatIfSlider label="Wholesale price" suffix="%" min={-20} max={30} value={adj.wholesalePct} onChange={(v) => setAdj({ ...adj, wholesalePct: v })} />
                <WhatIfSlider label="COGS" suffix="%" min={-30} max={20} value={adj.cogsPct} onChange={(v) => setAdj({ ...adj, cogsPct: v })} />
                <WhatIfSlider label="Co-op" suffix=" pts" min={-12} max={6} value={adj.coopPts} onChange={(v) => setAdj({ ...adj, coopPts: v })} />
                <WhatIfSlider label="Chargebacks" suffix="%" min={-100} max={50} value={adj.chargebacksPct} onChange={(v) => setAdj({ ...adj, chargebacksPct: v })} />
              </div>
              <div className="whatif-result">
                <div>
                  <span className="muted" style={{ fontSize: 12 }}>Net PPM</span>
                  <div className="wf-before">{usd2(selBase.netPPM)} → <span className={selAdj.netPPM >= selBase.netPPM ? "wf-up" : "wf-down"}>{usd2(selAdj.netPPM)}</span></div>
                </div>
                <div>
                  <span className="muted" style={{ fontSize: 12 }}>Margin</span>
                  <div className="wf-before">{selBase.marginPct.toFixed(1)}% → <span className={selAdj.marginPct >= selBase.marginPct ? "wf-up" : "wf-down"}>{selAdj.marginPct.toFixed(1)}%</span></div>
                </div>
                <div>
                  <span className="muted" style={{ fontSize: 12 }}>Monthly contribution</span>
                  <div className="wf-before">{usd(selBase.monthlyContribution)} → <span className={selAdj.monthlyContribution >= selBase.monthlyContribution ? "wf-up" : "wf-down"}>{usd(selAdj.monthlyContribution)}</span></div>
                </div>
              </div>

              <div className="row" style={{ marginTop: 16 }}>
                <button
                  className="ghost"
                  onClick={() => onAsk(`My ASIN ${selected.asin || selected.title} has a net PPM of $${selBase.netPPM.toFixed(2)} (${selBase.marginPct.toFixed(1)}% margin) on 1P after co-op, chargebacks, and ads. How do I improve its profitability — and should it stay on 1P or move to 3P?`)}
                >
                  Ask HENRY how to fix this SKU
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WhatIfSlider({ label, suffix, min, max, value, onChange }: { label: string; suffix: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="whatif-row">
      <span className="whatif-label">{label}</span>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} />
      <span className="whatif-val">{value > 0 ? "+" : ""}{value}{suffix}</span>
    </label>
  );
}
