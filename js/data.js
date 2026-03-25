/* ── NUMBER CRUNCHER — Industry Data ─────────────────── */
const IND_DATA = {
  consulting:   { label: 'Consulting & Coaching',      targetMargin: 25, ownerPct: 35, laborPct: 45, marketingPct: 15, rentPct: 5,  softwarePct: 8,  cogsPct: 0  },
  professional: { label: 'Professional Services',      targetMargin: 20, ownerPct: 30, laborPct: 50, marketingPct: 10, rentPct: 15, softwarePct: 5,  cogsPct: 0  },
  health:       { label: 'Healthcare & Wellness',      targetMargin: 15, ownerPct: 25, laborPct: 55, marketingPct: 5,  rentPct: 12, softwarePct: 3,  cogsPct: 0  },
  retail:       { label: 'Retail & E-Commerce',        targetMargin: 8,  ownerPct: 15, laborPct: 15, marketingPct: 12, rentPct: 10, softwarePct: 3,  cogsPct: 55 },
  food:         { label: 'Restaurant & Food Service',  targetMargin: 5,  ownerPct: 10, laborPct: 35, marketingPct: 5,  rentPct: 12, softwarePct: 2,  cogsPct: 32 },
  construction: { label: 'Construction & Trades',      targetMargin: 10, ownerPct: 20, laborPct: 25, marketingPct: 5,  rentPct: 5,  softwarePct: 2,  cogsPct: 50 },
  creative:     { label: 'Creative & Agency',          targetMargin: 20, ownerPct: 30, laborPct: 50, marketingPct: 10, rentPct: 5,  softwarePct: 10, cogsPct: 0  },
  real_estate:  { label: 'Real Estate & Property',     targetMargin: 20, ownerPct: 30, laborPct: 25, marketingPct: 15, rentPct: 10, softwarePct: 5,  cogsPct: 0  },
};

/* ── INDUSTRY BENCHMARKS — Full Benchmark Data ───────── */
const INDUSTRIES_DATA = [
  {
    key: 'consulting', emoji: '🧠', label: 'Consulting & Coaching',
    netMargin:   { low: 20, high: 30, target: 25 },
    ownerSalary: { low: 80, high: 150, typical: 100 },
    spends: [
      { label: 'Labor (yourself + team)', pct: 45, color: '#1B2A4A' },
      { label: 'Marketing & sales',       pct: 15, color: '#C9A84C' },
      { label: 'Software & tools',        pct: 8,  color: '#5B8FD4' },
      { label: 'Overhead & admin',        pct: 12, color: '#7CB87A' },
      { label: 'Owner profit',            pct: 20, color: '#22863a' },
    ],
    tip: 'Your margin should be 20%+ minimum. If it\'s not, your pricing is too low or scope is creeping. Document everything and charge for everything.',
    scoreboard: { difficulty: 'Easy to achieve', margin_class: 'pill-green', primary_driver: 'Pricing power & utilization rate' },
  },
  {
    key: 'professional', emoji: '⚖️', label: 'Professional Services',
    netMargin:   { low: 15, high: 25, target: 20 },
    ownerSalary: { low: 75, high: 140, typical: 95 },
    spends: [
      { label: 'Labor & salaries',        pct: 50, color: '#1B2A4A' },
      { label: 'Office & overhead',       pct: 15, color: '#C9A84C' },
      { label: 'Marketing',               pct: 10, color: '#5B8FD4' },
      { label: 'Insurance & compliance',  pct: 5,  color: '#D47B5B' },
      { label: 'Owner profit',            pct: 20, color: '#22863a' },
    ],
    tip: 'Retainer-based revenue beats project fees for margin stability. Target 75–80% billable hours.',
    scoreboard: { difficulty: 'Moderate', margin_class: 'pill-green', primary_driver: 'Utilization rate & pricing model' },
  },
  {
    key: 'health', emoji: '🏥', label: 'Healthcare & Wellness',
    netMargin:   { low: 10, high: 20, target: 15 },
    ownerSalary: { low: 70, high: 130, typical: 90 },
    spends: [
      { label: 'Labor & clinical staff',  pct: 55, color: '#1B2A4A' },
      { label: 'Insurance & compliance',  pct: 12, color: '#D47B5B' },
      { label: 'Facility & equipment',    pct: 13, color: '#C9A84C' },
      { label: 'Marketing',               pct: 5,  color: '#5B8FD4' },
      { label: 'Owner profit',            pct: 15, color: '#22863a' },
    ],
    tip: 'Group services, packages, and memberships dramatically improve margins. Cash-pay services are your margin savior.',
    scoreboard: { difficulty: 'Moderate', margin_class: 'pill-amber', primary_driver: 'Revenue model & payer mix' },
  },
  {
    key: 'retail', emoji: '🛍️', label: 'Retail & E-Commerce',
    netMargin:   { low: 5, high: 12, target: 8 },
    ownerSalary: { low: 50, high: 90, typical: 65 },
    spends: [
      { label: 'Cost of goods (COGS)',    pct: 55, color: '#1B2A4A' },
      { label: 'Labor',                   pct: 15, color: '#D47B5B' },
      { label: 'Rent & utilities',        pct: 10, color: '#C9A84C' },
      { label: 'Marketing & ads',         pct: 12, color: '#5B8FD4' },
      { label: 'Owner profit',            pct: 8,  color: '#22863a' },
    ],
    tip: 'You need gross margins of 40–50% to hit a 5–10% net margin. COGS control is everything.',
    scoreboard: { difficulty: 'Challenging', margin_class: 'pill-amber', primary_driver: 'COGS & inventory management' },
  },
  {
    key: 'food', emoji: '🍽️', label: 'Restaurant & Food Service',
    netMargin:   { low: 3, high: 9, target: 5 },
    ownerSalary: { low: 45, high: 80, typical: 55 },
    spends: [
      { label: 'Food & beverage costs',   pct: 32, color: '#1B2A4A' },
      { label: 'Labor',                   pct: 35, color: '#D47B5B' },
      { label: 'Rent & utilities',        pct: 12, color: '#C9A84C' },
      { label: 'Marketing & misc',        pct: 8,  color: '#5B8FD4' },
      { label: 'Owner profit',            pct: 5,  color: '#22863a' },
    ],
    tip: 'The 30/30 rule: food costs and labor each should not exceed 30% of revenue. If either is over 33%, you\'re losing money.',
    scoreboard: { difficulty: 'Very challenging', margin_class: 'pill-rose', primary_driver: 'Food cost % and labor efficiency' },
  },
  {
    key: 'construction', emoji: '🏗️', label: 'Construction & Trades',
    netMargin:   { low: 5, high: 15, target: 10 },
    ownerSalary: { low: 60, high: 110, typical: 75 },
    spends: [
      { label: 'Materials & subs',        pct: 50, color: '#1B2A4A' },
      { label: 'Labor',                   pct: 25, color: '#D47B5B' },
      { label: 'Equipment & vehicles',    pct: 8,  color: '#C9A84C' },
      { label: 'Overhead & insurance',    pct: 7,  color: '#5B8FD4' },
      { label: 'Owner profit',            pct: 10, color: '#22863a' },
    ],
    tip: 'Accurate job costing before quoting is the single most important financial habit. A 10% markup on a poorly estimated job can still lose money.',
    scoreboard: { difficulty: 'Moderate', margin_class: 'pill-amber', primary_driver: 'Job costing accuracy' },
  },
  {
    key: 'creative', emoji: '🎨', label: 'Creative & Agency',
    netMargin:   { low: 15, high: 25, target: 20 },
    ownerSalary: { low: 60, high: 110, typical: 80 },
    spends: [
      { label: 'Labor & contractors',     pct: 50, color: '#1B2A4A' },
      { label: 'Software & tools',        pct: 10, color: '#C9A84C' },
      { label: 'Marketing & biz dev',     pct: 10, color: '#5B8FD4' },
      { label: 'Overhead',                pct: 10, color: '#D47B5B' },
      { label: 'Owner profit',            pct: 20, color: '#22863a' },
    ],
    tip: 'Productized service packages transform margin unpredictability. Scope creep is the silent killer — contract every project meticulously.',
    scoreboard: { difficulty: 'Moderate', margin_class: 'pill-green', primary_driver: 'Scope management & retainers' },
  },
  {
    key: 'real_estate', emoji: '🏘️', label: 'Real Estate & Property',
    netMargin:   { low: 15, high: 25, target: 20 },
    ownerSalary: { low: 70, high: 150, typical: 95 },
    spends: [
      { label: 'Commissions & splits',    pct: 40, color: '#1B2A4A' },
      { label: 'Marketing & advertising', pct: 15, color: '#C9A84C' },
      { label: 'Admin & technology',      pct: 10, color: '#5B8FD4' },
      { label: 'Overhead',                pct: 15, color: '#D47B5B' },
      { label: 'Owner profit',            pct: 20, color: '#22863a' },
    ],
    tip: 'Recurring property management fees are more valuable than commission income — they create predictable monthly revenue.',
    scoreboard: { difficulty: 'Variable', margin_class: 'pill-green', primary_driver: 'Transaction volume & recurring fees' },
  },
];

/* ── SALARY CALCULATOR — Business Structure Data ─────── */
const STRUCTURE_TIPS = {
  sole:    {
    name: 'Sole Proprietor/Single-Member LLC', method: 'Owner\'s Draw',
    tax_note: 'You pay self-employment tax (15.3%) on ALL net profit. At profits over $80K, an S-Corp election usually saves more than it costs.',
    rec_pct: 0.35,
  },
  scorp:   {
    name: 'S-Corporation', method: 'Salary + Distributions',
    tax_note: 'IRS requires a \'reasonable salary\' via payroll. Remaining profit as distributions avoids self-employment tax — this is where the savings live.',
    rec_pct: 0.45,
  },
  ccorp:   {
    name: 'C-Corporation', method: 'Salary + Bonus + Dividends',
    tax_note: 'You are an employee of your own company. Dividends face double taxation. Most small businesses avoid C-Corp unless seeking investment.',
    rec_pct: 0.50,
  },
  partner: {
    name: 'Partnership/Multi-Member LLC', method: 'Guaranteed Payments + Distributions',
    tax_note: 'Each partner pays self-employment tax on their share. Agreements should define salary, distribution splits, and capital accounts clearly.',
    rec_pct: 0.35,
  },
};
