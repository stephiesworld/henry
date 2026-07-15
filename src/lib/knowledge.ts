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
  /** The vendor-value hook: what this is worth to *you*, in money/control terms. */
  whyItMatters?: string;
  /** What's going wrong (or what you're missing) without it. */
  problem?: string;
  /** Prerequisites, if any. */
  whatYouNeed?: string;
  /** Concrete steps to resolve. Numbered markdown list. */
  resolve?: string;
  /** Fine-print footnote (what to confirm before relying on this). */
  caveat?: string;
  /** Legacy flat markdown body — used only for entries not yet converted to sections. */
  body?: string;
}

/** Flatten a playbook to markdown for chat context, whichever shape it's in. */
export function playbookText(p: Playbook): string {
  if (p.whyItMatters || p.problem || p.resolve) {
    return [
      p.whyItMatters && `**Why it matters:** ${p.whyItMatters}`,
      p.problem && `**The problem:** ${p.problem}`,
      p.whatYouNeed && `**What you need:**\n${p.whatYouNeed}`,
      p.resolve && `**How to resolve:**\n${p.resolve}`,
      p.caveat && `*${p.caveat}*`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  return p.body ?? "";
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
    whyItMatters: `A mislabeled shipment is stranded revenue: unscannable units sit in problem-receive while your in-stock rate dips, and repeated prep errors add per-unit fees or shipment blocks. The label is the cheapest part of your supply chain to get right — and one of the costliest to get wrong.`,
    problem: `Amazon receives FBA inventory by the **FNSKU barcode**, and most failures are mechanical:
1. The original manufacturer barcode is still visible — it must be **fully covered** (commingling risk) unless you're enrolled in transparency/commingled stock.
2. Label placed over a seam, curved surface, or shrink-wrap fold.
3. Wrong code printed (UPC instead of FNSKU).
4. Smudged thermal print or low contrast.`,
    whatYouNeed: `- A scannable **FNSKU barcode** (Amazon's "X00..." code), generated from your shipment plan in Seller Central — the manufacturer UPC/EAN won't do.
- The **human-readable title** and **condition** printed below the barcode.
- **300 DPI+** print on a non-glossy thermal/laser label so the scanner reads it cleanly.
- A common Avery format (e.g. 1" × 2-5/8", 30-up).`,
    resolve: `1. Print labels from Seller Central → **Inventory → Manage FBA Shipments** — the shipment workflow generates the correct FNSKU per unit.
2. Fully cover the original manufacturer barcode on every unit.
3. Place labels on a flat surface, clear of seams and shrink-wrap folds.
4. Short on time? Order the **FBA Label Service** (per-unit fee) and Amazon labels for you.`,
    caveat: `Confirm current label dimensions, DPI, and any category-specific prep (e.g. polybag suffocation warnings, expiration-date formatting) for your exact category before a large shipment.`,
  },
  {
    id: "subscribe-and-save",
    title: "Enroll an ASIN in Subscribe & Save (SNS)",
    category: "Programs",
    audience: "Both",
    summary: "Eligibility and steps to put a replenishable ASIN on Subscribe & Save.",
    tags: ["sns", "subscribe", "save", "subscription", "replenishment", "enroll", "discount"],
    whyItMatters: `SNS turns a one-time buyer into a recurring order stream. Subscribers reorder on autopilot, which stabilizes demand, lifts repeat-purchase rate and rank, and compounds month over month — for consumables it's one of the few levers that keeps paying after you set it once.`,
    problem: `A replenishable ASIN that isn't enrolled leaves reorders to chance: the customer who loved your product still has to remember to buy it again, and your detail page misses the subscription discount badge that nudges first-time conversion.`,
    whatYouNeed: `- Seller in good standing with strong fulfillment metrics (FBA or SFP that meets the bar).
- A consumable/replenishable ASIN that's in stock and unrestricted.`,
    resolve: `1. **3P:** Seller Central → **Growth → Subscribe & Save** → select eligible ASINs.
2. Set your **funded discount tier** (e.g. 0%, 5%, 10–15% for higher base discounts); Amazon adds its own base discount on top.
3. **1P:** SNS participation is generally managed by your vendor manager / category team — raise it through Vendor Central or your VM contact.`,
    caveat: `Confirm the current eligibility metrics and the exact discount-tier rules for your account, since the thresholds and Amazon's base contribution change.`,
  },
  {
    id: "climate-pledge-friendly",
    title: "Get the Climate Pledge Friendly badge",
    category: "Programs",
    audience: "Both",
    summary: "How to earn the Climate Pledge Friendly badge via a qualifying certification.",
    tags: ["climate", "pledge", "friendly", "cpf", "sustainability", "certification", "badge", "eco"],
    whyItMatters: `The CPF badge is shelf placement: badged products appear in a dedicated storefront filter and carry a trust mark that lifts click-through with sustainability-minded shoppers. If your packaging or existing certifications already qualify, it's free visibility sitting unclaimed.`,
    problem: `The badge requires a qualifying sustainability certification, and many vendors assume that means an expensive external audit — so they never check the accepted list. Amazon's own **Compact by Design** route qualifies purely on packaging efficiency, assessed from the product dimensions you already publish.`,
    resolve: `1. Check the **accepted-certifications list** (there are dozens — ENERGY STAR, USDA Organic, GOTS, Rainforest Alliance, etc.) against certifications you already hold.
2. Missing one? Evaluate **Compact by Design** — Amazon's own certification, awarded for efficient packaging/weight per unit with no external certifier involved.
3. Submit certification proof through the CPF enrollment flow (Brand-registered sellers; find it via Seller Central search or Brand Registry). 1P vendors route through their category contact.`,
    caveat: `Confirm the current accepted-certifications list and the Compact by Design eligibility calculator before applying.`,
  },
  {
    id: "category-ungating",
    title: "Get approved (ungated) in a restricted category",
    category: "Listings",
    audience: "3P",
    summary: "How to apply for approval to list in gated categories or brands.",
    tags: ["ungate", "gated", "approval", "restricted", "category", "apply", "invoice", "brand approval"],
    whyItMatters: `Gated categories are where margin hides: fewer eligible sellers means thinner buy-box competition and healthier prices. Approval is mostly a paperwork exercise — sellers who master it unlock catalog the crowd can't touch.`,
    problem: `Some categories and brands require **approval before you can list** (certain Grocery, Beauty, Topicals, Watches, or brand-gated items), and applications usually die on documents: receipts submitted where invoices were required, unverifiable suppliers, or paperwork that doesn't match your registered business details.`,
    whatYouNeed: `- **Commercial invoices** from an authorized distributor/manufacturer — typically showing a minimum quantity, dated within the last ~90 days, and matching your registered business name/address.
- Brand authorization letters or compliance docs, where the gate requests them.
- A reputable, verifiable supplier.`,
    resolve: `1. Find the ASIN/category → click **"Listing limitations apply" / "Apply to sell"** (or Seller Central → Inventory → Add a Product → request approval).
2. Submit exactly what's requested. Hiding unit prices is fine; quantities and supplier contact info must stay visible.
3. Monitor the case and respond fast to any document requests.`,
    caveat: `Requirements vary by category and change often — confirm the exact documents, recency window, and minimum quantities for the specific gate you're hitting.`,
  },
  {
    id: "chargeback-disputes",
    title: "Win a vendor chargeback dispute (1P)",
    category: "Disputes",
    audience: "1P",
    summary: "How 1P vendors dispute shortage/compliance chargebacks successfully.",
    tags: ["chargeback", "dispute", "shortage", "compliance", "deduction", "vendor", "asn", "po", "1p"],
    whyItMatters: `Chargebacks are margin leaking straight off your remittance — operational deductions that many vendors simply absorb as a cost of doing business. A large share are disputable and winnable with the right evidence, and a working dispute muscle also shows you which operational gaps keep generating fees in the first place.`,
    problem: `Disputes fail for predictable reasons: the filing window passes, the evidence is generic rather than mapped to the specific chargeback code, or the ASN/PO data doesn't reconcile. Each chargeback type — PO on-time/fill-rate, ASN accuracy, carton/labeling, prep, shortage claims — demands its own proof.`,
    resolve: `1. **Find the chargeback** in Vendor Central → Payments → Chargebacks (or the deductions/issues dashboard).
2. **Identify the type**, since each has a different proof standard.
3. **Gather evidence that maps to it:** signed BOL/proof of delivery, accurate ASN, packing lists, photos of compliant labeling, carrier confirmations.
4. **File within the allowed window** with documents attached, referencing the specific PO and chargeback ID.
5. **Track and escalate** — if auto-rejected, re-open with clearer evidence or escalate via a case/your vendor manager.`,
    caveat: `Confirm the current dispute window and the exact evidence each chargeback code requires — Amazon updates these and they differ by region.`,
  },
  {
    id: "buy-box-loss",
    title: "Why you lost the buy box (and how to win it back)",
    category: "Pricing",
    audience: "Both",
    summary: "The usual reasons the featured offer slips and the levers to recover it.",
    tags: ["buy box", "featured offer", "lost", "suppressed", "win", "price", "stock", "eligibility"],
    whyItMatters: `The featured offer ("buy box") is where the overwhelming majority of Amazon purchases happen — a customer who lands on your page and doesn't see an **Add to Cart** button mostly just leaves. Losing it doesn't trip an alarm anywhere: your traffic looks normal while conversion collapses. Every day it stays lost is revenue handed to a competing offer — or to nobody, if the buy box is suppressed entirely.`,
    problem: `The buy box can be lost to another offer or suppressed outright. Common causes, in rough order:
1. **Price uncompetitive** vs. other offers or vs. the price elsewhere on the web (Amazon's "pricing competitiveness" / "your price is higher than recently" suppression).
2. **Out of stock or low inventory** / slow fulfillment promise (FBA usually wins over slower MFN).
3. **Account or listing health** — late shipments, defects, policy flags lower buy-box eligibility.
4. **Suppressed buy box** — Amazon shows "See all buying options" with no featured offer when no offer meets the bar (often a pricing/reference-price issue).`,
    resolve: `1. Match/beat the competitive price (watch your floor); use automated repricing carefully.
2. Keep FBA stock healthy and fulfillment fast.
3. Fix listing/account health defects.
4. If suppressed on price, lower to the reference price — or open a case if it's a pricing-error flag.`,
    caveat: `Use the ASIN Toolkit to spot which of your ASINs currently show no featured offer or a buy box held by a 3P seller, then work the list.`,
  },
  {
    id: "prime-day-prep",
    title: "Prime Day & major events — timing and prep",
    category: "Events",
    audience: "Both",
    summary: "When the big events land and how to be ready for them.",
    tags: ["prime day", "event", "deal", "dates", "when", "black friday", "cyber monday", "bfcm", "deals"],
    whyItMatters: `The big events compress a month of demand into a day or two — and the sellers who win them locked in deals, inventory, and ad budgets weeks earlier. Deal-submission windows close well before the event; miss one and you watch the spike from the sidelines at full price.`,
    problem: `Every event has deadlines that precede it by weeks. Rough cadence (confirm the exact dates each year):
- **Prime Day** — typically **mid-July** (sometimes a second fall "Prime Big Deal Days" event in October).
- **Black Friday / Cyber Monday (BFCM)** — late November.
- **New Year / Q1** events vary.`,
    resolve: `1. **Submit deals early** — Lightning Deals / Best Deals / coupons have submission windows that close well before the event.
2. **Send FBA inventory in early** — inbound cutoffs precede the event; stockouts during the spike are the #1 regret.
3. **Lock pricing & buy-box eligibility** ahead of time.
4. **Plan ads budget** for the spike.`,
    caveat: `Always confirm the current year's exact event dates and the deal-submission deadlines — these are announced each year and the toolkit/chat can pull the latest.`,
  },
  {
    id: "brand-registry",
    title: "Enroll in Brand Registry (and why it matters)",
    category: "Programs",
    audience: "Both",
    summary: "What Brand Registry unlocks and what you need to enroll.",
    tags: ["brand registry", "brand", "trademark", "enroll", "a+", "registry", "protection", "counterfeit", "hijack"],
    whyItMatters: `Registry is the difference between **renting your listings and owning them** — and it's free once you have a trademark. Registered brands control their own detail pages, get counterfeit and hijacker protection with real teeth, and unlock the tools that actually move revenue: **A+ Content** (a measurable conversion lift on every page), **Brand Stores**, **Sponsored Brands** ads, **Vine** reviews, and brand analytics — search terms, demographics — you can't see any other way. One blocked hijacker or one point of conversion typically pays for the trademark filing many times over.`,
    problem: `Unregistered, Amazon treats you as just another seller of someone's product. Other sellers' contributions can overwrite your titles and images, counterfeit and gray-market offers can attach to your ASINs and steal the buy box, and your only recourse is filing cases one at a time. You're also locked out of A+, Stores, Sponsored Brands, Vine, Transparency, and most brand-level reporting — the exact levers registered competitors are already using against you.`,
    whatYouNeed: `- An **active registered or pending trademark** (text or image mark) in the country you're enrolling, issued by the relevant office (USPTO, EUIPO, etc.). IP Accelerator can speed a pending mark to eligibility.
- Your brand name displayed on products/packaging.
- The trademark/serial number and ability to verify ownership.`,
    resolve: `1. Go to **brandservices.amazon.com** and start enrollment from the account that should own the brand.
2. Enter the trademark details — the mark, registration/serial number, and issuing office.
3. Amazon verifies with the trademark office's listed contact and issues a code to confirm ownership.
4. Once enrolled, add your authorized sellers/agencies, then turn on what you've unlocked — start with [[aplus-content]] and [[vine-reviews]].`,
    caveat: `Confirm which trademark types/offices are currently accepted for your marketplace before relying on a pending application.`,
  },
  {
    id: "aplus-content",
    title: "Add A+ Content to a listing",
    category: "Listings",
    audience: "Both",
    summary: "How to publish enhanced brand content on your detail pages.",
    tags: ["a+", "a plus", "content", "enhanced", "ebc", "detail page", "modules", "images"],
    whyItMatters: `**A+ Content** (formerly EBC) reliably lifts conversion — same traffic, more orders — by replacing the plain description with lifestyle imagery, comparison charts, and brand modules. It also fills prime detail-page real estate with your story before shoppers scroll to the competition. If you're Brand Registered it's already unlocked; publishing is the only step left.`,
    problem: `A plain-text description competes against detail pages running full visual modules. Submissions also get rejected on avoidable fouls: prohibited claims, contact info, pricing language, or images that miss the per-module dimension specs.`,
    resolve: `1. **3P (Brand Registered):** Seller Central → **Advertising/Marketing → A+ Content Manager** → create content → choose modules → apply to ASIN(s) → submit for review.
2. **1P (Vendor):** Vendor Central → A+ Content Manager (same module system); premium A+ may be available depending on your agreement.
3. Use high-res lifestyle + comparison modules, keep text scannable, and follow the image dimension specs per module.`,
    caveat: `Confirm current module specs and content policy (claims, prohibited words, image sizes) before submitting to avoid rejection.`,
  },
  {
    id: "vine-reviews",
    title: "Use Amazon Vine to get early reviews",
    category: "Programs",
    audience: "Both",
    summary: "How to enroll a low-review ASIN in Vine for trusted early reviews.",
    tags: ["vine", "reviews", "voice", "early reviews", "enroll", "ratings", "new product"],
    whyItMatters: `Reviews are the launch bottleneck: shoppers rarely take a chance on a zero-review ASIN, and ads pointed at one burn budget. **Vine** seeds honest reviews from Amazon's trusted "Vine Voice" reviewer pool within weeks — the fastest policy-compliant way to get a new product to social proof.`,
    problem: `New and low-review ASINs sit in a cold-start loop — few reviews, so weak conversion, so few sales, so few reviews. Incentivized-review workarounds violate policy and put the whole account at risk.`,
    whatYouNeed: `- Brand Registry, with the ASIN under the review cap (historically 30).
- The item in stock via FBA, with a buy-able offer, outside adult/restricted categories.`,
    resolve: `1. Seller Central → **Advertising/Marketing → Vine** → enroll the ASIN.
2. Choose the number of units to offer (there's a per-ASIN enrollment fee).
3. Ship the units into FBA for Vine.
4. **1P:** Vine enrollment is available through Vendor Central for eligible items.`,
    caveat: `Confirm the current review cap, enrollment fee, and unit limits — Amazon has changed these.`,
  },
  {
    id: "cost-increase-approval",
    title: "Get a wholesale cost increase approved (1P)",
    category: "Pricing",
    audience: "1P",
    summary: "Why cost-increase requests get auto-rejected and how to actually get one through.",
    tags: ["cost increase", "wholesale", "price increase", "rejected", "tariff", "margin", "cogs", "negotiation", "vendor"],
    whyItMatters: `Every point of input cost you can't pass through comes straight out of your net PPM — and with tariffs, freight, and materials moving, a stuck cost increase can flip a SKU negative while you wait. Getting increases approved protects the line's profitability and keeps items off the [[crap-status]] radar.`,
    problem: `Amazon's system **auto-rejects** most cost-increase requests. It benchmarks your cost against the **retail price it can sell at** and prices it sees **elsewhere on the web** — if your increase pushes retail above competitors or kills Amazon's margin, the bot says no. Requests with no external justification, or submitted off-cycle, bounce automatically.`,
    resolve: `1. **Raise your price on other channels first.** Amazon references external market pricing — a higher street price everywhere else makes your case far stronger.
2. **Submit with documentation:** input-cost changes (raw materials, **tariff** notices, freight, labor), dated and specific per SKU.
3. **Time it** to Amazon's cost-change windows / your AVN; pair it with the [[amazon-vendor-negotiation]] conversation.
4. **Escalate via your vendor manager** for strategic SKUs — frame it around keeping the item *profitable for Amazon* (avoiding [[crap-status]]).
5. If a now-unprofitable SKU keeps getting rejected, consider **re-SKUing**, bundling, or moving it to 3P where you control price.`,
    caveat: `Confirm the current cost-change request mechanism, allowed frequency, and timing windows for your account — Amazon changes the process.`,
  },
  {
    id: "crap-status",
    title: "Escape CRAP status (Can't Realize A Profit)",
    category: "Inventory",
    audience: "1P",
    summary: "What it means when Amazon flags an item unprofitable and stops ordering — and how to fix it.",
    tags: ["crap", "cant realize a profit", "stopped ordering", "unprofitable", "po", "purchase order", "sourcing", "delist"],
    whyItMatters: `On 1P, a CRAP flag is how a healthy SKU quietly dies: Amazon doesn't email you — **purchase orders just shrink, then stop**, often while the item is still selling well. Catch it early and you protect the revenue stream; the fixes (better unit economics, healthier price references) usually improve your own margin along the way. Ignore it and the item gets switched to "Sourced by Amazon" alternatives or delisted — and you walk into your next [[amazon-vendor-negotiation]] negotiating from weakness.`,
    problem: `**CRAP ("Can't Realize A Profit")** is Amazon's internal flag for items it loses money on. The usual triggers:
- Your wholesale cost is too high relative to the price Amazon can competitively sell at.
- Low/odd unit economics — bulky, heavy, or low-price items where shipping eats the margin.
- Frequent returns, damages, or deep discounting.`,
    resolve: `1. **Improve the unit economics** — lower COGS, or reduce size/weight/packaging (this also powers [[climate-pledge-friendly]] via Compact by Design).
2. **Re-SKU or bundle** to reset the price reference and create a healthier-margin ASIN.
3. **Raise external/MSRP pricing** so Amazon's competitive target rises (see [[cost-increase-approval]]).
4. **Propose cost-savings programs** in your [[amazon-vendor-negotiation]] (Direct Import, Vendor Flex, FFP) that lower Amazon's cost to serve.
5. If it can't be made profitable for Amazon, **move the SKU to 3P** where you set price (see [[one-p-vs-three-p]]).`,
    caveat: `"CRAP" is internal Amazon terminology; exact triggers and remedies aren't published — confirm specifics with your vendor manager.`,
  },
  {
    id: "net-ppm-contribution-profit",
    title: "Calculate true net PPM / contribution profit (1P)",
    category: "Profitability",
    audience: "1P",
    summary: "How to find what you actually earn per unit after every Amazon deduction.",
    tags: ["net ppm", "pure profit per unit", "contribution profit", "margin", "profitability", "deductions", "coop", "fools gold"],
    whyItMatters: `Headline 1P revenue can be fool's gold: co-op, ads, chargebacks, freight, and returns can quietly turn a "top seller" into a money-loser. **Net PPM (pure profit per unit)** tells you which SKUs actually fund your business, and it's the earliest warning you get before [[crap-status]] shuts off the purchase orders.`,
    problem: `Many vendors compute profit as wholesale minus COGS and stop there. The real per-unit formula: **net = wholesale price received − COGS − every Amazon deduction**. Deductions to subtract: **co-op / accruals / allowances**, freight/inbound, **chargebacks & shortages**, damages and returns, and any **advertising** you fund. Forgetting co-op and ads overstates profit badly.`,
    resolve: `1. Pull Vendor Central's **profitability / net PPM** reporting for a per-ASIN view; reconcile it against your remittances and deduction reports.
2. Build a per-SKU sheet to separate truly profitable ASINs from **"Fool's Gold ASINs"** — high revenue, near-zero or negative contribution once every deduction is counted.
3. Kill or fix chronic-negative SKUs; pursue [[cost-increase-approval]] on thin ones; move structurally-unprofitable ones to 3P ([[one-p-vs-three-p]]).
4. Track net PPM by ASIN monthly — it's the best early warning for [[crap-status]].`,
    caveat: `Confirm which deductions your terms include and how your Vendor Central analytics define "net PPM" before relying on the dashboard number.`,
  },
  {
    id: "one-p-vs-three-p",
    title: "Decide: 1P (Vendor) vs 3P (Seller) vs hybrid",
    category: "Strategy",
    audience: "Both",
    summary: "The economics and control trade-offs, and how to choose per SKU.",
    tags: ["1p", "3p", "vendor central", "seller central", "hybrid", "model", "decision", "move to 3p", "economics", "control"],
    whyItMatters: `This choice decides who controls your price, your margin structure, and your risk — SKU by SKU. Getting the model right is often worth more than any optimization inside either channel: a structurally-unprofitable 1P SKU can become a healthy 3P SKU purely by switching who sets the price.`,
    problem: `**1P (Vendor Central):** you sell wholesale *to* Amazon; Amazon owns retail pricing, the buy box, and ordering. Pros: scale, "Ships from/Sold by Amazon" trust, less ops. Cons: **no price control**, co-op/chargebacks, unpredictable POs, [[crap-status]] risk.
**3P (Seller Central):** you sell *to customers* via Amazon. Pros: **you control price**, margin, and catalog; richer data. Cons: you own fulfillment/ops, ad spend, and the buy box is competitive. A SKU sitting in the wrong model shows up as thin margins, MAP erosion, or vanishing POs.`,
    resolve: `1. **Price-sensitive / brand-controlled / MAP-critical** → favor **3P** (you set price).
2. **High-volume commodity** where Amazon's scale helps and margin survives co-op → **1P** can work.
3. **Unprofitable on 1P** (negative net PPM / [[crap-status]]) → move to **3P**.
4. **New launches** → many brands start **3P first** to control price and reviews, then accept 1P invitations selectively.
5. **Hybrid** is common: keep stable high-volume SKUs on 1P, move price-sensitive or thin-margin SKUs to 3P. Watch for channel conflict on the same ASIN.`,
    caveat: `Amazon can also push items between models; confirm account-specific implications before migrating SKUs.`,
  },
  {
    id: "amazon-vendor-negotiation",
    title: "Prepare for your Annual Vendor Negotiation (AVN)",
    category: "Negotiation",
    audience: "1P",
    summary: "What to bring to the AVN and how to negotiate when Amazon holds the pricing power.",
    tags: ["avn", "annual vendor negotiation", "terms", "coop", "allowance", "negotiation", "discount", "renewal", "leverage"],
    whyItMatters: `The **Annual Vendor Negotiation (AVN)** is the one meeting where your entire year's margin structure gets set — co-op percentages, payment terms, funding, growth commitments. Terms that creep a point or two each year compound into your whole net margin over time. Preparation decides whether you trade or simply accept.`,
    problem: `Amazon's team negotiates with your complete performance data in front of them, every day of the year. Vendors who show up without their own numbers end up agreeing to terms they can't actually absorb — and the margin leak gets locked in for another year.`,
    whatYouNeed: `- Your **net PPM by ASIN** ([[net-ppm-contribution-profit]]) so you know which terms you can absorb.
- Total co-op/allowance % and what it actually buys you.
- Your performance story: sell-through, in-stock, growth, low chargebacks.`,
    resolve: `1. **Frame around Amazon's profitability** — propose changes that keep items profitable for Amazon (avoiding [[crap-status]]) and they're far more receptive.
2. **Negotiate co-op/allowance percentages** down where ROI is weak; tie funding to specific growth.
3. **Propose cost-savings programs** — Direct Import, Vendor Flex, FFP — that lower Amazon's cost to serve in exchange for better terms.
4. Bundle your **cost-increase asks** ([[cost-increase-approval]]) into this conversation.
5. Know your walk-away: negotiating hard generally won't lose you the account, and a stronger 3P position is real leverage ([[one-p-vs-three-p]]).`,
    caveat: `AVN structure and timing vary by category and year — confirm your specifics with your vendor manager.`,
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
