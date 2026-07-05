"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AsinTools from "@/components/AsinTools";
import AskHenry from "@/components/AskHenry";
import Playbooks from "@/components/Playbooks";
import WeeklyBrief from "@/components/WeeklyBrief";
import Generators from "@/components/Generators";
import VendorQA from "@/components/VendorQA";
import Chargebacks from "@/components/Chargebacks";
import Profitability from "@/components/Profitability";
import WelcomeTour from "@/components/WelcomeTour";
import ComingSoonModal, { type PreviewKind } from "@/components/ComingSoonModal";

type Tab = "tools" | "profit" | "chargebacks" | "brief" | "qa" | "playbooks" | "generators" | "ask";

const NAV_GROUPS: { label: string; items: { id: Tab; label: string }[] }[] = [
  {
    label: "Workspace",
    items: [
      { id: "tools", label: "ASIN toolkit" },
      { id: "profit", label: "Profitability" },
      { id: "chargebacks", label: "Chargebacks" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { id: "brief", label: "Weekly brief" },
      { id: "qa", label: "Vendor Q&A" },
      { id: "playbooks", label: "Playbooks" },
    ],
  },
  { label: "Drafting", items: [{ id: "generators", label: "Generators" }] },
  { label: "Chat", items: [{ id: "ask", label: "Ask an Amazonian" }] },
];

export default function AppPage() {
  const [tab, setTab] = useState<Tab>("tools");
  const [seed, setSeed] = useState<{ text: string; nonce: number }>({ text: "", nonce: 0 });
  const [livePricing, setLivePricing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [preview, setPreview] = useState<PreviewKind | null>(null);

  // Show the welcome tour on first visit only.
  useEffect(() => {
    try {
      if (!localStorage.getItem("henry.welcomed")) setShowWelcome(true);
    } catch {
      /* ignore */
    }
  }, []);

  function dismissWelcome() {
    setShowWelcome(false);
    try {
      localStorage.setItem("henry.welcomed", "1");
    } catch {
      /* ignore */
    }
  }
  function welcomePick(t: Tab) {
    setTab(t);
    dismissWelcome();
  }

  // The sidebar status chip reflects whether a Keepa key is connected (BYOK, in
  // this browser). Set after mount to avoid a hydration mismatch.
  useEffect(() => {
    const sync = () => {
      try {
        setLivePricing(!!localStorage.getItem("henry.keepa.key"));
      } catch {
        /* ignore */
      }
    };
    sync();
    window.addEventListener("henry:keepa-changed", sync);
    return () => window.removeEventListener("henry:keepa-changed", sync);
  }, []);

  function askHenry(question: string) {
    setSeed({ text: question, nonce: Date.now() });
    setTab("ask");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="side-brand" aria-label="HENRY home">
          <span className="side-brand-text">
            <span className="h">HENRY</span>
            <span className="side-tag">your local fulfillment center</span>
          </span>
        </Link>

        <nav className="side-nav">
          {(() => {
            let idx = 0;
            return NAV_GROUPS.map((group) => (
              <div key={group.label} className="nav-group">
                <p className="nav-group-label">{group.label}</p>
                {group.items.map(({ id, label }) => {
                  idx += 1;
                  const num = String(idx).padStart(2, "0");
                  return (
                    <button
                      key={id}
                      className={`nav-item ${tab === id ? "active" : ""}`}
                      onClick={() => setTab(id)}
                    >
                      <span className="nav-num">{num}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            ));
          })()}
        </nav>

        <div className="side-foot">
          <button className="side-signin" onClick={() => setPreview("accounts")}>
            Sign in / save
          </button>
          <button className="start-here" onClick={() => setShowWelcome(true)}>
            Start here
          </button>
          <span className={`status-chip ${livePricing ? "live" : "demo"}`}>
            <span className="dot" />
            {livePricing ? "Live pricing" : "Demo pricing"}
          </span>
          <p className="side-disclaimer">
            Independent project, built from Amazon&apos;s public seller docs. Not affiliated with
            Amazon.
          </p>
        </div>
      </aside>

      <main className="content">
        {tab === "tools" && <AsinTools />}
        {tab === "profit" && <Profitability onAsk={askHenry} onConnect={() => setPreview("vendor")} />}
        {tab === "chargebacks" && <Chargebacks onAsk={askHenry} onConnect={() => setPreview("vendor")} />}
        {tab === "brief" && <WeeklyBrief onBrowsePlaybooks={() => setTab("playbooks")} />}
        {tab === "qa" && <VendorQA onAsk={askHenry} />}
        {tab === "playbooks" && <Playbooks onAsk={askHenry} />}
        {tab === "generators" && <Generators onAsk={askHenry} />}
        {tab === "ask" && <AskHenry seed={seed} />}
      </main>

      {showWelcome && <WelcomeTour onPick={welcomePick} onClose={dismissWelcome} />}
      {preview && <ComingSoonModal kind={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
