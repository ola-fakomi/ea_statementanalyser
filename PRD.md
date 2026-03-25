# Product Requirements Document
## Entrepreneurs Anonymous — Session 5 Financial Toolkit
**Version:** 1.0
**Date:** March 25, 2026
**Owner:** Kelli Lewis · KelliWorks Accounting Firm
**Status:** Live

---

## 1. Product Overview

### 1.1 Purpose
A free, browser-based financial toolkit built for small business owners attending **Entrepreneurs Anonymous (EA) Session 5: Know Your Numbers**. The tool enables participants to self-assess their financial literacy, analyse their bank statements, benchmark against industry norms, and calculate a fair owner salary — all before the live session on March 25.

### 1.2 Problem Statement
Most small business owners operate without knowing their profit margin, paying themselves inconsistently, or having no visibility into where money is going. They either lack access to accountant-level tools, or lack the financial vocabulary to use them. This toolkit lowers that barrier by making financial analysis instant, private, and jargon-free.

### 1.3 Goals
- Give every EA participant a financial baseline before Session 5
- Remove friction from financial self-assessment (no login, no install, no uploads to a server)
- Make industry benchmarks accessible and personally relevant
- Drive attendance and engagement at the live session on March 25

### 1.4 Non-Goals
- This is not a replacement for professional accounting advice
- This is not a bookkeeping or accounting software platform
- This does not store, transmit, or process data on a server
- This does not integrate with bank APIs or third-party financial services

---

## 2. Users

### 2.1 Primary User
**Small business owner / entrepreneur** attending EA Session 5. Typically:
- Has been in business 1–5 years
- Does not have a dedicated CFO or financial advisor
- Has uneven financial habits — may not review numbers regularly
- Has some awareness of revenue but limited visibility into margins or owner pay
- May be intimidated by financial terminology

### 2.2 User Goals
| Goal | Tool That Serves It |
|---|---|
| Understand current financial health | Number Cruncher |
| Know if their numbers are "normal" | Industry Benchmarks |
| Figure out what to pay themselves | Salary Calculator |
| Prepare a talking point for the live session | Quiz + Number Cruncher CTA |
| Feel safe sharing financial reality | EA Rules tab |

---

## 3. Product Architecture

### 3.1 Tech Stack
| Layer | Choice | Rationale |
|---|---|---|
| Rendering | Vanilla HTML5 | No build step, instant open-in-browser |
| Styling | CSS3 (custom properties) | No framework dependency, full design control |
| Logic | Vanilla JavaScript (ES6+) | Zero dependencies, runs 100% client-side |
| Fonts | Google Fonts (Playfair Display, DM Sans) | Design fidelity without asset management |
| Deployment | Vercel (static) | Zero-config, instant CDN, free tier |

### 3.2 File Structure
```
/
├── index.html          — App shell and all HTML markup
├── vercel.json         — Deployment config + security headers
├── css/
│   └── styles.css      — All visual styles
└── js/
    ├── data.js         — Industry and structure data constants
    ├── app.js          — Tab switching, utility functions, init
    ├── quiz.js         — Quiz logic and scoring
    ├── cruncher.js     — CSV parsing, manual entry, results rendering
    └── benchmarks.js   — Benchmark display and salary calculator
```

### 3.3 Privacy Model
All computation happens in the browser. No data is sent to any server. No cookies, no localStorage, no analytics that capture financial inputs. File contents are read via the FileReader API and discarded when the page is closed or refreshed.

---

## 4. Design System

### 4.1 Colour Tokens
| Token | Hex | Usage |
|---|---|---|
| `--navy` | `#1E2A4A` | Primary dark backgrounds, nav, cards |
| `--navy2` | `#2D3D6A` | Hero decorative elements |
| `--gold` | `#C9AA71` | Primary accent, CTAs, active states |
| `--gold-light` | `#e8d4a8` | Hover states on gold elements |
| `--red` | `#C0392B` | Brand badge, warning CTAs |
| `--text` | `#C8D0E0` | Body text on dark backgrounds |
| `--muted` | `#A0AEC0` | Secondary text on dark backgrounds |
| `--dim` | `#6B7DA0` | Tertiary/disabled text |
| `--green` | `#22863a` | Positive metric values |
| `--amber` | `#b45309` | Warning metric values |
| `--rose` | `#b22222` | Critical/negative metric values |
| `--bg-light` | `#f8f7f4` | Light card backgrounds |

### 4.2 Typography
| Role | Font | Weight | Size |
|---|---|---|---|
| Display headings | Playfair Display | 700 / 900 | `clamp(32px, 5vw, 52px)` |
| Card titles | Playfair Display | 700 | 22px |
| KPI values | Playfair Display | 700 | 18–22px |
| Body / UI | DM Sans | 400–700 | 12–16px |
| Labels / badges | DM Sans | 700 | 9–11px, uppercase, tracked |

### 4.3 Layout
- Max content width: `800px`, centred
- Mobile breakpoint: `520px`
- Sticky nav height: `65px`
- Sticky tab bar height: `~48px`
- Content padding: `40px 24px 80px`

### 4.4 Component Patterns
- **Dark cards** — navy background, used for hero content and quiz questions
- **Light cards** — white background with warm border (`#e5e0d8`), used for data-entry and results
- **Gold accent bar** — 4px left border on benchmark cards to signal active selection
- **Pills** — small rounded labels for status, format tags, bank names
- **Progress bars** — animated fill bars used in spending breakdowns and salary visualisation

---

## 5. Features & Components

---

### 5.1 Navigation Bar

**Location:** Fixed top, `z-index: 100`

| Element | Detail |
|---|---|
| EA logo mark | Red square, white "EA" text, 36×36px, 8px radius |
| Brand name | "Entrepreneurs Anonymous · KelliWorks", gold, uppercase |
| Session badge | Red pill — "● Session 5 · March 25" with animated dot |

**Behaviour:**
- Stays sticky on scroll above all content
- On mobile (`<520px`): brand name text is hidden, only logo and badge show

---

### 5.2 Hero Section

**Purpose:** Entry point and value proposition.

| Element | Detail |
|---|---|
| Eyebrow | "Free Pre-Session Tools · Session 5" — gold, uppercase |
| Headline | "Stop Guessing. *Start Knowing* Your Numbers." — Playfair Display, `clamp(32px, 5vw, 52px)` |
| Subheading | Describes the three tools and the March 25 event hook |
| Primary CTA | Gold button — "Take the Quiz →" — jumps to Quiz tab |
| Secondary CTA | Outline button — "Upload Statement →" — jumps to Number Cruncher tab |
| Background | Navy with two decorative navy2-coloured circles (pseudo-elements) for depth |

---

### 5.3 Tab Navigation

**Location:** Sticky below nav, `z-index: 90`

**Four tabs:**
1. Financial Quiz
2. Number Cruncher
3. Industry Benchmarks
4. EA Rules

**Behaviour:**
- Active tab shows gold underline and gold text
- Switching tabs scrolls viewport to the tab bar
- Tabs are horizontally scrollable on narrow screens (`min-width: 580px` inner container)
- Default active tab on load: **Financial Quiz**

---

### 5.4 Tab 1 — Financial Quiz

**Purpose:** Self-assessment to establish financial clarity baseline before the session.

#### 5.4.1 Quiz Form

Five questions, each with four radio options scored 0–3:

| Q | Topic | 3 pts | 0 pts |
|---|---|---|---|
| Q1 | Profit margin awareness | Knows off the top of their head | Doesn't track it |
| Q2 | How they pay themselves | Consistent intentional salary | Rarely pays themselves |
| Q3 | Top 3 expenses recall | Names them easily | Honestly doesn't know |
| Q4 | Emergency buffer | 3+ months funded | No buffer |
| Q5 | Last financial review | This week | Can't remember |

**Interactions:**
- Selecting an option highlights the row (gold border + background)
- Submit button is **disabled** until all 5 questions are answered
- Submit button label: "See My Results →"

#### 5.4.2 Quiz Results

Calculated score: `(total / 15) × 100`

**Score tiers:**

| Range | Label | Colour |
|---|---|---|
| 80–100% | Financially Aware | Green `#4CAF50` |
| 53–79%  | Getting There | Gold `#C9AA71` |
| 0–52%   | Needs Attention | Red `#C0392B` |

**Results display:**
- Score circle (percentage, coloured border matching tier)
- Label and tier headline
- Personalised summary paragraph
- Per-question insight cards — red-bordered for flags, gold-bordered for strengths
- CTA card (red background) — "Save My Spot · Free & Anonymous →" linking to calendar
- "Retake Quiz" text link at bottom

**Insight flags triggered by low answers:**
- Q1 < 2 → "Profit margin blind spot"
- Q2 < 2 → "Owner pay needs structure"
- Q3 < 2 → "Expense awareness gap"
- Q4 < 2 → "No financial buffer"
- Q5 < 2 → "Financials reviewed too infrequently"
- If 2+ strong answers → "You have real strengths here" (positive card)

---

### 5.5 Tab 2 — Number Cruncher

**Purpose:** Instant financial snapshot from a CSV bank export or manual entry. Fully client-side.

#### 5.5.1 Input Section

**Privacy badge:** Green pill — "🔒 100% Private — your data never leaves your browser"

**CSV export instructions** (collapsible card):
- 5-step numbered guide for exporting from online banking
- Supported banks displayed as pills: Chase, Bank of America, Wells Fargo, PNC, TD Bank, Capital One, US Bank, Any bank ✓

**Option 1 — CSV Upload:**

| Element | Detail |
|---|---|
| Drop zone | Dashed border, drag-and-drop or click to browse |
| File types accepted | `.csv`, `.xlsx`, `.xls` |
| Format pills | CSV, Excel (.xlsx), Bank exports, QuickBooks export |
| Choose File button | Navy background, gold text |
| Drag state | Border turns gold, background tints gold on dragover |

**Option 2 — Manual Entry Form:**

| Field ID | Label |
|---|---|
| `mRevenue` | Total Revenue / Income |
| `mPayroll` | Payroll / Contractor Costs |
| `mRent` | Rent / Office / Facilities |
| `mSoftware` | Software & Subscriptions |
| `mMarketing` | Marketing & Advertising |
| `mCOGS` | Cost of Goods / Materials |
| `mMisc` | Meals / Travel / Misc |
| `mOwnerPay` | What You Paid Yourself |
| `mIndustry` | Industry (select, 8 options) |
| `mPeriod` | Period Covered (1 / 3 / 12 months) |

- Two-column grid layout, collapsing to one column on mobile
- Submit button: "Generate My Financial Snapshot →" (full-width gold)
- Revenue is required; all other fields default to 0

#### 5.5.2 CSV Parser

The parser runs entirely in-browser and handles multiple bank export formats.

**Column detection strategy:**
1. Scan headers via regex for: description, amount, debit, credit, deposit, withdrawal
2. Fallback: use first non-numeric-looking column as description

**Amount parsing — 3 strategies (in priority order):**
1. Separate debit/credit columns (e.g. Chase, Wells Fargo)
2. Single signed amount column (negative = debit, positive = credit)
3. Scan all columns for a signed number

**Expense categorisation by keyword matching:**

| Category | Sample keywords matched |
|---|---|
| Payroll | payroll, salary, gusto, adp, paychex, contractor, freelance, zelle |
| Rent | rent, lease, office, cowork, wework, suite |
| Software | zoom, slack, adobe, notion, hubspot, quickbooks, shopify, stripe fee |
| Marketing | facebook ad, google ad, instagram ad, canva, meta ads, hootsuite |
| Food/Meals | restaurant, food, uber eats, doordash, starbucks, chipotle |
| Misc | everything else (catch-all) |

**Period estimation:** `Math.max(1, Math.min(12, Math.round(txCount / 25)))` — assumes ~25 transactions/month for a small business.

**Edge case — no income detected:** If `totalIn === 0` and `totalOut > 0` (some banks only export debits), a prompt asks the user to manually enter their revenue before proceeding.

**Error handling:**
- Zero transactions parsed → alert with tip to use manual entry
- FileReader error → alert with fallback to manual entry

#### 5.5.3 Verification Strip (CSV uploads only)

Shown above results after a successful file parse:

- Green-bordered white card
- Three stat boxes: Income Detected / Expenses Detected / Period Detected
- Annualisation multiplier explanation
- Link to reset to manual entry if numbers look wrong

#### 5.5.4 Results Display

**Results header:**
- "Your Financial Snapshot" title
- Period badge (e.g. "CSV Analysis · 87 transactions · ~3 months")

**KPI Grid (4 boxes):**

| KPI | Colour Logic |
|---|---|
| Annual Revenue | Navy (neutral) |
| Total Expenses | Amber (cost) |
| Net Profit Margin | Green / Amber / Rose based on % of industry target |
| Owner Pay (Annual) | Amber |

Colour thresholds for margin:
- ≥ 80% of target → green
- ≥ 50% of target → amber
- < 50% of target → rose

**Spending Breakdown (bar chart):**
- Horizontal bars, sorted descending by amount
- Each bar shows: label, animated fill bar, % of revenue, dollar amount
- Categories: Payroll, Rent, Marketing, Software, COGS, Misc, Owner Pay
- Zero-value categories are hidden

**Benchmark Comparison:**
Four rows comparing user's numbers vs. industry target:
- Net Profit Margin
- Labor as % of Revenue
- Marketing as % of Revenue
- Owner Pay as % of Revenue

Each row shows: Your value / Benchmark target / Status badge (On track / Watch this / Needs attention)

**Insights & Flags (auto-generated):**

| Trigger | Insight Type |
|---|---|
| Margin < 50% of target | 🚨 Action — shows exact revenue/expense gap to close |
| Margin 50–99% of target | ⚠️ Warning — prompts review of top 2 expense categories |
| Margin ≥ target | ✅ Good — encourages maintaining margin during growth |
| Owner pay < $50K with revenue > $100K | 💰 Action — underpaying yourself flag |
| Labor > 130% of industry benchmark | 👥 Warning — high labor cost flag |

**Priority Actions (3 items):**
1. Always: "Bring these numbers to Session 5"
2. Always: "See what you should be paying yourself" (links to Salary Calculator)
3. Conditional: "Identify your biggest expense to cut" (low margin) OR "Plan your next pricing increase" (healthy margin)

**Bottom CTA box:** Red background — "Bring This to the Call" with calendar link button.

**Reset button:** "Start Over" — text link, returns to input section.

---

### 5.6 Tab 3 — Industry Benchmarks

**Purpose:** Browse real profit margin targets and owner salary ranges by industry. Includes a salary calculator.

Three inner sub-tabs:

#### 5.6.1 Sub-tab: Explore by Industry

**Industry selector:** Row of pill buttons (8 industries), active state navy background + gold text.

**Industries:**
| Key | Label |
|---|---|
| consulting | 🧠 Consulting & Coaching |
| professional | ⚖️ Professional Services |
| health | 🏥 Healthcare & Wellness |
| retail | 🛍️ Retail & E-Commerce |
| food | 🍽️ Restaurant & Food Service |
| construction | 🏗️ Construction & Trades |
| creative | 🎨 Creative & Agency |
| real_estate | 🏘️ Real Estate & Property |

**Benchmark card (rendered per selected industry):**

- Gold 4px left accent bar
- Industry name (Playfair Display)
- 3-column metrics grid:
  - Target Net Margin (range + aim-for value, colour-coded pill)
  - Owner Salary Range (low–high, typical noted)
  - Margin Difficulty (pill: Easy / Moderate / Challenging / Very challenging / Variable)
- "How Healthy Businesses Spend Their Revenue" — animated horizontal bar chart showing spend breakdown as % of revenue
- "Kelli's Take" — dark navy box with 💡 icon, plain-language advice specific to that industry

**Benchmark data per industry:**

| Industry | Net Margin Target | Owner Salary Range | #1 Driver |
|---|---|---|---|
| Consulting & Coaching | 20–30% (aim 25%) | $80K–$150K | Pricing power & utilization |
| Professional Services | 15–25% (aim 20%) | $75K–$140K | Utilization rate & pricing model |
| Healthcare & Wellness | 10–20% (aim 15%) | $70K–$130K | Revenue model & payer mix |
| Retail & E-Commerce | 5–12% (aim 8%) | $50K–$90K | COGS & inventory management |
| Restaurant & Food Service | 3–9% (aim 5%) | $45K–$80K | Food cost % and labor efficiency |
| Construction & Trades | 5–15% (aim 10%) | $60K–$110K | Job costing accuracy |
| Creative & Agency | 15–25% (aim 20%) | $60K–$110K | Scope management & retainers |
| Real Estate & Property | 15–25% (aim 20%) | $70K–$150K | Transaction volume & recurring fees |

#### 5.6.2 Sub-tab: Compare All

Full comparison table across all 8 industries:

| Column | Detail |
|---|---|
| Industry | Emoji + name |
| Net Margin Target | Coloured pill (green/amber/rose) |
| Typical Owner Salary | Range in $K |
| Difficulty | Text |
| #1 Cost Driver | Small grey text |

Source attribution: SBA, IRS, IBISWorld, NYU Stern

#### 5.6.3 Sub-tab: Salary Calculator

**Inputs:**
| Field | Type | Options |
|---|---|---|
| Industry | Select | 8 industries |
| Annual Gross Revenue | Number | Free entry |
| Total Annual Expenses | Number | Free entry (excludes owner pay) |
| Business Structure | Select | Sole Prop / S-Corp / C-Corp / Partnership |

**Business structure logic:**

| Structure | Pay Method | SE Tax Note | Rec % of Net |
|---|---|---|---|
| Sole Proprietor / Single-member LLC | Owner's Draw | SE tax (15.3%) on all profit; S-Corp election advised at $80K+ | 35% |
| S-Corporation | Salary + Distributions | Reasonable salary required; distributions avoid SE tax | 45% |
| C-Corporation | Salary + Bonus + Dividends | Double taxation on dividends; avoid unless raising investment | 50% |
| Partnership / Multi-member LLC | Guaranteed Payments + Distributions | Each partner pays SE tax on their share | 35% |

**Recommended salary calculation:**
```
recSalary = Math.min(netProfit × structure.rec_pct, industry.ownerSalary.high × 1000)
```

**Results display:**
- 2-box grid: Current Net Profit % (with on-target/below status) + Recommended Salary range
- Three animated bars: Expenses / Your Salary / Remaining Profit (% of revenue)
- Business structure explanation card
- "Next step" dark navy box — prompts user to bring numbers to March 25

---

### 5.7 Tab 4 — EA Rules

**Purpose:** Set community expectations and build psychological safety before the live session.

**Five rules:**

| # | Rule | Core message |
|---|---|---|
| 1 | You are anonymous | No last names or company names required |
| 2 | No registration needed | Just show up with the calendar link |
| 3 | What's shared here, stays here | No screenshots, no repeating outside the room |
| 4 | Come prepared | Do the quiz and number cruncher before March 25 |
| 5 | No selling. No pitching. | This is not a networking event |

Each rule uses a gold numbered circle, bold title, and muted body text, separated by thin gold dividers.

**Bottom CTA:** Full-width gold button — "Add to Calendar · March 25 · Free & Anonymous →"

---

### 5.8 Footer

| Element | Content |
|---|---|
| Brand | "Entrepreneurs Anonymous · Hosted by Kelli Lewis · KelliWorks Accounting Firm" |
| Event | "Session 5 · March 25 · Free & Anonymous · Add to Calendar →" |
| Disclaimer | "Educational tools only — not a substitute for professional accounting advice." |

---

## 6. Interactions & State

### 6.1 Tab Switching
- `switchTab(name)` — removes `active` from all panels and buttons, adds to target, smooth-scrolls to tab bar
- `switchBenchTab(name, btn)` — same pattern for inner benchmark sub-tabs
- State is not persisted across page refreshes (intentional — no localStorage)

### 6.2 Quiz State
- Submit button enabled only when all 5 questions answered
- Results replace the form in the same panel (no page nav)
- Retake restores the form

### 6.3 Number Cruncher State
- Input section and results section are mutually exclusive (one hidden, one shown)
- "Start Over" button restores input section and hides results
- CSV file input is cleared on reset
- Drag-and-drop fires the same `ncHandleFile` handler as the file input

### 6.4 Benchmarks State
- `activeInd` variable tracks selected industry (default: `consulting`)
- Industry selector buttons update `active` class via `selectInd(key)`
- All three benchmark sub-tabs start with `bench-panel-explore` active

---

## 7. Responsive Behaviour

| Breakpoint | Changes |
|---|---|
| `< 520px` | Nav brand text hidden; score display stacks vertically; NC form collapses to 1 column; salary calculator result grid collapses to 1 column |
| Tab bar | Horizontally scrollable, `min-width: 580px` inner container prevents wrapping |
| Hero headline | `clamp(32px, 5vw, 52px)` — fluid scaling between mobile and desktop |
| KPI grid | `repeat(auto-fit, minmax(140px, 1fr))` — reflows automatically |

---

## 8. Deployment

### 8.1 Vercel Configuration (`vercel.json`)
```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options",        "value": "DENY"    },
        { "key": "X-XSS-Protection",       "value": "1; mode=block" }
      ]
    }
  ]
}
```

### 8.2 Deployment Steps
1. Push repository to GitHub
2. Import project in Vercel dashboard (or use `vercel --prod` via CLI)
3. No build command or output directory configuration needed — Vercel serves `index.html` as the root
4. All static assets (`css/`, `js/`) are served from the same origin

### 8.3 Environment
- No environment variables
- No server-side functions
- No database
- No API keys

---

## 9. Known Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| PDF bank exports | PDF files cannot be parsed by the browser FileReader in this implementation | User is instructed to export as CSV instead |
| Banks that only export debits | `totalIn` will be 0 | A `prompt()` asks user to enter revenue manually before proceeding |
| Excel (.xlsx) | FileReader reads as text; xlsx binary format will fail silently | User should convert to CSV before uploading |
| Transaction period estimation | Calculated from tx count ÷ 25 — may be inaccurate for high-volume accounts | Verification strip shown to user with option to switch to manual entry |
| No persistence | Refreshing the page resets all data | User is advised to screenshot results |
| Mobile tab overflow | Tabs require horizontal scroll on very narrow screens | Consider compressing tab labels in a future version |

---

## 10. Future Considerations

These are not in scope for the current version but may be relevant for future sessions:

- **Session versioning** — Update session number, date, and CTA links for future EA sessions without touching logic
- **PDF parsing** — Integrate a client-side PDF text extractor (e.g. pdf.js) to parse PDF bank exports
- **Multi-file aggregation** — Merge data from multiple CSV uploads into a single combined analysis
- **Export to PDF** — Allow users to download their financial snapshot as a formatted PDF report
- **Shareable results link** — Encode results as URL params so users can share a read-only snapshot
- **Progress persistence** — Optional localStorage save so users can return to their results
- **Additional industries** — Expand the 8 current industries as the EA community grows
- **Localisation** — Support non-USD currencies and international bank CSV formats

---

## 11. Acceptance Criteria

| Feature | Passing Criteria |
|---|---|
| Quiz | All 5 questions required; score renders correctly in all 3 tiers; retake resets cleanly |
| CSV upload | Valid CSV from supported banks parses without error; spending bars render; KPIs are correct |
| Manual entry | Revenue required validation fires; all fields default to 0; annualisation is correct for all 3 periods |
| Verification strip | Shown only for CSV uploads; hidden for manual entry |
| Industry benchmarks | All 8 industries render full benchmark cards; comparison table populates; salary calculator outputs for all 4 structures |
| Salary calculator | Recommended salary capped at industry high; structure note displays correctly; bars animate on render |
| EA Rules | All 5 rules display; calendar CTA links to correct URL |
| Responsive | App is usable at 375px viewport width; no horizontal overflow on any tab at 390px |
| Privacy | No network requests made with user financial data; file stays in memory only |
| Deployment | Site loads and all tabs are functional on Vercel production URL |
