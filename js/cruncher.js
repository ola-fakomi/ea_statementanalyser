/* ── CSV PARSER ──────────────────────────────────────── */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return null;

  function parseLine(line) {
    const cols = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"')               { inQ = !inQ; }
      else if (c === ',' && !inQ)  { cols.push(cur.trim()); cur = ''; }
      else                         { cur += c; }
    }
    cols.push(cur.trim());
    return cols;
  }

  const headers = parseLine(lines[0]).map(h => h.replace(/['"]/g, '').toLowerCase().trim());

  // Detect column indices
  let iDesc = -1, iAmount = -1, iDebit = -1, iCredit = -1, iDeposit = -1, iWithdraw = -1;
  headers.forEach((h, i) => {
    if (/desc|memo|narr|detail|name|payee|transaction|merchant/.test(h))          iDesc    = i;
    if (/^amount$|net amount|tran.*amount/.test(h))                                iAmount  = i;
    if (/debit|withdrawal|out|charge|payment out/.test(h) && !/credit/.test(h))   iDebit   = i;
    if (/credit|deposit|in|received/.test(h) && !/debit/.test(h))                 iCredit  = i;
    if (/deposit/.test(h) && !/debit/.test(h))                                    iDeposit = i;
    if (/withdraw|debit/.test(h) && !/credit/.test(h))                            iWithdraw = i;
  });

  // Fallback: use first non-numeric-looking column as description
  if (iDesc === -1) {
    for (let i = 0; i < headers.length; i++) {
      if (!/date|amount|balance|debit|credit|deposit|withdraw|total/.test(headers[i])) {
        iDesc = i; break;
      }
    }
  }

  let totalIn = 0, totalOut = 0, txCount = 0;
  const cat = { payroll: 0, rent: 0, software: 0, marketing: 0, food: 0, misc: 0 };

  // Keyword lists for categorisation
  const PW = ['payroll','salary','gusto','adp','paychex','contractor','freelance','direct dep','zelle','venmo receive','ach receive'];
  const RK = ['rent','lease','office','cowork','wework','suite'];
  const SW = ['software','subscription','saas','adobe','zoom','slack','dropbox','notion','hubspot','mailchimp','quickbooks','shopify','square','stripe fee','paypal fee','microsoft','google workspace','godaddy'];
  const MK = ['marketing','advertising','facebook ad','google ad','instagram ad','seo','social media','canva','hootsuite','meta ads','tiktok'];
  const FK = ['restaurant','food','uber eats','doordash','grubhub','dining','coffee','starbucks','chipotle','mcdonald'];

  for (let i = 1; i < lines.length; i++) {
    const cols    = parseLine(lines[i]).map(c => c.replace(/['"]/g, '').trim());
    if (cols.length < 2) continue;

    const descRaw = iDesc >= 0 && iDesc < cols.length ? cols[iDesc] : '';
    const desc    = descRaw.toLowerCase();

    // Strategy 1: separate debit/credit columns
    if ((iDebit > -1 || iWithdraw > -1) && (iCredit > -1 || iDeposit > -1)) {
      const dCol      = iDebit   > -1 ? cols[iDebit]   : cols[iWithdraw];
      const cCol      = iCredit  > -1 ? cols[iCredit]  : cols[iDeposit];
      const debitAmt  = Math.abs(parseFloat(dCol.replace(/[$,\s]/g, '')) || 0);
      const creditAmt = Math.abs(parseFloat(cCol.replace(/[$,\s]/g, '')) || 0);
      if (creditAmt > 0) { totalIn  += creditAmt; txCount++; }
      if (debitAmt  > 0) {
        totalOut += debitAmt; txCount++;
        if      (PW.some(k => desc.includes(k))) cat.payroll   += debitAmt;
        else if (RK.some(k => desc.includes(k))) cat.rent      += debitAmt;
        else if (SW.some(k => desc.includes(k))) cat.software  += debitAmt;
        else if (MK.some(k => desc.includes(k))) cat.marketing += debitAmt;
        else if (FK.some(k => desc.includes(k))) cat.food      += debitAmt;
        else                                     cat.misc      += debitAmt;
      }
      continue;
    }

    // Strategy 2: single signed amount column
    let signedAmt = null;
    if (iAmount > -1 && iAmount < cols.length) {
      const raw = cols[iAmount].replace(/[$,\s]/g, '');
      const n   = parseFloat(raw);
      if (!isNaN(n) && n !== 0) signedAmt = n;
    }

    // Strategy 3: scan all columns for a signed number
    if (signedAmt === null) {
      for (let c = 0; c < cols.length; c++) {
        if (c === iDesc) continue;
        const raw = cols[c].replace(/[$,\s]/g, '');
        const n   = parseFloat(raw);
        if (!isNaN(n) && n !== 0) { signedAmt = n; break; }
      }
    }
    if (signedAmt === null) continue;

    txCount++;
    if (signedAmt > 0) {
      totalIn += signedAmt;
    } else {
      const amt = Math.abs(signedAmt);
      totalOut += amt;
      if      (PW.some(k => desc.includes(k))) cat.payroll   += amt;
      else if (RK.some(k => desc.includes(k))) cat.rent      += amt;
      else if (SW.some(k => desc.includes(k))) cat.software  += amt;
      else if (MK.some(k => desc.includes(k))) cat.marketing += amt;
      else if (FK.some(k => desc.includes(k))) cat.food      += amt;
      else                                     cat.misc      += amt;
    }
  }

  return { totalIn, totalOut, cat, txCount, lineCount: lines.length - 1 };
}

/* ── FILE HANDLER ────────────────────────────────────── */
function ncHandleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const result = parseCSV(e.target.result);
      if (!result || result.txCount === 0) {
        alert('Could not read transaction amounts from this file.\n\nTip: Make sure you exported as CSV (not PDF) from your bank. You can also use the manual entry option below.');
        return;
      }
      const { totalIn, totalOut, cat, txCount } = result;

      // If income is 0, bank may only export debits — ask for revenue manually
      if (totalIn === 0 && totalOut > 0) {
        const manualRev = parseFloat(prompt(
          `Your file shows $${Math.round(totalOut).toLocaleString()} in expenses across ${txCount} transactions, but no income was detected.\n\nThis can happen if your bank only exports expense transactions.\n\nPlease enter your total revenue for this period:`
        ));
        if (!manualRev || isNaN(manualRev)) {
          alert('Revenue entry cancelled. Please use manual entry instead.');
          return;
        }
        buildFileResults(manualRev, totalOut, cat, txCount);
        return;
      }
      buildFileResults(totalIn, totalOut, cat, txCount);
    } catch (err) {
      console.error(err);
      alert('Something went wrong reading the file. Please try manual entry instead.');
    }
  };
  reader.readAsText(file);
}

/* ── BUILD RESULTS FROM FILE DATA ────────────────────── */
function buildFileResults(totalIn, totalOut, cat, txCount) {
  // Estimate months from transaction count (avg ~25 tx/month for a small business)
  const months = Math.max(1, Math.min(12, Math.round(txCount / 25)));
  const mult   = 12 / months;

  const aR   = totalIn             * mult;
  const aP   = cat.payroll         * mult;
  const aRt  = cat.rent            * mult;
  const aS   = cat.software        * mult;
  const aM   = cat.marketing       * mult;
  const aMi  = (cat.misc + cat.food) * mult;

  const totalExp  = aP + aRt + aS + aM + aMi;
  const netProfit = aR - totalExp;
  const netMargin = aR > 0 ? (netProfit / aR) * 100 : 0;
  const indKey    = document.getElementById('mIndustry')?.value || 'consulting';
  const monthLabel = months === 1 ? '1 month' : months === 12 ? 'Full year' : `${months} months`;

  ncRenderResults({
    periodLabel:    `CSV Analysis · ${txCount} transactions · ~${monthLabel}`,
    annualRev:      aR,
    annualPayroll:  aP,
    annualRent:     aRt,
    annualSoftware: aS,
    annualMarketing: aM,
    annualCOGS:     0,
    annualMisc:     aMi,
    annualOwner:    0,
    totalExpenses:  totalExp,
    netProfit,
    netMargin,
    ind:      IND_DATA[indKey],
    fromFile: true,
    rawIn:    totalIn,
    rawOut:   totalOut,
    months,
  });
}

/* ── MANUAL ENTRY HANDLER ────────────────────────────── */
function ncAnalyzeManual() {
  const rev = parseFloat(document.getElementById('mRevenue').value) || 0;
  if (!rev) { alert('Please enter your revenue to continue.'); return; }

  const payroll  = parseFloat(document.getElementById('mPayroll').value)  || 0;
  const rent     = parseFloat(document.getElementById('mRent').value)     || 0;
  const software = parseFloat(document.getElementById('mSoftware').value) || 0;
  const marketing= parseFloat(document.getElementById('mMarketing').value)|| 0;
  const cogs     = parseFloat(document.getElementById('mCOGS').value)     || 0;
  const misc     = parseFloat(document.getElementById('mMisc').value)     || 0;
  const ownerPay = parseFloat(document.getElementById('mOwnerPay').value) || 0;
  const indKey   = document.getElementById('mIndustry').value;
  const period   = parseInt(document.getElementById('mPeriod').value) || 1;

  const periodLabel = period === 1 ? 'Monthly Report' : period === 3 ? '3-Month Average' : 'Annual Report';
  const mult        = period === 12 ? 1 : 12 / period;

  const aR  = rev      * mult;
  const aP  = payroll  * mult;
  const aRt = rent     * mult;
  const aS  = software * mult;
  const aM  = marketing* mult;
  const aC  = cogs     * mult;
  const aMi = misc     * mult;
  const aO  = ownerPay * mult;

  const totalExp  = aP + aRt + aS + aM + aC + aMi;
  const netProfit = aR - totalExp - aO;
  const netMargin = aR > 0 ? (netProfit / aR) * 100 : 0;

  ncRenderResults({
    periodLabel,
    annualRev:      aR,
    annualPayroll:  aP,
    annualRent:     aRt,
    annualSoftware: aS,
    annualMarketing: aM,
    annualCOGS:     aC,
    annualMisc:     aMi,
    annualOwner:    aO,
    totalExpenses:  totalExp,
    netProfit,
    netMargin,
    ind: IND_DATA[indKey],
  });
}

/* ── RENDER RESULTS ──────────────────────────────────── */
function ncRenderResults(d) {
  document.getElementById('nc-input-section').style.display = 'none';
  const rs = document.getElementById('nc-results-section');
  rs.style.display = 'block';
  document.getElementById('nc-rh-period').textContent = d.periodLabel;

  // Verification strip for CSV uploads
  const verifyEl = document.getElementById('nc-verify-strip');
  if (d.fromFile && d.rawIn !== undefined) {
    verifyEl.style.display = 'block';
    const multiplier = (12 / d.months).toFixed(1);
    verifyEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:16px;">✅</span>
        <span style="font-size:13px;font-weight:700;color:#155724;">File read successfully — verify your numbers before scrolling down:</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;">
        <div style="text-align:center;background:#f0faf4;border-radius:8px;padding:12px;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Income Detected</div>
          <div style="font-size:20px;font-weight:700;color:#22863a;">${fmt(d.rawIn)}</div>
        </div>
        <div style="text-align:center;background:#fffbf0;border-radius:8px;padding:12px;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Expenses Detected</div>
          <div style="font-size:20px;font-weight:700;color:#b45309;">${fmt(d.rawOut)}</div>
        </div>
        <div style="text-align:center;background:#f8f7f4;border-radius:8px;padding:12px;">
          <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Period Detected</div>
          <div style="font-size:20px;font-weight:700;color:#1B2A4A;">${d.months} mo${d.months > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style="font-size:12px;color:#555;line-height:1.6;">
        The report below is <strong>annualized (×${multiplier})</strong> based on the period detected.
        If income looks wrong, your bank may only export one type of transaction —
        try <a href="#" onclick="ncReset();return false;" style="color:#1B2A4A;font-weight:700;text-decoration:underline;">manual entry</a> instead.
      </div>
    `;
  } else {
    verifyEl.style.display = 'none';
  }

  // KPI grid
  const mc = d.netMargin >= (d.ind.targetMargin * 0.8) ? 'kv-green'
           : d.netMargin >= (d.ind.targetMargin * 0.5) ? 'kv-amber'
           : 'kv-rose';

  document.getElementById('nc-kpi-grid').innerHTML = `
    <div class="kpi-box"><div class="kpi-lbl">Annual Revenue</div><div class="kpi-val kv-navy">${fmt(d.annualRev)}</div><div class="kpi-note">Annualized</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Total Expenses</div><div class="kpi-val kv-amber">${fmt(d.totalExpenses)}</div><div class="kpi-note">${d.annualRev > 0 ? fmtPct((d.totalExpenses / d.annualRev) * 100) : '-'} of revenue</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Net Profit Margin</div><div class="kpi-val ${mc}">${fmtPct(d.netMargin)}</div><div class="kpi-note">Target: ${d.ind.targetMargin}%+</div></div>
    <div class="kpi-box"><div class="kpi-lbl">Owner Pay (Annual)</div><div class="kpi-val kv-gold">${fmt(d.annualOwner || 0)}</div><div class="kpi-note">${d.annualRev > 0 ? fmtPct(((d.annualOwner || 0) / d.annualRev) * 100) : '-'} of revenue</div></div>
  `;

  // Spending bars
  const spendItems = [
    { label: 'Payroll & Contractors', amt: d.annualPayroll,   color: '#1B2A4A' },
    { label: 'Rent & Facilities',     amt: d.annualRent,      color: '#5B8FD4' },
    { label: 'Marketing',             amt: d.annualMarketing, color: '#C9A84C' },
    { label: 'Software & Tools',      amt: d.annualSoftware,  color: '#7CB87A' },
    { label: 'Cost of Goods',         amt: d.annualCOGS,      color: '#D47B5B' },
    { label: 'Misc & Other',          amt: d.annualMisc,      color: '#888'    },
    { label: 'Owner Pay',             amt: d.annualOwner || 0,color: '#22863a' },
  ].filter(s => s.amt > 0).sort((a, b) => b.amt - a.amt);

  document.getElementById('nc-spend-bars').innerHTML = spendItems.map(s => `
    <div class="sc-row">
      <span class="sc-label">${s.label}</span>
      <div class="sc-track"><div class="sc-fill" style="width:${Math.round((s.amt / d.annualRev) * 100)}%;background:${s.color}"></div></div>
      <span class="sc-pct">${d.annualRev > 0 ? fmtPct((s.amt / d.annualRev) * 100) : '-'}</span>
      <span class="sc-amt">${fmt(s.amt)}</span>
    </div>
  `).join('');

  // Benchmark comparison
  const lPct = d.annualRev > 0 ? (d.annualPayroll / d.annualRev) * 100 : 0;
  const mPct = d.annualRev > 0 ? (d.annualMarketing / d.annualRev) * 100 : 0;
  const oPct = d.annualRev > 0 ? ((d.annualOwner || 0) / d.annualRev) * 100 : 0;

  const bcRow = (label, yours, target, val, low, high) => {
    const s = val >= high  ? { c: 'bs-good', t: 'On track' }
            : val >= low   ? { c: 'bs-warn', t: 'Watch this' }
            :                { c: 'bs-bad',  t: 'Needs attention' };
    return `
      <div class="bc-row-nc">
        <span class="bc-metric">${label}</span>
        <div class="bc-values">
          <span class="bc-yours">${yours}</span>
          <span class="bc-target">${target}</span>
          <span class="bc-status ${s.c}">${s.t}</span>
        </div>
      </div>
    `;
  };

  document.getElementById('nc-bench-compare').innerHTML = `
    <div class="bench-compare-wrap">
      <div class="bc-title-sm">Your Numbers vs. ${d.ind.label} Benchmarks</div>
      <div class="bc-rows">
        ${bcRow('Net Profit Margin',        fmtPct(d.netMargin), `Target: ${d.ind.targetMargin}%+`, d.netMargin, d.ind.targetMargin * 0.5, d.ind.targetMargin)}
        ${bcRow('Labor as % of Revenue',    fmtPct(lPct),        `Benchmark: ~${d.ind.laborPct}%`,  d.ind.laborPct + 5 - lPct, 0, 10)}
        ${bcRow('Marketing as % of Revenue',fmtPct(mPct),        `Benchmark: ~${d.ind.marketingPct}%`, mPct > 0 ? 10 : 0, 5, 10)}
        ${bcRow('Owner Pay as % of Revenue',fmtPct(oPct),        `Target: ${d.ind.ownerPct}%+`,     oPct, d.ind.ownerPct * 0.5, d.ind.ownerPct)}
      </div>
    </div>
  `;

  // Insights
  const insights = [];
  if (d.netMargin < d.ind.targetMargin * 0.5) {
    insights.push({ t: 'action', i: '🚨', title: `Margin is ${fmtPct(d.netMargin)} — well below ${d.ind.targetMargin}% target`, text: `To reach target, increase revenue by ${fmt(d.annualRev * (d.ind.targetMargin - d.netMargin) / 100)} or reduce expenses by the same.` });
  } else if (d.netMargin < d.ind.targetMargin) {
    insights.push({ t: 'warn',   i: '⚠️', title: `Margin below target — ${fmtPct(d.netMargin)} vs ${d.ind.targetMargin}% goal`, text: "You're close. Review your top 2 expense categories for quick efficiency gains." });
  } else {
    insights.push({ t: 'good',   i: '✅', title: `Strong margin — ${fmtPct(d.netMargin)} exceeds your ${d.ind.targetMargin}% benchmark`, text: "You're above industry average. Focus on protecting this margin as you scale." });
  }
  if ((d.annualOwner || 0) < 50000 && d.annualRev > 100000) {
    insights.push({ t: 'action', i: '💰', title: 'You are significantly underpaying yourself', text: "Your revenue supports a higher owner salary. Underpaying yourself creates a false picture of your business's true profitability." });
  }
  if (lPct > d.ind.laborPct * 1.3) {
    insights.push({ t: 'warn',   i: '👥', title: `Labor costs are high at ${fmtPct(lPct)} of revenue`, text: `Benchmark is ~${d.ind.laborPct}%. Review team productivity and whether all roles are revenue-generating.` });
  }

  document.getElementById('nc-insights-list').innerHTML = insights.map(ins => `
    <div class="nc-insight ${ins.t}">
      <span class="ins-icon">${ins.i}</span>
      <div>
        <div class="ins-title">${ins.title}</div>
        <div class="ins-text">${ins.text}</div>
      </div>
    </div>
  `).join('');

  // Priority actions
  const actions = [
    {
      title: 'Bring these numbers to Session 5',
      desc:  'Screenshot this page or note your key metrics. Kelli will help you interpret them live on March 25.',
    },
    {
      title: `See what you should be paying yourself`,
      desc:  `Based on ${fmt(d.annualRev)} in revenue, check the Industry Benchmarks tab → Salary Calculator for your precise number.`,
    },
    {
      title: d.netMargin < d.ind.targetMargin ? 'Identify your biggest expense to cut' : 'Plan your next pricing increase',
      desc:  d.netMargin < d.ind.targetMargin
        ? `Your largest expense is ${spendItems[0]?.label || 'expenses'}. A 10% reduction could add ${fmt((spendItems[0]?.amt || 0) * 0.1)} back.`
        : 'Your margins are healthy. Raise prices before you hire.',
    },
  ];

  document.getElementById('nc-action-steps').innerHTML = actions.map((a, i) => `
    <div class="action-item">
      <div class="action-num">${i + 1}</div>
      <div>
        <div class="action-title">${a.title}</div>
        <div class="action-desc">${a.desc}</div>
      </div>
    </div>
  `).join('');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── RESET ───────────────────────────────────────────── */
function ncReset() {
  document.getElementById('nc-input-section').style.display = 'block';
  document.getElementById('nc-results-section').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── DRAG & DROP ─────────────────────────────────────── */
function initCruncher() {
  const dz = document.getElementById('nc-drop-zone');
  dz.addEventListener('dragover',  e  => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop',      e  => {
    e.preventDefault();
    dz.classList.remove('dragover');
    const f = e.dataTransfer.files;
    if (f[0]) ncHandleFile({ target: { files: f } });
  });
}
