/* ── QUIZ ────────────────────────────────────────────── */
function initQuiz() {
  document.querySelectorAll('.quiz-option input').forEach(input => {
    input.addEventListener('change', () => {
      input.closest('.quiz-question')
        .querySelectorAll('.quiz-option')
        .forEach(o => o.classList.remove('selected'));
      input.closest('.quiz-option').classList.add('selected');

      const total    = document.querySelectorAll('.quiz-question').length;
      const answered = new Set(
        [...document.querySelectorAll('.quiz-option input:checked')].map(i => i.name)
      ).size;
      document.getElementById('quiz-btn').disabled = answered < total;
    });
  });
}

function scoreQuiz() {
  let total = 0;
  ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(q => {
    const s = document.querySelector(`input[name="${q}"]:checked`);
    if (s) total += parseInt(s.value);
  });

  const pct = Math.round((total / 15) * 100);
  let label, color, headline, summary;

  if (pct >= 80) {
    label    = 'Financially Aware';
    color    = '#4CAF50';
    headline = 'You have a strong financial foundation.';
    summary  = 'You are ahead of most entrepreneurs. Come to March 25 to sharpen your edge and help others in the hot seat.';
  } else if (pct >= 53) {
    label    = 'Getting There';
    color    = '#C9AA71';
    headline = "You have awareness — now let's build clarity.";
    summary  = "You're not flying blind, but there are gaps costing you money and peace of mind. March 25 will close them fast.";
  } else {
    label    = 'Needs Attention';
    color    = '#C0392B';
    headline = 'Your numbers are running your business — not you.';
    summary  = "This is exactly why March 25 exists. No judgment — just honesty, a plan, and a community that gets it.";
  }

  const answers = ['q1', 'q2', 'q3', 'q4', 'q5'].map(q =>
    parseInt(document.querySelector(`input[name="${q}"]:checked`).value)
  );

  const ins = [];
  if (answers[0] < 2) ins.push({ type: 'warn', title: 'Profit margin blind spot',       text: "Not knowing your margin means you could be busy and still losing money. We'll address this in session." });
  if (answers[1] < 2) ins.push({ type: 'warn', title: 'Owner pay needs structure',       text: "Paying yourself whatever's left is a sign the business owns you. You deserve a real salary." });
  if (answers[2] < 2) ins.push({ type: 'warn', title: 'Expense awareness gap',           text: "If you can't name your top expenses, money is leaving silently every month." });
  if (answers[3] < 2) ins.push({ type: 'warn', title: 'No financial buffer',             text: 'One slow month without a buffer becomes a crisis. This is the number one business stress point.' });
  if (answers[4] < 2) ins.push({ type: 'warn', title: 'Financials reviewed too infrequently', text: "The numbers can't help you if you're not looking at them regularly." });

  const g = answers.filter(a => a >= 2).length;
  if (g >= 2) ins.push({ type: 'good', title: 'You have real strengths here', text: `You scored well on ${g} out of 5 areas. That foundation is worth building on — and we will.` });

  document.getElementById('quiz-form').style.display = 'none';
  const r = document.getElementById('quiz-results');
  r.style.display = 'block';
  r.innerHTML = `
    <div class="score-display">
      <div class="score-circle" style="background:${color}22;border:2px solid ${color};color:${color};">${pct}</div>
      <div>
        <div style="font-size:18px;font-weight:700;color:#fff;font-family:'Playfair Display',serif;">Financial Clarity Score</div>
        <div style="font-size:14px;color:${color};margin-top:4px;">${label}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:6px;line-height:1.5;">${headline}</div>
      </div>
    </div>
    <p style="font-size:14px;color:var(--text);line-height:1.7;margin-bottom:16px;">${summary}</p>
    ${ins.map(i => `
      <div class="result-item ${i.type === 'good' ? 'good' : ''}">
        <div class="result-label">${i.title}</div>
        <div class="result-text">${i.text}</div>
      </div>
    `).join('')}
    <div class="cta-card">
      <p>Your score is your starting point — not your ceiling. Bring these results to March 25 and let's build your plan together.</p>
      <a href="https://calendarlink.com/event/9KaZ3" target="_blank" class="btn-gold">Save My Spot · Free &amp; Anonymous →</a>
    </div>
    <div style="margin-top:16px;text-align:center;">
      <button onclick="retakeQuiz()" style="background:none;border:none;color:var(--dim);font-size:13px;cursor:pointer;text-decoration:underline;">
        Retake Quiz
      </button>
    </div>
  `;
}

function retakeQuiz() {
  document.getElementById('quiz-form').style.display = 'block';
  document.getElementById('quiz-results').style.display = 'none';
}
