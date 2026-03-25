/* ── INDUSTRY BENCHMARKS ─────────────────────────────── */
let activeInd = 'consulting';

function initBenchmarks() {
  // Populate industry selector buttons
  const sel = document.getElementById('ind-selector');
  sel.innerHTML = INDUSTRIES_DATA.map(i => `
    <button class="ind-btn${i.key === activeInd ? ' active' : ''}" onclick="selectInd('${i.key}')">
      ${i.emoji} ${i.label}
    </button>
  `).join('');

  renderBenchDetail(activeInd);

  // Populate comparison table
  const mc = i => i.netMargin.target >= 20 ? 'pill-green' : i.netMargin.target >= 10 ? 'pill-amber' : 'pill-rose';
  document.getElementById('comp-table').innerHTML = `
    <thead>
      <tr>
        <th>Industry</th>
        <th>Net Margin Target</th>
        <th>Typical Owner Salary</th>
        <th>Difficulty</th>
        <th>#1 Cost Driver</th>
      </tr>
    </thead>
    <tbody>
      ${INDUSTRIES_DATA.map(i => `
        <tr>
          <td>${i.emoji} ${i.label}</td>
          <td><span class="pill ${mc(i)}">${i.netMargin.low}–${i.netMargin.high}%</span></td>
          <td>$${i.ownerSalary.low}K–$${i.ownerSalary.high}K</td>
          <td>${i.scoreboard.difficulty}</td>
          <td style="font-size:11px;color:#888">${i.scoreboard.primary_driver}</td>
        </tr>
      `).join('')}
    </tbody>
  `;

  // Populate salary calculator industry dropdown
  document.getElementById('calcIndustry').innerHTML = INDUSTRIES_DATA.map(i =>
    `<option value="${i.key}">${i.emoji} ${i.label}</option>`
  ).join('');
}

function selectInd(key) {
  activeInd = key;
  document.querySelectorAll('.ind-btn').forEach(b =>
    b.classList.toggle('active', b.getAttribute('onclick').includes(`'${key}'`))
  );
  renderBenchDetail(key);
}

function renderBenchDetail(key) {
  const ind = INDUSTRIES_DATA.find(i => i.key === key);
  if (!ind) return;

  const mc = ind.netMargin.target >= 20 ? 'mv-green' : ind.netMargin.target >= 10 ? 'mv-amber' : 'mv-rose';

  document.getElementById('bench-detail').innerHTML = `
    <div class="bench-card">
      <div class="bc-accent-bar"></div>
      <div class="bc-industry-title">${ind.emoji} ${ind.label}</div>
      <div class="metrics-grid">
        <div class="metric-box">
          <div class="metric-label">Target Net Margin</div>
          <div class="metric-value ${mc}">${ind.netMargin.low}–${ind.netMargin.high}%</div>
          <div class="metric-note">Aim for ${ind.netMargin.target}% or higher</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Owner Salary Range</div>
          <div class="metric-value mv-navy">$${ind.ownerSalary.low}K–$${ind.ownerSalary.high}K</div>
          <div class="metric-note">Typical: $${ind.ownerSalary.typical}K/year</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Margin Difficulty</div>
          <div class="metric-value" style="font-size:14px;padding-top:4px">
            <span class="pill ${ind.scoreboard.margin_class}">${ind.scoreboard.difficulty}</span>
          </div>
          <div class="metric-note">${ind.scoreboard.primary_driver}</div>
        </div>
      </div>
      <div class="sg-title">How Healthy Businesses Spend Their Revenue</div>
      <div class="spend-bars-b">
        ${ind.spends.map(s => `
          <div class="spend-row">
            <span class="spend-label">${s.label}</span>
            <div class="spend-track">
              <div class="spend-fill" style="width:${s.pct}%;background:${s.color}"></div>
            </div>
            <span class="spend-pct">${s.pct}%</span>
          </div>
        `).join('')}
      </div>
      <div class="kelli-tip">
        <span style="font-size:16px;flex-shrink:0">💡</span>
        <div>
          <div class="kt-label">Kelli's Take</div>
          <div class="kt-text">${ind.tip}</div>
        </div>
      </div>
    </div>
  `;
}

/* ── SALARY CALCULATOR ───────────────────────────────── */
function calcSalary() {
  const indKey   = document.getElementById('calcIndustry').value;
  const revenue  = parseFloat(document.getElementById('calcRevenue').value)  || 0;
  const expenses = parseFloat(document.getElementById('calcExpenses').value) || 0;
  const structure= document.getElementById('calcStructure').value;

  if (!revenue || !expenses) { alert('Please enter your revenue and expenses.'); return; }

  const ind         = INDUSTRIES_DATA.find(i => i.key === indKey);
  const struc       = STRUCTURE_TIPS[structure];
  const netProfit   = revenue - expenses;
  const currentMargin = ((netProfit / revenue) * 100).toFixed(1);
  const recSalary   = Math.min(netProfit * struc.rec_pct, ind.ownerSalary.high * 1000);
  const targetSalary= ind.ownerSalary.typical * 1000;
  const marginStatus= parseFloat(currentMargin) >= ind.netMargin.low ? '✅ On target' : '⚠️ Below benchmark';

  const el = document.getElementById('calcResults');
  el.style.display = 'block';
  el.innerHTML = `
    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:14px;">Your Salary Calculation</div>
    <div class="rs-grid">
      <div class="rs-box">
        <div class="rs-box-lbl">Current Net Profit</div>
        <div class="rs-box-val">${currentMargin}%</div>
        <div style="font-size:10px;color:#888;margin-top:3px">${marginStatus}</div>
      </div>
      <div class="rs-box highlight">
        <div class="rs-box-lbl">Recommended Salary</div>
        <div class="rs-box-val">$${Math.round(recSalary / 1000)}K–$${Math.round(targetSalary / 1000)}K</div>
        <div style="font-size:10px;color:rgba(201,168,76,.6);margin-top:3px">Via ${struc.method}</div>
      </div>
    </div>
    <div class="bb-rows">
      <div class="bb-row">
        <span class="bb-lbl">Expenses</span>
        <div class="bb-track"><div class="bb-fill" style="width:${Math.min((expenses / revenue) * 100, 100)}%;background:#D47B5B"></div></div>
        <span class="bb-amt">${fmt(expenses)}</span>
      </div>
      <div class="bb-row">
        <span class="bb-lbl">Your Salary</span>
        <div class="bb-track"><div class="bb-fill" style="width:${Math.min((recSalary / revenue) * 100, 100)}%;background:#C9A84C"></div></div>
        <span class="bb-amt">${fmt(recSalary)}</span>
      </div>
      <div class="bb-row">
        <span class="bb-lbl">Remaining Profit</span>
        <div class="bb-track"><div class="bb-fill" style="width:${Math.max(0, Math.min(((netProfit - recSalary) / revenue) * 100, 100))}%;background:#22863a"></div></div>
        <span class="bb-amt">${fmt(Math.max(0, netProfit - recSalary))}</span>
      </div>
    </div>
    <div style="margin-top:14px;background:#fff;border-radius:8px;padding:13px 14px;border:1px solid #e5e0d8">
      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888;margin-bottom:6px">Structure: ${struc.name}</div>
      <div style="font-size:12px;color:#444;line-height:1.6">${struc.tax_note}</div>
    </div>
    <div style="margin-top:10px;background:var(--navy);border-radius:8px;padding:12px 14px;font-size:12px;color:rgba(255,255,255,.75);line-height:1.6">
      <strong style="color:var(--gold)">Next step:</strong> Bring these numbers to March 25 — Kelli will help you validate them live.
    </div>
  `;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
