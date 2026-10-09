"use client";

import { IconX, IconPlugConnected, IconUserCircle, IconCheck } from "@tabler/icons-react";

export type PreviewKind = "vendor" | "accounts";

const CONTENT: Record<PreviewKind, { Icon: typeof IconX; title: string; intro: string; points: string[]; footer: string }> = {
  vendor: {
    Icon: IconPlugConnected,
    title: "Connect Vendor Central",
    intro:
      "The full version of HENRY would connect to Vendor Central through Amazon's Selling Partner API (SP-API), so this data would fill in on its own without a CSV.",
    points: [
      "Purchase orders & demand forecasts",
      "Sales, inventory & traffic reports",
      "Net pure product margin (net PPM) by ASIN",
      "Chargebacks & deductions (via report sync)",
    ],
    footer:
      "This needs Amazon to approve the SP-API app and you to authorize it once. For now, upload a CSV or type in your numbers. The analysis works the same way.",
  },
  accounts: {
    Icon: IconUserCircle,
    title: "Save across devices",
    intro:
      "Accounts are on the way. Right now HENRY saves your lists, P&L, and uploads in this browser. With an account, your data would be available on any device and to your team.",
    points: [
      "Secure sign-in (email or Google)",
      "Your catalog, P&L, and chargeback history saved to your account",
      "Connect your Vendor Central and Keepa keys once",
    ],
    footer: "Until then, everything you enter stays saved in this browser.",
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
