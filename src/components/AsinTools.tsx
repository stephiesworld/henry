"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconBox,
  IconAlertTriangle,
  IconUserX,
  IconActivity,
  IconDownload,
  IconPlus,
  IconPlug,
  IconSearch,
} from "@tabler/icons-react";
import type { AnalyzeResponse, AsinAnalysis } from "@/lib/types";

type Filter = "all" | "no-offer" | "not-amazon" | "high-variance";

const SAMPLE = "B08N5WRWNW\nB07FZ8S74R\nB09B8V1LZ3\nB08L5VG843\nB07PGL2N7J\nB09JQMJHXY";
const LS_INPUT = "henry.asin.input";
const LS_LISTS = "henry.asin.lists";
const LS_KEEPA = "henry.keepa.key";

function money(n: number | null): string {
  return n === null ? "—" : `$${n.toFixed(2)}`;
}

function toCsv(rows: AsinAnalysis[]): string {
  const head = [
    "ASIN", "Title", "Buy box winner", "Buy box type", "Has featured offer",
    "Current price", "30-day low", "60-day low", "30-day variance %", "High variance",
  ];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.asin, r.title ?? "", r.buyBoxWinner ?? "", r.buyBoxType, r.hasFeaturedOffer ? "yes" : "no",
     r.currentPrice ?? "", r.low30 ?? "", r.low60 ?? "", r.variance30Pct ?? "", r.highVariance ? "yes" : "no"]
      .map(esc).join(",")
  );
  return [head.map(esc).join(","), ...lines].join("\n");
}

export default function AsinTools() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [lists, setLists] = useState<Record<string, string>>({});
  const [keepaKey, setKeepaKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    try {
      const si = localStorage.getItem(LS_INPUT);
      if (si) setInput(si);
      const sl = localStorage.getItem(LS_LISTS);
      if (sl) setLists(JSON.parse(sl));
      const sk = localStorage.getItem(LS_KEEPA);
      if (sk) setKeepaKey(sk);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_INPUT, input);
    } catch {
      /* ignore */
    }
  }, [input]);

  function persistLists(next: Record<string, string>) {
    setLists(next);
    try {
      localStorage.setItem(LS_LISTS, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  function saveList() {
    if (!input.trim()) return;
    const name = window.prompt("Name this ASIN list (e.g. 'Hydration line'):");
    if (!name) return;
    persistLists({ ...lists, [name.trim()]: input.trim() });
  }
  function deleteList(name: string) {
    const next = { ...lists };
    delete next[name];
    persistLists(next);
  }
  function saveKey(v: string) {
    setKeepaKey(v);
    try {
      if (v.trim()) localStorage.setItem(LS_KEEPA, v.trim());
      else localStorage.removeItem(LS_KEEPA);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("henry:keepa-changed"));
  }
  function exportCsv() {
    if (!data) return;
    const blob = new Blob([toCsv(data.results)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `henry-asins-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function analyze() {
    setLoading(true);
    setError(null);
    setFilter("all");
    try {
      const res = await fetch("/api/asins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asins: input, keepaKey: keepaKey.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setData(json as AnalyzeResponse);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const results = data?.results ?? [];
  const counts = useMemo(
    () => ({
      total: results.length,
      noOffer: results.filter((r) => r.found && !r.hasFeaturedOffer).length,
      notAmazon: results.filter((r) => r.hasFeaturedOffer && r.buyBoxType !== "amazon").length,
      highVar: results.filter((r) => r.highVariance).length,
    }),
    [results]
  );
  const filtered = useMemo(() => {
    switch (filter) {
      case "no-offer":
        return results.filter((r) => r.found && !r.hasFeaturedOffer);
      case "not-amazon":
        return results.filter((r) => r.hasFeaturedOffer && r.buyBoxType !== "amazon");
      case "high-variance":
        return results.filter((r) => r.highVariance);
      default:
        return results;
    }
  }, [results, filter]);

  function buyBoxCell(r: AsinAnalysis) {
    if (!r.found) return <span className="muted">not found</span>;
    if (!r.hasFeaturedOffer) return <span className="tag none">no featured offer</span>;
    if (r.buyBoxType === "amazon") return <span className="tag amazon">Amazon</span>;
    return <span className="tag third">{r.buyBoxWinner}</span>;
  }

  return (
    <div>
      <div className="page-head">
        <h1>ASIN toolkit</h1>
        <p>
          Paste your ASINs (one per line, or comma-separated). HENRY pulls who&apos;s winning the buy
          box, which have no featured offers, the 30 / 60-day price lows, and flags anything with a
          price swing over &plusmn;5%.
        </p>
      </div>

      <textarea
        className="mono"
        rows={5}
        placeholder="B08N5WRWNW, B07FZ8S74R, ..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="row" style={{ marginTop: 12 }}>
        <button className="primary" onClick={analyze} disabled={loading || !input.trim()}>
          <IconSearch size={16} stroke={2} />
          {loading ? "Analyzing…" : "Analyze ASINs"}
        </button>
        <button className="ghost" onClick={() => setInput(SAMPLE)} disabled={loading}>
          Load sample
        </button>
        <button className="ghost" onClick={saveList} disabled={loading || !input.trim()}>
          <IconPlus size={15} stroke={2} />
          Save list
        </button>
        <button className="ghost" onClick={() => setShowKey((s) => !s)} disabled={loading}>
          <IconPlug size={15} stroke={2} />
          {keepaKey ? "Keepa connected" : "Connect Keepa"}
        </button>
        <div className="spacer" />
        {data && (
          <span className={`pill ${data.source === "keepa" ? "live" : "demo"}`}>
            {data.source === "keepa" ? (keepaKey ? "Live — your Keepa key" : "Live Keepa data") : "Demo data"}
          </span>
        )}
      </div>

      {Object.keys(lists).length > 0 && (
        <div className="saved-lists">
          <span className="muted" style={{ fontSize: 12 }}>Saved lists:</span>
          {Object.keys(lists).map((name) => (
            <span key={name} className="saved-chip">
              <button className="saved-load" onClick={() => setInput(lists[name])}>{name}</button>
              <button className="saved-del" onClick={() => deleteList(name)}>✕</button>
            </span>
          ))}
        </div>
      )}

      {showKey && (
        <div className="keepa-connect">
          <p className="muted" style={{ fontSize: 12.5, margin: "0 0 8px" }}>
            Paste your own <strong>Keepa API key</strong> for live pricing on your account&apos;s
            budget. Stored only in this browser, sent directly to Keepa — never saved on our server.
            Get one at{" "}
            <a href="https://keepa.com/#!api" target="_blank" rel="noreferrer">keepa.com/#!api</a>.
          </p>
          <div className="row">
            <input
              type="password"
              placeholder="Keepa API key"
              value={keepaKey}
              onChange={(e) => saveKey(e.target.value)}
              style={{ flex: 1 }}
            />
            {keepaKey && <button className="ghost" onClick={() => saveKey("")}>Clear</button>}
          </div>
        </div>
      )}

      {error && <div className="err">{error}</div>}

      {results.length > 0 && (
        <>
          <div className="statgrid">
            <div className={`statcard ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              <div className="lbl"><IconBox size={14} stroke={1.8} />ASINs analyzed</div>
              <div className="num">{counts.total}</div>
            </div>
            <div className={`statcard bad ${filter === "no-offer" ? "active" : ""}`} onClick={() => setFilter("no-offer")}>
              <div className="lbl"><IconAlertTriangle size={14} stroke={1.8} />No featured offer</div>
              <div className="num">{counts.noOffer}</div>
            </div>
            <div className={`statcard teal ${filter === "not-amazon" ? "active" : ""}`} onClick={() => setFilter("not-amazon")}>
              <div className="lbl"><IconUserX size={14} stroke={1.8} />Buy box not Amazon</div>
              <div className="num">{counts.notAmazon}</div>
            </div>
            <div className={`statcard warn ${filter === "high-variance" ? "active" : ""}`} onClick={() => setFilter("high-variance")}>
              <div className="lbl"><IconActivity size={14} stroke={1.8} />Variance &gt; &plusmn;5%</div>
              <div className="num">{counts.highVar}</div>
            </div>
          </div>

          <div className="row end" style={{ marginTop: 14 }}>
            <button className="ghost" onClick={exportCsv}>
              <IconDownload size={15} stroke={2} />
              Export CSV
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ASIN</th><th>Product</th><th>Buy box winner</th><th>Current</th>
                  <th>30-day low</th><th>60-day low</th><th>30-day variance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.asin}>
                    <td className="asin">{r.asin}</td>
                    <td className="title">{r.title ?? <span className="muted">—</span>}</td>
                    <td>{buyBoxCell(r)}</td>
                    <td>{money(r.currentPrice)}</td>
                    <td>{money(r.low30)}</td>
                    <td>{money(r.low60)}</td>
                    <td className={r.highVariance ? "var-hi" : ""}>
                      {r.variance30Pct === null ? "—" : `${r.variance30Pct.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="muted" style={{ textAlign: "center" }}>No ASINs match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="footnote">
            &ldquo;Variance&rdquo; = the spread between the highest and lowest buy-box price over the
            last 30 days, as a percentage of the low. &ldquo;No featured offer&rdquo; means the buy box
            is currently suppressed.
          </p>
        </>
      )}
    </div>
  );
}
