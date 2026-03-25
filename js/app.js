/* ── UTILITY HELPERS ─────────────────────────────────── */
function fmt(n) {
  return n >= 1000 ? '$' + Math.round(n / 1000) + 'K' : '$' + Math.round(n);
}

function fmtPct(n) {
  return (Math.round(n * 10) / 10) + '%';
}

/* ── TAB SWITCHING ───────────────────────────────────── */
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  window.scrollTo({ top: document.querySelector('.tabs-wrap').offsetTop - 10, behavior: 'smooth' });
}

function switchBenchTab(name, btn) {
  document.querySelectorAll('.bench-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bench-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('bench-panel-' + name).classList.add('active');
  btn.classList.add('active');
}

/* ── INIT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initQuiz();
  initCruncher();
  initBenchmarks();
});
