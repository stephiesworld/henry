"use client";

import { useState } from "react";
import { IconRefresh, IconNews, IconBook2 } from "@tabler/icons-react";
import Markdown from "./Markdown";
import { streamPost } from "@/lib/clientStream";

export default function WeeklyBrief({ onBrowsePlaybooks }: { onBrowsePlaybooks?: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setRan(true);
    setError(null);
    setText("");
    try {
      await streamPost("/api/generate", { task: "brief" }, (acc) => {
        const cands = [acc.indexOf("## "), acc.indexOf("### ")].filter((i) => i >= 0);
        const start = cands.length ? Math.min(...cands) : -1;
        setText(start >= 0 ? acc.slice(start) : "");
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const itemCount = (text.match(/###\s/g) || []).length;
  const showEmpty = ran && !loading && !error && itemCount === 0;

  return (
    <div>
      <div className="page-head">
        <h1>HENRY&apos;s weekly brief</h1>
        <p>
          The Amazon Seller &amp; Vendor Central updates you didn&apos;t read — gathered, checked, and
          summarized into what changed, who it affects, and what to do. The whole point of HENRY: stop
          missing the announcements that cost you money.
        </p>
      </div>

      <button className="primary" onClick={run} disabled={loading}>
        <IconRefresh size={16} stroke={2} />
        {loading ? "Gathering updates…" : ran ? "Refresh brief" : "Generate this week's brief"}
      </button>

      {loading && (
        <div className="generated">
          <div className="loading-state">
            <span className="spinner" />
            HENRY is searching Amazon&apos;s latest updates — this usually takes about 30 seconds.
          </div>
        </div>
      )}

      {error && (
        <div className="empty-state">
          <div className="es-icon"><IconNews size={28} stroke={1.5} /></div>
          <h4>That took too long</h4>
          <p>{error} The brief runs faster on a second try.</p>
        </div>
      )}

      {showEmpty && (
        <div className="empty-state">
          <div className="es-icon"><IconNews size={28} stroke={1.5} /></div>
          <h4>No fresh updates surfaced this run</h4>
          <p>
            HENRY didn&apos;t find notable new announcements right now (better than inventing them).
            Try again in a moment{onBrowsePlaybooks ? ", or browse the evergreen Playbooks instead." : "."}
          </p>
          {onBrowsePlaybooks && (
            <button className="ghost" style={{ marginTop: 14 }} onClick={onBrowsePlaybooks}>
              <IconBook2 size={15} stroke={2} />
              Browse Playbooks
            </button>
          )}
        </div>
      )}

      {!loading && !error && itemCount > 0 && (
        <div className="generated">
          <Markdown text={text} />
        </div>
      )}
    </div>
  );
}
