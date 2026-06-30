"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  IconUpload,
  IconFileText,
  IconAlertTriangle,
  IconScale,
  IconCopy,
  IconCheck,
  IconDownload,
  IconRefresh,
  IconChevronDown,
  IconSparkles,
  IconPlugConnected,
} from "@tabler/icons-react";
import {
  mapRows,
  analyze,
  ROOT_CAUSES,
  SAMPLE_CSV,
  type Chargeback,
  type Analysis,
} from "@/lib/chargebacks";
import Markdown from "./Markdown";
import { streamPost } from "@/lib/clientStream";

const LS_ROWS = "henry.cb.rows";
const LS_INVOICE = "henry.cb.invoice";

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function Chargebacks({ onAsk, onConnect }: { onAsk: (q: string) => void; onConnect?: () => void }) {
  const [rows, setRows] = useState<Chargeback[]>([]);
  const [invoiceValue, setInvoiceValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const r = localStorage.getItem(LS_ROWS);
      if (r) setRows(JSON.parse(r));
      const iv = localStorage.getItem(LS_INVOICE);
      if (iv) setInvoiceValue(iv);
    } catch {
      /* ignore */
    }
  }, []);

  function persist(next: Chargeback[]) {
    setRows(next);
    try {
      localStorage.setItem(LS_ROWS, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function ingest(csv: string) {
    setError(null);
    setWarning(null);
    const parsed = Papa.parse<Record<string, string>>(csv.trim(), {
      header: true,
      skipEmptyLines: true,
    });
    if (!parsed.data.length) {
      setError("Couldn't read any rows from that file. Check it's a CSV with a header row.");
      return;
    }
    const { rows: mapped, missing } = mapRows(parsed.data);
    if (!mapped.length) {
      setError("No chargebacks found. Expected at least a reason and an amount column.");
      return;
    }
    if (missing.length) {
      setWarning(
        `Heads up — couldn't confidently find ${missing.join(" and ")} column(s); results may be incomplete.`
      );
    }
    persist(mapped);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => ingest(String(reader.result));
    reader.readAsText(file);
  }

  function reset() {
    persist([]);
    try {
      localStorage.removeItem(LS_ROWS);
    } catch {
      /* ignore */
    }
  }

  const analysis: Analysis | null = useMemo(() => (rows.length ? analyze(rows) : null), [rows]);
  const invoiceNum = parseFloat(invoiceValue.replace(/[^0-9.]/g, ""));
  const pctOfInvoice = analysis && invoiceNum > 0 ? (analysis.totalAmount / invoiceNum) * 100 : null;

  function exportCsv() {
    if (!rows.length) return;
    const head = ["Date", "Reason", "Root cause", "Disputable", "Amount", "Order ID", "ASIN", "Qty", "Status", "Suggested fix"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [r.date, r.reasonRaw, ROOT_CAUSES[r.cause].label, ROOT_CAUSES[r.cause].disputable ? "yes" : "no",
       r.amount, r.orderId, r.asin, r.quantity, r.status, ROOT_CAUSES[r.cause].fix].map(esc).join(",")
    );
    const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `henry-chargeback-forensics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="page-head">
        <div className="head-row">
          <h1>Chargeback forensics</h1>
          {onConnect && (
            <button className="connect-btn" onClick={onConnect}>
              <IconPlugConnected size={15} stroke={1.8} />
              Connect Vendor Central
              <span className="soon-tag">soon</span>
            </button>
          )}
        </div>
        <p>
          Upload your Vendor Central chargeback export. HENRY classifies every deduction by root
          cause, flags patterns, shows what&apos;s disputable, and drafts the dispute — so you can stop
          the 3%+ that leaks out invisibly.
        </p>
      </div>

      {!analysis ? (
        <div className="upload-zone">
          <div className="upload-inner" onClick={() => fileRef.current?.click()}>
            <IconUpload size={30} stroke={1.5} />
            <div className="uz-title">Upload your chargeback report</div>
            <div className="uz-sub">Drop or choose a Vendor Central CSV export</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={onFile} />
          <div className="row" style={{ marginTop: 14, justifyContent: "center" }}>
            <button className="ghost" onClick={() => ingest(SAMPLE_CSV)}>
              <IconFileText size={15} stroke={2} />
              Load sample report
            </button>
          </div>
          {error && <div className="err" style={{ textAlign: "center" }}>{error}</div>}
        </div>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 4 }}>
            <label className="gen-field" style={{ maxWidth: 260 }}>
              <span>Invoice value this period (optional, for %)</span>
              <input
                type="text"
                placeholder="$250,000"
                value={invoiceValue}
                onChange={(e) => {
                  setInvoiceValue(e.target.value);
                  try { localStorage.setItem(LS_INVOICE, e.target.value); } catch { /* ignore */ }
                }}
              />
            </label>
            <div className="spacer" />
            <button className="ghost" onClick={exportCsv}><IconDownload size={15} stroke={2} />Export</button>
            <button className="ghost" onClick={reset}><IconRefresh size={15} stroke={2} />New report</button>
          </div>

          {warning && <div className="err" style={{ color: "var(--yellow)" }}>{warning}</div>}

          <div className="statgrid">
            <div className="statcard">
              <div className="lbl"><IconScale size={14} stroke={1.8} />Chargebacks</div>
              <div className="num">{analysis.count}</div>
            </div>
            <div className="statcard bad">
              <div className="lbl"><IconAlertTriangle size={14} stroke={1.8} />Total leaked</div>
              <div className="num">{money(analysis.totalAmount)}</div>
            </div>
            {pctOfInvoice !== null && (
              <div className={`statcard ${pctOfInvoice >= 3 ? "bad" : "teal"}`}>
                <div className="lbl"><IconAlertTriangle size={14} stroke={1.8} />% of invoice</div>
                <div className="num">{pctOfInvoice.toFixed(1)}%</div>
              </div>
            )}
            <div className="statcard teal">
              <div className="lbl"><IconScale size={14} stroke={1.8} />Disputable</div>
              <div className="num">{money(analysis.disputableAmount)}</div>
            </div>
          </div>

          <h3 className="cb-h">Breakdown by root cause</h3>
          <div className="cb-bars">
            {analysis.byCause.map((c) => (
              <div key={c.cause} className="cb-bar-row">
                <div className="cb-bar-label">{ROOT_CAUSES[c.cause].label}</div>
                <div className="cb-bar-track">
                  <div className="cb-bar-fill" style={{ width: `${Math.max(c.pct, 3)}%` }} />
                </div>
                <div className="cb-bar-val">{money(c.amount)} · {c.count}</div>
              </div>
            ))}
          </div>

          {analysis.redFlags.length > 0 && (
            <>
              <h3 className="cb-h">Red-flag patterns</h3>
              <div className="cb-flags">
                {analysis.redFlags.map((f, i) => (
                  <div key={i} className="cb-flag"><IconAlertTriangle size={16} stroke={2} />{f.text}</div>
                ))}
              </div>
            </>
          )}

          <h3 className="cb-h">Every chargeback</h3>
          <div className="cb-list">
            {rows.map((r) => (
              <ChargebackRow key={r.id} cb={r} onAsk={onAsk} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChargebackRow({ cb, onAsk }: { cb: Chargeback; onAsk: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const [letter, setLetter] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const info = ROOT_CAUSES[cb.cause];

  async function draft() {
    setDrafting(true);
    setLetter("");
    try {
      await streamPost(
        "/api/generate",
        {
          task: "chargeback",
          input: {
            type: info.label,
            reference: cb.orderId,
            marketplace: "amazon.com",
            details: `${cb.reasonRaw}. Quantity ${cb.quantity}, amount $${cb.amount}. We dispute this deduction.`,
            evidence: info.evidence.join(", "),
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
    <div className={`cb-item ${open ? "open" : ""}`}>
      <button className="cb-item-head" onClick={() => setOpen((o) => !o)}>
        <span className={`tag ${info.disputable ? "third" : "none"}`}>{info.label}</span>
        <span className="cb-reason">{cb.reasonRaw}</span>
        <span className="cb-amt">${cb.amount.toFixed(2)}</span>
        <IconChevronDown size={16} stroke={2} className="cb-chev" />
      </button>

      {open && (
        <div className="cb-detail">
          <div className="cb-meta-row">
            {cb.orderId && <span className="muted">PO {cb.orderId}</span>}
            {cb.asin && <span className="muted">ASIN {cb.asin}</span>}
            {cb.quantity > 0 && <span className="muted">{cb.quantity} units</span>}
            <span className="muted">{cb.status}</span>
          </div>

          <p className="cb-fix"><strong>Fix:</strong> {info.fix}</p>

          {info.disputable ? (
            <>
              <p className="cb-fix"><strong>Evidence to gather:</strong></p>
              <ul className="cb-evidence">
                {info.evidence.map((e) => <li key={e}>{e}</li>)}
              </ul>
              <div className="row">
                <button className="primary" onClick={draft} disabled={drafting}>
                  <IconSparkles size={15} stroke={2} />
                  {drafting ? "Drafting…" : "Draft dispute letter with HENRY"}
                </button>
                <button
                  className="ghost"
                  onClick={() => onAsk(`I got a "${info.label}" chargeback (${cb.reasonRaw}) on PO ${cb.orderId || "—"} for $${cb.amount}. How do I prevent this going forward?`)}
                >
                  Ask HENRY how to prevent it
                </button>
              </div>
            </>
          ) : (
            <div className="row">
              <button
                className="ghost"
                onClick={() => onAsk(`I got this Amazon chargeback: "${cb.reasonRaw}" for $${cb.amount}. What is it and what should I do?`)}
              >
                Ask HENRY about this
              </button>
            </div>
          )}

          {drafting && !letter && <div className="loading-state"><span className="spinner" />HENRY is drafting…</div>}
          {letter && (
            <div className="generated" style={{ marginTop: 14 }}>
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
      )}
    </div>
  );
}
