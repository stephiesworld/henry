"use client";

import {
  IconReportMoney,
  IconReceiptTax,
  IconHelpCircle,
  IconMessage2,
  IconX,
  IconArrowRight,
} from "@tabler/icons-react";
import { TOTAL_QUESTIONS } from "@/lib/questions";

type Tab = "tools" | "profit" | "chargebacks" | "brief" | "qa" | "playbooks" | "generators" | "ask";

const PICKS: { tab: Tab; Icon: typeof IconReportMoney; title: string; desc: string }[] = [
  { tab: "profit", Icon: IconReportMoney, title: "See what you really earn per ASIN", desc: "Net PPM after every Amazon deduction, with a margin waterfall and a what-if simulator. Load the sample to explore." },
  { tab: "chargebacks", Icon: IconReceiptTax, title: "Find your chargeback leaks", desc: "Drop in a Vendor Central export (or the sample) and HENRY classifies every deduction and drafts the disputes." },
  { tab: "qa", Icon: IconHelpCircle, title: "Browse the vendor questions", desc: `${TOTAL_QUESTIONS} common 1P/3P questions, grouped by topic. Click one and HENRY answers it.` },
  { tab: "ask", Icon: IconMessage2, title: "Ask an Amazonian anything", desc: "Cost increases, CRAP status, label rules, 1P vs. 3P. Plain-English answers, checked against Amazon's current guidance." },
];

export default function WelcomeTour({ onPick, onClose }: { onPick: (tab: Tab) => void; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Close"><IconX size={18} stroke={2} /></button>
        <div className="modal-head">
          <h2>Welcome to HENRY</h2>
          <p>
            Start here whenever something comes up on Vendor Central. Everything runs on sample data,
            so there&apos;s nothing to set up. A few good places to begin:
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
