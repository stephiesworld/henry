"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconListSearch,
  IconNews,
  IconBook2,
  IconWand,
  IconMessage2,
  IconHelpCircle,
  IconReceiptTax,
  IconReportMoney,
  IconSparkles,
  IconUserCircle,
} from "@tabler/icons-react";
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

const NAV: { id: Tab; label: string; Icon: typeof IconListSearch }[] = [
  { id: "tools", label: "ASIN toolkit", Icon: IconListSearch },
  { id: "profit", label: "Profitability", Icon: IconReportMoney },
  { id: "chargebacks", label: "Chargebacks", Icon: IconReceiptTax },
  { id: "brief", label: "Weekly brief", Icon: IconNews },
  { id: "qa", label: "Vendor Q&A", Icon: IconHelpCircle },
  { id: "playbooks", label: "Playbooks", Icon: IconBook2 },
  { id: "generators", label: "Generators", Icon: IconWand },
  { id: "ask", label: "Ask an Amazonian", Icon: IconMessage2 },
];

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="3" y="3" width="34" height="34" rx="9" fill="rgba(255,153,0,0.14)" />
      <path d="M11 15l9-4 9 4v10l-9 4-9-4V15z" stroke="#ff9900" strokeWidth="1.8" fill="none" />
      <path d="M11 15l9 4 9-4M20 19v10" stroke="#ff9900" strokeWidth="1.8" />
      <path d="M13 31c4 2.4 10 2.4 14 0" stroke="#ff9900" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
          <Logo />
          <span className="side-brand-text">
            <span className="h">HENRY</span>
            <span className="side-tag">fulfillment center</span>
          </span>
        </Link>

        <nav className="side-nav">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon size={18} stroke={1.8} />
              {label}
            </button>
          ))}
        </nav>

        <div className="side-foot">
          <button className="side-signin" onClick={() => setPreview("accounts")}>
            <IconUserCircle size={16} stroke={1.8} />
            Sign in / save
          </button>
          <button className="start-here" onClick={() => setShowWelcome(true)}>
            <IconSparkles size={15} stroke={1.8} />
            Start here
          </button>
          <span className={`status-chip ${livePricing ? "live" : "demo"}`}>
            <span className="dot" />
            {livePricing ? "Live pricing" : "Demo pricing"}
          </span>
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
