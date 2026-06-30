"use client";

import { IconX, IconPlugConnected, IconUserCircle, IconCheck } from "@tabler/icons-react";

export type PreviewKind = "vendor" | "accounts";

const CONTENT: Record<PreviewKind, { Icon: typeof IconX; title: string; intro: string; points: string[]; footer: string }> = {
  vendor: {
    Icon: IconPlugConnected,
    title: "Connect Vendor Central",
    intro:
      "In production, HENRY links to your Amazon Vendor Central through the official Selling Partner API (SP-API) — so this fills in automatically, no CSV needed.",
    points: [
      "Purchase orders & demand forecasts",
      "Sales, inventory & traffic reports",
      "Net pure product margin (net PPM) by ASIN",
      "Chargebacks & deductions (via report sync)",
    ],
    footer:
      "Requires Amazon's SP-API app approval and your one-time authorization. For now: upload a CSV or enter your numbers — it works exactly the same.",
  },
  accounts: {
    Icon: IconUserCircle,
    title: "Save across devices",
    intro:
      "Accounts are coming. Today HENRY saves your lists, P&L, and uploads in this browser. With an account, your data follows you to any device — and your team.",
    points: [
      "Secure sign-in (email or Google)",
      "Your catalog, P&L, and chargeback history saved to your account",
      "Connect your Vendor Central and Keepa keys once",
    ],
    footer: "Until then, everything you enter persists locally in this browser.",
  },
};

export default function ComingSoonModal({ kind, onClose }: { kind: PreviewKind; onClose: () => void }) {
  const c = CONTENT[kind];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose} aria-label="Close"><IconX size={18} stroke={2} /></button>
        <span className="preview-badge">Preview · not live yet</span>
        <div className="modal-head" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="welcome-icon"><c.Icon size={26} stroke={1.7} /></span>
            <h2 style={{ margin: 0 }}>{c.title}</h2>
          </div>
          <p style={{ marginTop: 12, marginBottom: 16 }}>{c.intro}</p>
        </div>
        <ul className="coming-points">
          {c.points.map((p) => (
            <li key={p}><IconCheck size={15} stroke={2} />{p}</li>
          ))}
        </ul>
        <p className="coming-footer">{c.footer}</p>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 18 }}>
          <button className="primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
