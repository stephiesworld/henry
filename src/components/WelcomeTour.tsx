"use client";

import {
  IconReportMoney,
  IconReceiptTax,
  IconHelpCircle,
  IconMessage2,
  IconX,
  IconArrowRight,
} from "@tabler/icons-react";

type Tab = "tools" | "profit" | "chargebacks" | "brief" | "qa" | "playbooks" | "generators" | "ask";

const PICKS: { tab: Tab; Icon: typeof IconReportMoney; title: string; desc: string }[] = [
  { tab: "profit", Icon: IconReportMoney, title: "See what you really earn per ASIN", desc: "Net PPM after every Amazon deduction, with a margin waterfall and a what-if simulator. Load the sample to explore." },
  { tab: "chargebacks", Icon: IconReceiptTax, title: "Find your chargeback leaks", desc: "Drop in a Vendor Central export (or the sample) and HENRY classifies every deduction and drafts the disputes." },
  { tab: "qa", Icon: IconHelpCircle, title: "Browse the vendor questions", desc: "Over 100 common 1P and 3P questions, sorted by topic. Click one to get an answer." },
  { tab: "ask", Icon: IconMessage2, title: "Ask an Amazonian anything", desc: "Cost increases, CRAP status, label rules, 1P vs 3P. Plain answers, checked against current guidance." },
];

export default function WelcomeTour({ onPick, onClose }: { onPick: (tab: Tab) => void; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Close"><IconX size={18} stroke={2} /></button>
        <div className="modal-head">
          <h2>Welcome to HENRY</h2>
          <p>
            Everything runs on sample data, so there&apos;s nothing to set up. Pick a place to
            start:
          </p>
        </div>
        <div className="welcome-grid">
          {PICKS.map((p) => (
            <button key={p.tab} className="welcome-card" onClick={() => onPick(p.tab)}>
              <span className="welcome-icon"><p.Icon size={22} stroke={1.8} /></span>
              <span className="welcome-text">
                <span className="welcome-title">{p.title}</span>
                <span className="welcome-desc">{p.desc}</span>
              </span>
              <IconArrowRight size={16} stroke={2} className="welcome-arrow" />
            </button>
          ))}
        </div>
        <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
          <button className="ghost" onClick={onClose}>Just let me explore</button>
        </div>
      </div>
    </div>
  );
}
