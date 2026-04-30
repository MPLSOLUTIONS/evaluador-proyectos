/* ═══════════════════════════════════════
   estado.js — Estado global y utilidades
═══════════════════════════════════════ */

const Estado = {
  moneda: 'CLP',   // 'CLP' | 'UF'
  financM: 'propio', // 'propio' | 'mixto'
  tasaMet: 'manual', // 'manual' | 'wacc'
  ktRecup: 'si',    // 'si' | 'no'
  anos: 5,
  ventaRows: [],   // [{nm, vals:[...10]}]
  costoRows: [],   // [{nm, vals:[...10]}]
  depItems: [],    // manejados por DOM
  lastFCF: null,   // resultado del último cálculo
};

/* ── Formato numérico ── */
function sym() { return Estado.moneda === 'CLP' ? '$' : 'UF '; }
function unit() { return Estado.moneda === 'CLP' ? 'MM$' : 'Miles UF'; }

function fmt(n, d = 2) {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const str = abs.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '-' : '') + sym() + str;
}

function fmtP(n) {
  if (isNaN(n) || n == null) return '—';
  return n.toFixed(2).replace('.', ',') + ' %';
}

/* ── Totales por columna ── */
function getColTotals(rows) {
  const t = Array(Estado.anos).fill(0);
  rows.forEach(r => {
    for (let i = 0; i < Estado.anos; i++) t[i] += (r.vals[i] || 0);
  });
  return t;
}

/* ── Actualizar labels de unidad en toda la página ── */
function refreshUnits() {
  document.querySelectorAll('.munit').forEach(el => el.textContent = unit());
}

/* ── TIR por bisección (flujos desde año 0) ── */
function calcTIR(flujos) {
  const f = r => flujos.reduce((a, v, i) => a + v / Math.pow(1 + r, i), 0);
  let lo = -0.9999, hi = 20;
  if (f(lo) * f(hi) > 0) return NaN;
  for (let k = 0; k < 500; k++) {
    const m = (lo + hi) / 2;
    if (Math.abs(hi - lo) < 1e-9) break;
    f(m) > 0 ? lo = m : hi = m;
  }
  return (lo + hi) / 2;
}

/* ── Tabs ── */
function goTab(n) {
  document.querySelectorAll('.tab-panel').forEach((p, i) => p.classList.toggle('active', i === n));
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === n));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
