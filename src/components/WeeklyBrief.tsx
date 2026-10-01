"use client";

import { useState } from "react";
import { IconNews } from "@tabler/icons-react";
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
        <h1>Weekly brief</h1>
        <p>
          Amazon posts changes to Seller and Vendor Central every week and most of them go unread.
          This pulls the recent ones from a live search and tells you what changed, who it hits, and
          what you should do about it.
        </p>
      </div>

      <button className="primary" onClick={run} disabled={loading}>
        {loading ? "Gathering updates…" : ran ? "Refresh brief" : "Generate this week's brief"}
      </button>

      {loading && (
        <div className="generated">
          <div className="loading-state">
            <span className="spinner" />
            HENRY is searching Amazon&apos;s latest updates. Give it about 30 seconds.
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
