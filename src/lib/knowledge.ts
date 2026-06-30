export interface Playbook {
  id: string;
  title: string;
  category:
    | "Listings"
    | "Programs"
    | "Compliance"
    | "Pricing"
    | "Events"
    | "Disputes"
    | "Profitability"
    | "Strategy"
    | "Inventory"
    | "Negotiation";
  /** One-liner shown on the card and used to seed the chat. */
  summary: string;
  /** Keywords used for lightweight retrieval into the chat. */
  tags: string[];
  /** 1P / 3P applicability. */
  audience: "1P" | "3P" | "Both";
  /** Markdown body. Kept concise and accurate; the chat confirms current specifics via web search. */
  body: string;
}

// A small, curated library. Accurate on structure & process; the assistant is
// instructed to confirm dates, fees, and exact field requirements via web search,
// since Amazon changes those frequently.
export const PLAYBOOKS: Playbook[] = [
  {
    id: "fnsku-labeling",
    title: "FBA / FNSKU label requirements",
    category: "Compliance",
    audience: "Both",
    summary: "What a compliant FBA item label must contain and the common rejection reasons.",
    tags: ["label", "fnsku", "barcode", "fba", "shipment", "sticker", "scan", "compliance"],
    body: `**A compliant FBA item label needs:**
- A scannable **FNSKU barcode** (Amazon's "X00..." code), generated from your shipment plan in Seller Central → not the manufacturer UPC/EAN.
- The **human-readable title** and **condition** printed below the barcode.
- Printed at **300 DPI+** on a non-glossy thermal/laser label so the scanner reads it cleanly.
- Recommended label sizes are common Avery formats (e.g. 1" × 2-5/8", 30-up).

**Most common rejection / "unscannable" causes:**
1. The original manufacturer barcode is still visible — it must be **fully covered** (commingling risk) unless you're enrolled in transparency/commingled stock.
2. Label placed over a seam, curved surface, or shrink-wrap fold.
3. Wrong code printed (UPC instead of FNSKU).
4. Smudged thermal print or low contrast.

**Where to do it:** Seller Central → Inventory → Manage FBA Shipments → print labels from the shipment workflow, or order **"FBA Label Service"** (per-unit fee) to have Amazon label for you.

*Confirm current label dimensions, DPI, and any category-specific prep (e.g. polybag suffocation warnings, expiration-date formatting) for your exact category before a large shipment.*`,
  },
  {
    id: "subscribe-and-save",
    title: "Enroll an ASIN in Subscribe & Save (SNS)",
    category: "Programs",
    audience: "Both",
    summary: "Eligibility and steps to put a replenishable ASIN on Subscribe & Save.",
    tags: ["sns", "subscribe", "save", "subscription", "replenishment", "enroll", "discount"],
    body: `**Subscribe & Save** lets customers auto-replenish consumables for a recurring discount; it lifts repeat purchase rate and rank.

**Eligibility (typical):**
- Seller must be in good standing with strong fulfillment metrics (FBA or SFP that meets the bar).
- ASIN is a consumable / replenishable, in stock, and not restricted.

**Steps (3P):** Seller Central → **Growth → Subscribe & Save**, select eligible ASINs, set your **funded discount tier** (e.g. 0%, 5%, 10–15% for higher base discounts). Amazon adds its own base discount on top.

**1P (Vendor):** SNS participation is generally managed by your vendor manager / category team; raise it through Vendor Central or your VM contact.

*Confirm the current eligibility metrics and the exact discount-tier rules for your account, since the thresholds and Amazon's base contribution change.*`,
  },
  {
    id: "climate-pledge-friendly",
    title: "Get the Climate Pledge Friendly badge",
    category: "Programs",
    audience: "Both",
    summary: "How to earn the Climate Pledge Friendly badge via a qualifying certification.",
    tags: ["climate", "pledge", "friendly", "cpf", "sustainability", "certification", "badge", "eco"],
    body: `**Climate Pledge Friendly (CPF)** adds a badge + a dedicated storefront filter for products with a qualifying sustainability certification.

**How to qualify:**
1. Earn one of the **accepted third-party certifications** (there are dozens — e.g. ENERGY STAR, USDA Organic, GOTS, Compact by Design (Amazon's own, no external cert needed), Rainforest Alliance, etc.).
2. **Compact by Design** is the easiest self-qualifying route — it's awarded for efficient packaging/weight per unit and is assessed by Amazon from your product dimensions.
3. Submit certification proof: Brand-registered sellers apply through the CPF enrollment flow; certifications are validated against Amazon's accepted list.

**Where:** Seller Central → search "Climate Pledge Friendly" enrollment, or via Brand Registry. 1P vendors route through their category contact.

*Confirm the current accepted-certifications list and the Compact by Design eligibility calculator before applying.*`,
  },
  {
    id: "category-ungating",
    title: "Get approved (ungated) in a restricted category",
    category: "Listings",
    audience: "3P",
    summary: "How to apply for approval to list in gated categories or brands.",
    tags: ["ungate", "gated", "approval", "restricted", "category", "apply", "invoice", "brand approval"],
    body: `Some categories/brands require **approval before you can list** (e.g. certain Grocery, Beauty, Topicals, Watches, or brand-gated items).

**Steps (3P):**
1. Find the ASIN/category → click **"Listing limitations apply" / "Apply to sell"** (or Seller Central → Inventory → Add a Product → request approval).
2. Provide what's requested — commonly: **commercial invoices** from an authorized distributor/manufacturer (often must show a minimum quantity, be dated within the last ~90 days, and match your registered business name/address), brand authorization letters, or compliance docs.
3. Submit and monitor the case; respond fast to any document requests.

**Tips:** Use invoices, not receipts. Make sure the supplier is reputable and verifiable. Hide unit prices is OK, but quantities and supplier contact info must be visible.

*Requirements vary by category and change often — confirm the exact documents, recency window, and minimum quantities for the specific gate you're hitting.*`,
  },
  {
    id: "chargeback-disputes",
    title: "Win a vendor chargeback dispute (1P)",
    category: "Disputes",
    audience: "1P",
    summary: "How 1P vendors dispute shortage/compliance chargebacks successfully.",
    tags: ["chargeback", "dispute", "shortage", "compliance", "deduction", "vendor", "asn", "po", "1p"],
    body: `Vendor **chargebacks** (operational/compliance deductions) hit 1P margins hard. They're disputable in Vendor Central with evidence.

**General playbook:**
1. **Find the chargeback** in Vendor Central → Payments → Chargebacks (or the deductions/issues dashboard).
2. **Identify the type** — e.g. PO-on-time/fill-rate, ASN accuracy, carton/labeling, prep, or shortage claims. Each has a different proof.
3. **Gather evidence** matching the type: signed BOL/proof of delivery, accurate ASN, packing lists, photos of compliant labeling, carrier confirmations.
4. **File the dispute** within the **allowed window** with documents attached; reference the specific PO and chargeback ID.
5. **Track and escalate** — if auto-rejected, re-open with clearer evidence or escalate via a case/your vendor manager.

**Why disputes fail:** missing the filing window, generic evidence that doesn't map to the chargeback type, or ASN/PO data that doesn't reconcile.

*Confirm the current dispute window and the exact evidence each chargeback code requires — Amazon updates these and they differ by region.*`,
  },
  {
    id: "buy-box-loss",
    title: "Why you lost the buy box (and how to win it back)",
    category: "Pricing",
    audience: "Both",
    summary: "The usual reasons the featured offer slips and the levers to recover it.",
    tags: ["buy box", "featured offer", "lost", "suppressed", "win", "price", "stock", "eligibility"],
    body: `The **buy box / featured offer** can be lost or suppressed. Common causes, in rough order:

1. **Price uncompetitive** vs. other offers or vs. the price elsewhere on the web (Amazon's "pricing competitiveness" / "your price is higher than recently" suppression).
2. **Out of stock or low inventory** / slow fulfillment promise (FBA usually wins over slower MFN).
3. **Account or listing health** — late shipments, defects, policy flags lower buy-box eligibility.
4. **Suppressed buy box** — Amazon shows "See all buying options" with no featured offer when no offer meets the bar (often a pricing/reference-price issue).

**Levers to win it back:**
- Match/beat the competitive price (watch your floor); use automated repricing carefully.
- Keep FBA stock healthy and fulfillment fast.
- Fix listing/account health defects.
- If suppressed on price, lower to the reference price or open a case if it's a pricing-error flag.

*Use the ASIN Toolkit to spot which of your ASINs currently show no featured offer or a buy box held by a 3P seller, then work the list.*`,
  },
  {
    id: "prime-day-prep",
    title: "Prime Day & major events — timing and prep",
    category: "Events",
    audience: "Both",
    summary: "When the big events land and how to be ready for them.",
    tags: ["prime day", "event", "deal", "dates", "when", "black friday", "cyber monday", "bfcm", "deals"],
    body: `Amazon's major sales events drive huge volume; deal submission deadlines are weeks **before** the event.

**Rough cadence (confirm the exact dates each year):**
- **Prime Day** — typically **mid-July** (sometimes a second fall "Prime Big Deal Days" event in October).
- **Black Friday / Cyber Monday (BFCM)** — late November.
- **New Year / Q1** events vary.

**Prep checklist:**
1. **Submit deals early** — Lightning Deals / Best Deals / coupons have submission windows that close well before the event.
2. **Send FBA inventory in early** — inbound cutoffs precede the event; stockouts during the spike are the #1 regret.
3. **Lock pricing & buy-box eligibility** ahead of time.
4. **Plan ads budget** for the spike.

*Always confirm the current year's exact event dates and the deal-submission deadlines — these are announced each year and the toolkit/chat can pull the latest.*`,
  },
  {
    id: "brand-registry",
    title: "Enroll in Brand Registry (and why it matters)",
    category: "Programs",
    audience: "Both",
    summary: "What Brand Registry unlocks and what you need to enroll.",
    tags: ["brand registry", "brand", "trademark", "enroll", "a+", "registry", "protection"],
    body: `**Brand Registry** unlocks A+ Content, Stores, Sponsored Brands, enhanced brand protection/reporting, and many program eligibilities (incl. parts of CPF, Vine, Transparency).

**What you need:**
- An **active registered or pending trademark** (text or image mark) in the country you're enrolling, issued by the relevant office (USPTO, EUIPO, etc.). IP Accelerator can speed a pending mark to eligibility.
- Your brand name displayed on products/packaging.
- The trademark/serial number and ability to verify ownership.

**Steps:** Go to brandservices.amazon.com → enroll → enter the trademark info → Amazon verifies and issues a code to confirm ownership.

*Confirm which trademark types/offices are currently accepted for your marketplace before relying on a pending application.*`,
  },
  {
    id: "aplus-content",
    title: "Add A+ Content to a listing",
    category: "Listings",
    audience: "Both",
    summary: "How to publish enhanced brand content on your detail pages.",
    tags: ["a+", "a plus", "content", "enhanced", "ebc", "detail page", "modules", "images"],
    body: `**A+ Content** (formerly EBC) replaces the plain product description with image/text modules — it lifts conversion meaningfully.

**Steps (3P, Brand Registered):** Seller Central → **Advertising/Marketing → A+ Content Manager** → create content → choose modules → apply to ASIN(s) → submit for review.

**1P (Vendor):** Vendor Central → A+ Content Manager (same module system); premium A+ may be available depending on your agreement.

**Tips:** Use high-res lifestyle + comparison modules; keep text scannable; follow image dimension specs per module; avoid prohibited claims/contact info/pricing.

*Confirm current module specs and content policy (claims, prohibited words, image sizes) before submitting to avoid rejection.*`,
  },
  {
    id: "vine-reviews",
    title: "Use Amazon Vine to get early reviews",
    category: "Programs",
    audience: "Both",
    summary: "How to enroll a low-review ASIN in Vine for trusted early reviews.",
    tags: ["vine", "reviews", "voice", "early reviews", "enroll", "ratings", "new product"],
    body: `**Amazon Vine** sends free units to trusted "Vine Voice" reviewers to seed honest early reviews on new/low-review ASINs.

**Eligibility (typical, 3P):** Brand Registered, ASIN has **fewer than the cap of reviews** (historically 30), is in stock (FBA), has a buy-able offer, and isn't an adult/restricted item.

**Steps:** Seller Central → **Advertising/Marketing → Vine** → enroll the ASIN → choose the number of units to offer (there's a per-ASIN enrollment fee) → ship the units into FBA for Vine.

**1P:** Vine enrollment is available through Vendor Central for eligible items.

*Confirm the current review cap, enrollment fee, and unit limits — Amazon has changed these.*`,
  },
  {
    id: "cost-increase-approval",
    title: "Get a wholesale cost increase approved (1P)",
    category: "Pricing",
    audience: "1P",
    summary: "Why cost-increase requests get auto-rejected and how to actually get one through.",
    tags: ["cost increase", "wholesale", "price increase", "rejected", "tariff", "margin", "cogs", "negotiation", "vendor"],
    body: `Amazon's system **auto-rejects** most cost-increase requests by default — getting one approved is part process, part negotiation.

**Why they get rejected:**
- Amazon benchmarks your cost against the **retail price it can sell at** and prices it sees **elsewhere on the web**. If raising your cost pushes retail above competitors (or kills its margin), the bot rejects it.
- Requests with no external justification, or submitted off-cycle, are rejected automatically.

**How to actually get one through:**
1. **Raise your price on other channels first.** Amazon references external market pricing — if your street price is higher everywhere else, your case is far stronger.
2. **Submit with documentation:** input-cost changes (raw materials, **tariff** notices, freight, labor), dated and specific per SKU.
3. **Time it** to Amazon's cost-change windows / your AVN; pair it with the [[amazon-vendor-negotiation]] conversation.
4. **Escalate via your vendor manager** for strategic SKUs rather than relying on the portal bot — frame it around keeping the item *profitable for Amazon* (avoiding [[crap-status]]), not just for you.
5. If repeatedly rejected on a SKU that's now unprofitable, consider **re-SKUing**, bundling, or moving it to 3P where you control price.

*Confirm the current cost-change request mechanism, allowed frequency, and timing windows for your account — Amazon changes the process.*`,
  },
  {
    id: "crap-status",
    title: "Escape CRAP status (Can't Realize A Profit)",
    category: "Inventory",
    audience: "1P",
    summary: "What it means when Amazon flags an item unprofitable and stops ordering — and how to fix it.",
    tags: ["crap", "cant realize a profit", "stopped ordering", "unprofitable", "po", "purchase order", "sourcing", "delist"],
    body: `**CRAP ("Can't Realize A Profit")** is Amazon's internal flag for items it loses money on. Flagged items often see **purchase orders dry up**, get switched to "Sourced by Amazon" alternatives, pushed toward 3P, or restricted.

**Common causes:**
- Your wholesale cost is too high relative to the price Amazon can competitively sell at.
- Low/odd unit economics — bulky, heavy, or low-price items where shipping eats the margin.
- Frequent returns, damages, or deep discounting.

**How to get out of it:**
1. **Improve the unit economics** — lower COGS, or reduce size/weight/packaging (this also powers [[climate-pledge-friendly]] via Compact by Design).
2. **Re-SKU or bundle** to reset the price reference and create a healthier-margin ASIN.
3. **Raise external/MSRP pricing** so Amazon's competitive target rises (see [[cost-increase-approval]]).
4. **Propose cost-savings programs** in your [[amazon-vendor-negotiation]] (Direct Import, Vendor Flex, FFP) that lower Amazon's cost to serve.
5. If it can't be made profitable for Amazon, **move the SKU to 3P** where you set price (see [[one-p-vs-three-p]]).

*"CRAP" is internal Amazon terminology; exact triggers and remedies aren't published — confirm specifics with your vendor manager.*`,
  },
  {
    id: "net-ppm-contribution-profit",
    title: "Calculate true net PPM / contribution profit (1P)",
    category: "Profitability",
    audience: "1P",
    summary: "How to find what you actually earn per unit after every Amazon deduction.",
    tags: ["net ppm", "pure profit per unit", "contribution profit", "margin", "profitability", "deductions", "coop", "fools gold"],
    body: `Headline sales volume on 1P is misleading — the number that matters is **net PPM (pure profit per unit)** / contribution profit, *after all deductions*.

**The real formula (per unit):**
\`Net = wholesale price received − COGS − every Amazon deduction\`
Deductions to subtract: **co-op / accruals / allowances**, freight/inbound, **chargebacks & shortages**, damages and returns, and any **advertising** you fund. Many vendors forget co-op and ads and overstate profit badly.

**How to get the data:**
- Vendor Central's **profitability / net PPM** reporting gives a per-ASIN view; reconcile it against your remittances and deduction reports.
- Build a per-SKU sheet to separate truly profitable ASINs from **"Fool's Gold ASINs"** — high revenue, near-zero or negative contribution once co-op, ads, and chargebacks are counted.

**What to do with it:**
- Kill or fix chronic-negative SKUs; pursue [[cost-increase-approval]] on thin ones; move structurally-unprofitable ones to 3P ([[one-p-vs-three-p]]).
- Track net PPM by ASIN monthly — it's the best early warning for [[crap-status]].

*Confirm which deductions your terms include and how your Vendor Central analytics define "net PPM" before relying on the dashboard number.*`,
  },
  {
    id: "one-p-vs-three-p",
    title: "Decide: 1P (Vendor) vs 3P (Seller) vs hybrid",
    category: "Strategy",
    audience: "Both",
    summary: "The economics and control trade-offs, and how to choose per SKU.",
    tags: ["1p", "3p", "vendor central", "seller central", "hybrid", "model", "decision", "move to 3p", "economics", "control"],
    body: `**1P (Vendor Central):** you sell wholesale *to* Amazon; Amazon owns retail pricing, the buy box, and ordering. Pros: scale, "Ships from/Sold by Amazon" trust, less ops. Cons: **no price control**, co-op/chargebacks, unpredictable POs, [[crap-status]] risk.

**3P (Seller Central):** you sell *to customers* via Amazon. Pros: **you control price**, margin, and catalog; richer data. Cons: you own fulfillment/ops, ad spend, and the buy box is competitive.

**How to choose, per SKU:**
- **Price-sensitive / brand-controlled / MAP-critical** → favor **3P** (you set price).
- **High-volume commodity** where Amazon's scale helps and margin survives co-op → **1P** can work.
- **Unprofitable on 1P** (negative net PPM / [[crap-status]]) → move to **3P**.
- **New launches** → many brands start **3P first** to control price and reviews, then accept 1P invitations selectively.

**Hybrid** is common: keep stable high-volume SKUs on 1P, move price-sensitive or thin-margin SKUs to 3P. Watch for channel conflict on the same ASIN.

*Amazon can also push items between models; confirm account-specific implications before migrating SKUs.*`,
  },
  {
    id: "amazon-vendor-negotiation",
    title: "Prepare for your Annual Vendor Negotiation (AVN)",
    category: "Negotiation",
    audience: "1P",
    summary: "What to bring to the AVN and how to negotiate when Amazon holds the pricing power.",
    tags: ["avn", "annual vendor negotiation", "terms", "coop", "allowance", "negotiation", "discount", "renewal", "leverage"],
    body: `The **Annual Vendor Negotiation (AVN)** is the yearly reset of your terms — co-op/allowances, payment terms, growth commitments, and funding. Going in unprepared is where margin quietly leaks.

**Prepare with data:**
- Your **net PPM by ASIN** ([[net-ppm-contribution-profit]]) so you know which terms you can absorb.
- Total co-op/allowance % and what it actually buys you.
- Your performance story: sell-through, in-stock, growth, low chargebacks.

**Levers and framing:**
1. **Frame around Amazon's profitability, not just yours** — propose changes that keep items profitable for Amazon (avoiding [[crap-status]]) and they're far more receptive.
2. **Negotiate co-op/allowance percentages** down where ROI is weak; tie funding to specific growth.
3. **Propose cost-savings programs** — Direct Import, Vendor Flex, FFP — that lower Amazon's cost to serve in exchange for better terms.
4. Bundle your **cost-increase asks** ([[cost-increase-approval]]) into this conversation.

**On renewal:** negotiating hard generally won't lose you the account, but know your walk-away — a stronger 3P position is real leverage (see [[one-p-vs-three-p]]).

*AVN structure and timing vary by category and year — confirm your specifics with your vendor manager.*`,
  },
];

const byId = new Map(PLAYBOOKS.map((p) => [p.id, p]));
export const getPlaybook = (id: string) => byId.get(id);

/** Lightweight keyword retrieval: score playbooks against a free-text query. */
export function retrievePlaybooks(query: string, limit = 3): Playbook[] {
  const q = query.toLowerCase();
  const words = q.split(/[^a-z0-9+]+/).filter((w) => w.length > 2);
  const scored = PLAYBOOKS.map((p) => {
    let score = 0;
    const hay = `${p.title} ${p.summary} ${p.tags.join(" ")}`.toLowerCase();
    for (const tag of p.tags) if (q.includes(tag)) score += 3;
    for (const w of words) if (hay.includes(w)) score += 1;
    return { p, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}
