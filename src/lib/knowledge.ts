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
      p.whyItMatters && `**Why it's worth doing:** ${p.whyItMatters}`,
      p.problem && `**What usually goes wrong:** ${p.problem}`,
      p.whatYouNeed && `**Before you start:**\n${p.whatYouNeed}`,
      p.resolve && `**Steps:**\n${p.resolve}`,
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
    summary: "What an FBA item label has to include, and the mistakes that get shipments rejected.",
    tags: ["label", "fnsku", "barcode", "fba", "shipment", "sticker", "scan", "compliance"],
    whyItMatters: `If the warehouse can't scan a unit, it sits in problem-receive instead of going on sale, and your in-stock rate drops while it waits. Repeat labeling mistakes also bring per-unit prep fees and, eventually, blocked shipments. Labels are cheap and easy to get right, so it's worth checking them before a big send.`,
    problem: `Amazon receives FBA inventory by scanning the **FNSKU barcode**, and most rejections come down to a handful of simple mistakes:
1. The manufacturer barcode is still showing. It has to be **fully covered** (otherwise units can get mixed with other sellers' stock) unless you're enrolled in Transparency or commingled inventory.
2. The label sits over a seam, a curve, or a fold in the shrink-wrap.
3. The wrong code was printed (the UPC instead of the FNSKU).
4. The print is smudged or too faint to scan.`,
    whatYouNeed: `- A scannable **FNSKU barcode** (the "X00..." code Amazon assigns), generated from your shipment plan in Seller Central. The manufacturer's UPC or EAN won't work.
- The product title and condition printed under the barcode.
- A print resolution of **300 DPI or higher** on non-glossy thermal or laser labels.
- A standard Avery size, such as 1" × 2-5/8" (30 per sheet).`,
    resolve: `1. Print labels from Seller Central → **Inventory → Manage FBA Shipments**. The shipment workflow gives you the right FNSKU for each unit.
2. Cover the manufacturer barcode on every unit.
3. Put labels on a flat surface, away from seams and shrink-wrap folds.
4. If you're short on time, Amazon's **FBA Label Service** will label units for you for a per-unit fee.`,
    caveat: `Check the current label size and DPI rules, plus any prep rules for your category (polybag suffocation warnings, expiration date formats), before sending a large shipment.`,
  },
  {
    id: "subscribe-and-save",
    title: "Enroll an ASIN in Subscribe & Save (SNS)",
    category: "Programs",
    audience: "Both",
    summary: "Who qualifies for Subscribe & Save and how to put a replenishable ASIN on it.",
    tags: ["sns", "subscribe", "save", "subscription", "replenishment", "enroll", "discount"],
    whyItMatters: `Subscribers get the product sent automatically on a schedule, so a one-time buyer becomes a regular order. That smooths out your demand, helps repeat purchase rate and ranking, and keeps adding up as more people subscribe. For anything people use up and rebuy, it's one of the few things you set once and keep benefiting from.`,
    problem: `If a replenishable ASIN isn't enrolled, a happy customer still has to remember to come back and buy it again. Your detail page also misses the subscription discount badge, which helps convert first-time buyers.`,
    whatYouNeed: `- A seller account in good standing with strong fulfillment metrics (FBA, or Seller Fulfilled Prime that meets the bar).
- A consumable or replenishable ASIN that's in stock and not restricted.`,
    resolve: `1. **3P:** Seller Central → **Growth → Subscribe & Save** → pick the eligible ASINs.
2. Choose the discount you'll fund (for example 0%, 5%, or 10–15% for higher base discounts). Amazon adds its own base discount on top.
3. **1P:** your vendor manager or category team usually handles SNS, so ask through Vendor Central or your VM contact.`,
    caveat: `Eligibility metrics, discount tiers and Amazon's base contribution change from time to time, so check the current rules for your account.`,
  },
  {
    id: "climate-pledge-friendly",
    title: "Get the Climate Pledge Friendly badge",
    category: "Programs",
    audience: "Both",
    summary: "How to earn the Climate Pledge Friendly badge with a qualifying certification.",
    tags: ["climate", "pledge", "friendly", "cpf", "sustainability", "certification", "badge", "eco"],
    whyItMatters: `Products with the badge show up when shoppers filter for Climate Pledge Friendly items, and the badge itself helps click-through with people who care about sustainability. If your packaging or an existing certification already qualifies, you're missing out on visibility that costs nothing to claim.`,
    problem: `You need a qualifying sustainability certification, and a lot of vendors assume that means paying for an outside audit, so they never look at the list. Amazon's own **Compact by Design** certification is based only on packaging efficiency, worked out from product dimensions you've already published.`,
    resolve: `1. Compare the **accepted certifications list** (there are dozens, including ENERGY STAR, USDA Organic, GOTS and Rainforest Alliance) with what you already hold.
2. If you don't have one, look at **Compact by Design**. It's awarded for efficient packaging and weight per unit, and no outside certifier is involved.
3. Submit proof through the CPF enrollment flow (available to brand-registered sellers; search for it in Seller Central or Brand Registry). 1P vendors go through their category contact.`,
    caveat: `Check the current list of accepted certifications and the Compact by Design calculator before you apply.`,
  },
  {
    id: "category-ungating",
    title: "Get approved (ungated) in a restricted category",
    category: "Listings",
    audience: "3P",
    summary: "How to apply for approval to sell in gated categories or brands.",
    tags: ["ungate", "gated", "approval", "restricted", "category", "apply", "invoice", "brand approval"],
    whyItMatters: `Fewer sellers are allowed into gated categories, so there's less competition for the buy box and prices tend to hold up better. Getting approved is mostly paperwork, and once you know what Amazon wants you can open up products that most sellers can't list.`,
    problem: `Some categories and brands require **approval before you can list** (parts of Grocery, Beauty, Topicals, Watches, and certain brands). Applications usually fail on the documents: receipts sent where invoices were required, suppliers Amazon can't verify, or paperwork that doesn't match your registered business details.`,
    whatYouNeed: `- **Commercial invoices** from an authorized distributor or manufacturer. These usually need to show a minimum quantity, be dated within roughly the last 90 days, and match your registered business name and address.
- Brand authorization letters or compliance documents, if the gate asks for them.
- A supplier Amazon can verify.`,
    resolve: `1. Find the ASIN or category and click **"Listing limitations apply" / "Apply to sell"** (or go to Seller Central → Inventory → Add a Product and request approval).
2. Send exactly what's asked for. You can hide unit prices, but quantities and supplier contact details have to stay visible.
3. Keep an eye on the case and reply quickly if Amazon asks for more documents.`,
    caveat: `The required documents, how recent they must be and the minimum quantities all vary by category and change often, so check the rules for the specific gate you're applying to.`,
  },
  {
    id: "chargeback-disputes",
    title: "Win a vendor chargeback dispute (1P)",
    category: "Disputes",
    audience: "1P",
    summary: "How 1P vendors dispute shortage and compliance chargebacks and win.",
    tags: ["chargeback", "dispute", "shortage", "compliance", "deduction", "vendor", "asn", "po", "1p"],
    whyItMatters: `Chargebacks come straight out of your remittance, and plenty of vendors just accept them as a cost of doing business. A lot of them can be disputed and won with the right evidence. Disputing regularly also shows you which parts of your operation keep triggering fees, so you can fix the cause.`,
    problem: `Disputes tend to fail for the same few reasons: the filing window closes, the evidence is generic instead of matching the specific chargeback code, or the ASN and PO data don't line up. Each chargeback type (PO on-time or fill rate, ASN accuracy, carton or labeling, prep, shortage claims) needs its own kind of proof.`,
    resolve: `1. **Find the chargeback** in Vendor Central → Payments → Chargebacks (or the deductions and issues dashboard).
2. **Work out which type it is**, because each one needs different proof.
3. **Collect evidence for that type:** signed BOL or proof of delivery, an accurate ASN, packing lists, photos showing compliant labels, carrier confirmations.
4. **File before the window closes**, with the documents attached and the PO and chargeback ID referenced.
5. **Follow up.** If it's rejected automatically, reopen it with clearer evidence or escalate through a case or your vendor manager.`,
    caveat: `Dispute windows and the evidence each chargeback code needs vary by region and get updated, so check the current rules before filing.`,
  },
  {
    id: "buy-box-loss",
    title: "Why you lost the buy box and how to get it back",
    category: "Pricing",
    audience: "Both",
    summary: "The usual reasons the featured offer goes away and what to do about each one.",
    tags: ["buy box", "featured offer", "lost", "suppressed", "win", "price", "stock", "eligibility"],
    whyItMatters: `Nearly all Amazon purchases go through the featured offer, also called the buy box. If a shopper lands on your page and there's no **Add to Cart** button, most of them leave. Nothing alerts you when it happens: traffic looks normal while conversion falls. Every day it's gone, the sales go to a competing offer, or to nobody if the buy box is suppressed.`,
    problem: `You can lose the buy box to another offer, or Amazon can suppress it altogether. The usual causes, roughly in order:
1. **Your price isn't competitive** against other offers or against prices elsewhere online (Amazon's "your price is higher than recently" check).
2. **You're out of stock or running low**, or your delivery promise is slow (FBA usually beats slower merchant-fulfilled offers).
3. **Account or listing health:** late shipments, defects and policy flags make you less eligible.
4. **Suppressed buy box:** Amazon shows "See all buying options" with no featured offer when no offer meets its bar. This is often a pricing or reference-price issue.`,
    resolve: `1. Match or beat the competitive price without going below your floor. Be careful with automated repricers.
2. Keep FBA stock healthy and delivery fast.
3. Fix any listing or account health problems.
4. If it's suppressed because of price, lower it to the reference price, or open a case if you think the pricing flag is wrong.`,
    caveat: `The ASIN toolkit shows which of your ASINs have no featured offer or have the buy box held by a 3P seller, so you can work through them one at a time.`,
  },
  {
    id: "prime-day-prep",
    title: "Prime Day and other big events: timing and prep",
    category: "Events",
    audience: "Both",
    summary: "When the big sales events happen and how to get ready for them.",
    tags: ["prime day", "event", "deal", "dates", "when", "black friday", "cyber monday", "bfcm", "deals"],
    whyItMatters: `A big event can bring a month's worth of demand in a day or two. The sellers who do well set up their deals, inventory and ad budgets weeks ahead. Deal submissions close well before the event itself, so if you miss the deadline you sell at full price while everyone else is discounted.`,
    problem: `Each event has deadlines weeks before it starts. The usual timing (check exact dates every year):
- **Prime Day:** usually **mid-July**, sometimes with a second "Prime Big Deal Days" event in October.
- **Black Friday / Cyber Monday:** late November.
- **New Year and Q1 events** vary.`,
    resolve: `1. **Submit deals early.** Lightning Deals, Best Deals and coupons all have submission windows that close well before the event.
2. **Send FBA inventory early.** Inbound cutoffs come before the event, and running out of stock during the spike is the most common regret.
3. **Get your pricing and buy box in order** ahead of time.
4. **Set aside extra ad budget** for the event.`,
    caveat: `Amazon announces event dates and deal deadlines each year, so check the current ones. The chat can look them up for you.`,
  },
  {
    id: "brand-registry",
    title: "Enroll in Brand Registry",
    category: "Programs",
    audience: "Both",
    summary: "What Brand Registry gives you and what you need to enroll.",
    tags: ["brand registry", "brand", "trademark", "enroll", "a+", "registry", "protection", "counterfeit", "hijack"],
    whyItMatters: `Brand Registry is free once you have a trademark, and it gives you control over your own listings. Registered brands control their detail pages and get much better protection against counterfeiters and hijackers. You also get access to **A+ Content** (which reliably improves conversion), **Brand Stores**, **Sponsored Brands** ads, **Vine** reviews, and brand analytics such as search terms and demographics that you can't see otherwise. Stopping a single hijacker, or a small bump in conversion, usually covers the cost of filing the trademark.`,
    problem: `Without registry, Amazon treats you like any other seller of your product. Other sellers can change your titles and images, counterfeit and gray-market offers can attach to your ASINs and take the buy box, and you have to deal with each problem one case at a time. You also can't use A+, Stores, Sponsored Brands, Vine, Transparency or most brand-level reporting, while registered competitors can.`,
    whatYouNeed: `- An **active registered or pending trademark** (text or image) in the country you're enrolling in, from the relevant office (USPTO, EUIPO, etc.). Amazon's IP Accelerator can make a pending mark eligible sooner.
- Your brand name shown on the product or packaging.
- The trademark registration or serial number, and a way to prove you own it.`,
    resolve: `1. Go to **brandservices.amazon.com** and start enrolling from the account that should own the brand.
2. Enter the trademark details: the mark, the registration or serial number, and the issuing office.
3. Amazon contacts the person listed with the trademark office and sends a code to confirm you own it.
4. Once you're in, add any authorized sellers or agencies, then start using what's now available to you, beginning with [[aplus-content]] and [[vine-reviews]].`,
    caveat: `Check which trademark types and offices Amazon currently accepts in your marketplace before relying on a pending application.`,
  },
  {
    id: "aplus-content",
    title: "Add A+ Content to a listing",
    category: "Listings",
    audience: "Both",
    summary: "How to publish A+ Content (enhanced brand content) on your detail pages.",
    tags: ["a+", "a plus", "content", "enhanced", "ebc", "detail page", "modules", "images"],
    whyItMatters: `**A+ Content** (formerly EBC) swaps the plain product description for images, comparison charts and brand sections, and it reliably turns more of the same traffic into orders. It also puts your brand front and center on the detail page before shoppers scroll down to competing products. If you're brand registered you already have access, so all that's left is to publish it.`,
    problem: `A plain text description looks thin next to competitors' pages full of images and charts. Submissions also get rejected for avoidable reasons: claims Amazon doesn't allow, contact details, pricing language, or images in the wrong size for the module.`,
    resolve: `1. **3P (brand registered):** Seller Central → **Advertising/Marketing → A+ Content Manager** → create content → choose modules → apply to your ASINs → submit for review.
2. **1P:** Vendor Central → A+ Content Manager (same module system). Premium A+ may be available depending on your agreement.
3. Use high-resolution lifestyle and comparison modules, keep the text easy to skim, and follow each module's image size rules.`,
    caveat: `Check the current module specs and content rules (claims, banned words, image sizes) before submitting so it doesn't get rejected.`,
  },
  {
    id: "vine-reviews",
    title: "Use Amazon Vine to get early reviews",
    category: "Programs",
    audience: "Both",
    summary: "How to enroll a low-review ASIN in Vine to get trusted early reviews.",
    tags: ["vine", "reviews", "voice", "early reviews", "enroll", "ratings", "new product"],
    whyItMatters: `New products struggle without reviews. Shoppers rarely buy something with zero reviews, and ads pointed at it mostly waste money. **Vine** gets honest reviews from Amazon's trusted "Vine Voice" reviewers within a few weeks. It's the quickest way to get a new product its first reviews without breaking Amazon's rules.`,
    problem: `A new ASIN with few reviews converts poorly, so it sells little, so it gets few new reviews, and the cycle continues. Paying or rewarding people for reviews breaks Amazon's policy and puts your whole account at risk.`,
    whatYouNeed: `- Brand Registry, and an ASIN with fewer reviews than the cap (historically 30).
- The item in stock through FBA, with a buyable offer, and not in an adult or restricted category.`,
    resolve: `1. Seller Central → **Advertising/Marketing → Vine** → enroll the ASIN.
2. Choose how many units to offer. There's an enrollment fee per ASIN.
3. Send the units into FBA for Vine.
4. **1P:** eligible items can be enrolled in Vine through Vendor Central.`,
    caveat: `Amazon has changed the review cap, enrollment fee and unit limits before, so check the current ones.`,
  },
  {
    id: "cost-increase-approval",
    title: "Get a wholesale cost increase approved (1P)",
    category: "Pricing",
    audience: "1P",
    summary: "Why cost increase requests get rejected automatically and how to get one approved.",
    tags: ["cost increase", "wholesale", "price increase", "rejected", "tariff", "margin", "cogs", "negotiation", "vendor"],
    whyItMatters: `Any rise in your costs that you can't pass on to Amazon comes straight out of your net PPM. With tariffs, freight and materials all moving, a SKU can go negative while a cost increase sits unapproved. Getting increases through protects the product line and helps keep items out of [[crap-status]].`,
    problem: `Amazon's system **rejects most cost increase requests automatically**. It compares your new cost with the **retail price it can sell at** and with **prices it sees elsewhere online**. If the increase would push its retail price above competitors or wipe out its margin, the request is declined. Requests with no outside justification, or sent at the wrong time, are rejected automatically too.`,
    resolve: `1. **Raise your price on other channels first.** Amazon looks at pricing elsewhere, so a higher price everywhere else makes your case much stronger.
2. **Include documentation:** dated, SKU-specific evidence of higher input costs (raw materials, **tariff** notices, freight, labor).
3. **Time it** for Amazon's cost-change windows or your AVN, and raise it alongside your [[amazon-vendor-negotiation]].
4. **Go through your vendor manager** for important SKUs. Explain it in terms of keeping the item *profitable for Amazon*, so it stays out of [[crap-status]].
5. If a SKU that's now unprofitable keeps getting rejected, think about **re-SKUing**, bundling, or moving it to 3P where you set the price.`,
    caveat: `Amazon changes how cost increase requests work, how often you can submit them and when, so check the current process for your account.`,
  },
  {
    id: "crap-status",
    title: "Get out of CRAP status (Can't Realize A Profit)",
    category: "Inventory",
    audience: "1P",
    summary: "What it means when Amazon flags an item as unprofitable and stops ordering it, and how to fix it.",
    tags: ["crap", "cant realize a profit", "stopped ordering", "unprofitable", "po", "purchase order", "sourcing", "delist"],
    whyItMatters: `On 1P, a CRAP flag can end a perfectly good SKU without warning. Amazon doesn't tell you. **Purchase orders get smaller and then stop**, often while the item is still selling well. If you catch it early you can keep the revenue, and the fixes (better unit economics, higher reference prices) usually improve your own margin too. If you don't, Amazon may switch to "Sourced by Amazon" alternatives or delist the item, and you'll go into your next [[amazon-vendor-negotiation]] in a weaker position.`,
    problem: `**CRAP ("Can't Realize A Profit")** is Amazon's internal flag for items it loses money on. Common causes:
- Your wholesale cost is too high for the price Amazon can sell at and stay competitive.
- Poor unit economics: bulky, heavy or low-priced items where shipping eats the margin.
- Lots of returns, damages or heavy discounting.`,
    resolve: `1. **Improve the unit economics.** Lower your COGS, or cut size, weight or packaging (which can also qualify you for [[climate-pledge-friendly]] through Compact by Design).
2. **Re-SKU or bundle** to reset the price reference and create an ASIN with a better margin.
3. **Raise your MSRP and pricing elsewhere** so Amazon's target price goes up (see [[cost-increase-approval]]).
4. **Offer cost-saving programs** in your [[amazon-vendor-negotiation]] (Direct Import, Vendor Flex, FFP) that make the item cheaper for Amazon to sell.
5. If Amazon still can't make money on it, **move the SKU to 3P** where you set the price (see [[one-p-vs-three-p]]).`,
    caveat: `"CRAP" is an internal Amazon term and the exact triggers and fixes aren't published, so check the details with your vendor manager.`,
  },
  {
    id: "net-ppm-contribution-profit",
    title: "Calculate your real net PPM / contribution profit (1P)",
    category: "Profitability",
    audience: "1P",
    summary: "How to work out what you actually earn per unit after every Amazon deduction.",
    tags: ["net ppm", "pure profit per unit", "contribution profit", "margin", "profitability", "deductions", "coop", "fools gold"],
    whyItMatters: `High 1P revenue can be misleading. Once co-op, ads, chargebacks, freight and returns come out, a "top seller" can turn out to lose money. **Net PPM (pure profit per unit)** shows which SKUs are actually paying for your business, and it's the first sign you'll get before [[crap-status]] cuts off purchase orders.`,
    problem: `A lot of vendors calculate profit as wholesale price minus COGS and stop there. The real formula per unit is **net = wholesale price received − COGS − every Amazon deduction**. The deductions to take out are **co-op, accruals and allowances**, freight and inbound costs, **chargebacks and shortages**, damages and returns, and any **advertising** you pay for. Leaving out co-op and ads makes profit look much better than it is.`,
    resolve: `1. Pull Vendor Central's **profitability / net PPM** report for a per-ASIN view, and check it against your remittances and deduction reports.
2. Build a sheet per SKU that separates the profitable ASINs from the **"Fool's Gold" ASINs**: high revenue, but close to zero or negative once every deduction is counted.
3. Drop or fix SKUs that are always negative, request [[cost-increase-approval]] on thin ones, and move SKUs that can't be made profitable to 3P ([[one-p-vs-three-p]]).
4. Track net PPM by ASIN every month. It's the best early warning for [[crap-status]].`,
    caveat: `Check which deductions your terms include and how Vendor Central defines "net PPM" for your account before relying on the dashboard number.`,
  },
  {
    id: "one-p-vs-three-p",
    title: "1P, 3P or both?",
    category: "Strategy",
    audience: "Both",
    summary: "How 1P (Vendor) and 3P (Seller) compare on economics and control, and how to choose for each SKU.",
    tags: ["1p", "3p", "vendor central", "seller central", "hybrid", "model", "decision", "move to 3p", "economics", "control"],
    whyItMatters: `This decides who sets your price, how your margin is structured and who carries the risk, and you can choose differently for each SKU. Picking the right model often matters more than any fine-tuning within one channel. A SKU that can't make money on 1P can do fine on 3P just because you're now the one setting the price.`,
    problem: `**1P (Vendor Central):** you sell wholesale *to* Amazon, and Amazon controls retail price, the buy box and ordering. Upsides: scale, the trust of "Ships from and sold by Amazon", and less work on your end. Downsides: **no control over price**, co-op and chargebacks, unpredictable POs and the risk of [[crap-status]].
**3P (Seller Central):** you sell *to customers* through Amazon. Upsides: **you set the price**, the margin and the catalog, and you get better data. Downsides: you handle fulfillment and operations, you pay for ads, and you have to compete for the buy box. A SKU on the wrong model usually shows up as thin margins, MAP erosion or POs that dry up.`,
    resolve: `1. **Price-sensitive, brand-controlled or MAP-critical items:** lean toward **3P**, where you set the price.
2. **High-volume commodity items** where Amazon's scale helps and the margin survives co-op: **1P** can work.
3. **Items that lose money on 1P** (negative net PPM or [[crap-status]]): move them to **3P**.
4. **New launches:** many brands start on **3P** to control price and reviews, then take 1P invitations selectively.
5. **A mix of both** is common: keep steady high-volume SKUs on 1P and move price-sensitive or thin-margin ones to 3P. Watch out for both channels competing on the same ASIN.`,
    caveat: `Amazon can also move items between models itself, so check what switching would mean for your account before you move SKUs.`,
  },
  {
    id: "amazon-vendor-negotiation",
    title: "Prepare for your Annual Vendor Negotiation (AVN)",
    category: "Negotiation",
    audience: "1P",
    summary: "What to bring to the AVN and how to negotiate when Amazon controls pricing.",
    tags: ["avn", "annual vendor negotiation", "terms", "coop", "allowance", "negotiation", "discount", "renewal", "leverage"],
    whyItMatters: `The **Annual Vendor Negotiation (AVN)** sets your terms for the whole year: co-op percentages, payment terms, funding and growth commitments. If those terms slip by a point or two every year, it adds up to a big hit on your net margin. How well you prepare decides whether you get anything back for what you give up.`,
    problem: `Amazon's team walks in with all of your performance data, and they look at it every day of the year. Vendors who show up without their own numbers end up agreeing to terms they can't afford, and that cost is locked in for another year.`,
    whatYouNeed: `- Your **net PPM by ASIN** ([[net-ppm-contribution-profit]]), so you know which terms you can afford.
- Your total co-op and allowance percentage, and what it's actually getting you.
- Your performance story: sell-through, in-stock rate, growth and low chargebacks.`,
    resolve: `1. **Talk about Amazon's profit.** Proposals that keep items profitable for Amazon (and out of [[crap-status]]) get a much better reception.
2. **Push co-op and allowance percentages down** where they aren't paying off, and tie any funding to specific growth.
3. **Offer cost-saving programs** (Direct Import, Vendor Flex, FFP) that make you cheaper for Amazon to work with, in exchange for better terms.
4. Bring your **cost increase requests** ([[cost-increase-approval]]) into the same conversation.
5. Know your limits. Negotiating hard usually won't cost you the account, and a strong 3P business gives you real bargaining power ([[one-p-vs-three-p]]).`,
    caveat: `How the AVN works and when it happens varies by category and year, so check the details with your vendor manager.`,
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
