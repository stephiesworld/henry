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

const NAV: { id: Tab; label: string }[] = [
  { id: "tools", label: "ASIN toolkit" },
  { id: "profit", label: "Profitability" },
  { id: "chargebacks", label: "Chargebacks" },
  { id: "brief", label: "Weekly brief" },
  { id: "qa", label: "Vendor Q&A" },
  { id: "playbooks", label: "Playbooks" },
  { id: "generators", label: "Generators" },
  { id: "ask", label: "Ask an Amazonian" },
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

  // The header status chip reflects whether a Keepa key is connected (BYOK, in
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
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="top-brand" aria-label="HENRY home">
            HENRY
          </Link>
          <div className="top-actions">
            <span className={`status-chip ${livePricing ? "live" : "demo"}`}>
              <span className="dot" />
              {livePricing ? "Live pricing" : "Demo pricing"}
            </span>
            <button className="top-btn" onClick={() => setShowWelcome(true)}>
              Start here
            </button>
            <button className="top-btn" onClick={() => setPreview("accounts")}>
              Sign in
            </button>
          </div>
        </div>
        <nav className="top-nav">
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              className={`top-tab ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {tab === "tools" && <AsinTools />}
        {tab === "profit" && <Profitability onAsk={askHenry} onConnect={() => setPreview("vendor")} />}
        {tab === "chargebacks" && <Chargebacks onAsk={askHenry} onConnect={() => setPreview("vendor")} />}
        {tab === "brief" && <WeeklyBrief onBrowsePlaybooks={() => setTab("playbooks")} />}
        {tab === "qa" && <VendorQA onAsk={askHenry} />}
        {tab === "playbooks" && <Playbooks onAsk={askHenry} />}
        {tab === "generators" && <Generators onAsk={askHenry} />}
        {tab === "ask" && <AskHenry seed={seed} />}
        <p className="app-disclaimer">
          Independent project, built from Amazon&apos;s public seller docs. Not affiliated with Amazon.
        </p>
      </main>

      {showWelcome && <WelcomeTour onPick={welcomePick} onClose={dismissWelcome} />}
      {preview && <ComingSoonModal kind={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
