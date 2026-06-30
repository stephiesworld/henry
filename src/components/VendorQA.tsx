"use client";

import { useMemo, useState } from "react";
import {
  IconTrendingUp,
  IconReportMoney,
  IconReceiptTax,
  IconTruckDelivery,
  IconTag,
  IconPhotoEdit,
  IconHeadset,
  IconWritingSign,
  IconSpeakerphone,
  IconShieldCheck,
  IconGitBranch,
  IconCalculator,
  IconListCheck,
  IconRocket,
  IconChartArcs,
  IconChartDots,
  IconArrowUpCircle,
  IconArrowRight,
  IconMessage2,
  type IconProps,
} from "@tabler/icons-react";
import { QUESTION_CATEGORIES, TOTAL_QUESTIONS } from "@/lib/questions";

const ICONS: Record<string, React.ComponentType<IconProps>> = {
  "trending-up": IconTrendingUp,
  "report-money": IconReportMoney,
  "receipt-tax": IconReceiptTax,
  "truck-delivery": IconTruckDelivery,
  tag: IconTag,
  "photo-edit": IconPhotoEdit,
  headset: IconHeadset,
  "writing-sign": IconWritingSign,
  speakerphone: IconSpeakerphone,
  "shield-check": IconShieldCheck,
  "git-branch": IconGitBranch,
  calculator: IconCalculator,
  "list-check": IconListCheck,
  rocket: IconRocket,
  "chart-arcs": IconChartArcs,
  "chart-dots": IconChartDots,
  "arrow-up-circle": IconArrowUpCircle,
};

export default function VendorQA({ onAsk }: { onAsk: (q: string) => void }) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    return QUESTION_CATEGORIES.map((c) => ({
      ...c,
      questions: c.questions.filter((qu) => !q || qu.toLowerCase().includes(q)),
    }))
      .filter((c) => (activeCat ? c.id === activeCat : true))
      .filter((c) => c.questions.length > 0);
  }, [q, activeCat]);

  const matchCount = visible.reduce((n, c) => n + c.questions.length, 0);

  return (
    <div>
      <div className="page-head">
        <h1>Vendor Q&amp;A</h1>
        <p>
          The real questions 1P vendors and 3P sellers ask — {TOTAL_QUESTIONS} of them, organized by
          topic. Tap any question and HENRY answers it for your account, grounded in current Amazon
          guidance.
        </p>
      </div>

      <input
        type="text"
        placeholder="Search questions (cost increase, chargeback, CRAP status, 1P vs 3P…)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="filters">
        <button className={`filter ${!activeCat ? "active" : ""}`} onClick={() => setActiveCat(null)}>
          All topics
        </button>
        {QUESTION_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`filter ${activeCat === c.id ? "active" : ""}`}
            onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {q && <p className="muted" style={{ fontSize: 12.5, margin: "0 0 10px" }}>{matchCount} matching questions</p>}

      <div className="qa-cats">
        {visible.map((c) => {
          const Icon = ICONS[c.icon] ?? IconMessage2;
          return (
            <section key={c.id} className="qa-cat">
              <div className="qa-cat-head">
                <span className="qa-cat-icon"><Icon size={18} stroke={1.8} /></span>
                <h3>{c.label}</h3>
                <span className="pill">{c.audience === "Both" ? "1P + 3P" : c.audience}</span>
              </div>
              <div className="qa-list">
                {c.questions.map((qu) => (
                  <button key={qu} className="qa-item" onClick={() => onAsk(qu)}>
                    <span>{qu}</span>
                    <IconArrowRight size={15} stroke={2} className="qa-arrow" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        {visible.length === 0 && <p className="muted">No questions match that search.</p>}
      </div>
    </div>
  );
}
