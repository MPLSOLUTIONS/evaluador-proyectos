/* ═══════════════════════════════════════
   parametros.js — Pestaña 1
═══════════════════════════════════════ */

/* ── Moneda ── */
function setMoneda(m, btn) {
  Estado.moneda = m;
  document.querySelectorAll('.hero-moneda button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  refreshUnits();
  recalcDep();
}

/* ── Slider de años ── */
function onAnosChange() {
  Estado.anos = +document.getElementById('p-anos').value;
  document.getElementById('p-anos-label').textContent =
    Estado.anos + ' año' + (Estado.anos > 1 ? 's' : '');
  renderVentas();
  renderCostos();
}

/* ── Financiamiento ── */
function setFinanc(m, btn) {
  Estado.financM = m;
  document.querySelectorAll('#financ-toggle button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('financ-mixto-box').classList.toggle('hidden', m === 'propio');
  document.getElementById('financ-propio-msg').classList.toggle('hidden', m === 'mixto');
  if (m === 'mixto') calcFinanc();
}

function calcFinanc() {
  const P = +document.getElementById('f-monto').value || 0;
  const r = (+document.getElementById('f-tasa').value || 0) / 100;
  const n = +document.getElementById('f-plazo').value || 1;
  const c = r === 0 ? P / n : P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  document.getElementById('f-cuota-label').textContent = fmt(c);
  return { P, r, n, c };
}

function getDeudaTabla() {
  if (Estado.financM !== 'mixto') return Array(Estado.anos).fill({ i: 0, a: 0 });
  const { P, r, n, c } = calcFinanc();
  const tabla = [];
  let saldo = P;
  for (let k = 0; k < Estado.anos; k++) {
    if (k >= n) { tabla.push({ i: 0, a: 0 }); continue; }
    const interes = saldo * r;
    const amort = c - interes;
    tabla.push({ i: interes, a: Math.min(amort, saldo) });
    saldo = Math.max(0, saldo - amort);
  }
  return tabla;
}

/* ── Tasa / WACC ── */
function setTasaM(m, btn) {
  Estado.tasaMet = m;
  document.querySelectorAll('#tasa-toggle button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tasa-manual-box').classList.toggle('hidden', m === 'wacc');
  document.getElementById('tasa-wacc-box').classList.toggle('hidden', m === 'manual');
  if (m === 'wacc') calcWACC();
}

function calcWACC() {
  const d  = (+document.getElementById('w-dpct').value  || 0) / 100;
  const dc = (+document.getElementById('w-dcost').value || 0) / 100;
  const p  = (+document.getElementById('w-ppct').value  || 0) / 100;
  const pc = (+document.getElementById('w-pcost').value || 0) / 100;
  const tx = (+document.getElementById('w-tax').value   || 0) / 100;
  const w  = d * dc * (1 - tx) + p * pc;
  document.getElementById('wacc-val').textContent = fmtP(w * 100);
  return w * 100;
}

function getTasa() {
  if (Estado.tasaMet === 'wacc') return calcWACC() / 100;
  return (+document.getElementById('p-tasa').value || 0) / 100;
}

/* ── Capital de trabajo ── */
function setKTR(v, btn) {
  Estado.ktRecup = v;
  document.querySelectorAll('#kt-toggle button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

/* ── Depreciaciones ── */
let depCnt = 0;
const DEP_VIDAS = {
  'Maquinaria industrial': 10,
  'Vehículos / equipos': 5,
  'Infraestructura': 25,
  'Equipos TI': 3,
  'Manual (definir)': null,
};

function addDep(nm = 'Maquinaria industrial', val = 200, vida = 10) {
  const id = ++depCnt;
  const list = document.getElementById('dep-list');
  const div = document.createElement('div');
  div.className = 'dep-item';
  div.id = 'dep-item-' + id;

  const opts = Object.entries(DEP_VIDAS).map(([k, v]) =>
    `<option value="${v ?? ''}" ${k === nm ? 'selected' : ''}>${k}</option>`
  ).join('');

  div.innerHTML = `
    <div class="field" style="margin:0">
      <label>Activo / Descripción</label>
      <input type="text" value="${nm}" oninput="recalcDep()"/>
    </div>
    <div class="field" style="margin:0">
      <label>Valor <span class="munit">${unit()}</span></label>
      <input type="number" class="dep-val" value="${val}" min="0" step="0.1" oninput="recalcDep()"/>
    </div>
    <div class="field" style="margin:0">
      <label>Tipo / Vida útil (años)</label>
      <select id="dep-sel-${id}" onchange="onDepSelChange(${id})">
        ${opts}
      </select>
      <input type="number" id="dep-vida-${id}" class="dep-vida" value="${vida}" min="1" max="50"
             style="margin-top:4px" oninput="recalcDep()"/>
    </div>
    <div class="field" style="margin:0">
      <label>Dep. anual</label>
      <div id="dep-anual-${id}"
           style="padding:9px 12px;background:var(--surface2);border:1px solid var(--border);
                  border-radius:var(--radius-sm);font-weight:600;font-size:0.85rem">—</div>
    </div>
    <div style="padding-bottom:2px">
      <button class="btn-sm btn-danger" onclick="removeDep(${id})">✕</button>
    </div>`;
  list.appendChild(div);
  recalcDep();
}

function onDepSelChange(id) {
  const sel = document.getElementById('dep-sel-' + id);
  const vida = document.getElementById('dep-vida-' + id);
  if (sel.value) vida.value = sel.value;
  recalcDep();
}

function removeDep(id) {
  document.getElementById('dep-item-' + id)?.remove();
  recalcDep();
}

function recalcDep() {
  let total = 0;
  document.querySelectorAll('.dep-item').forEach(item => {
    const val  = +item.querySelector('.dep-val').value  || 0;
    const vida = +item.querySelector('.dep-vida').value || 1;
    const anual = val / vida;
    total += anual;
    const id = item.id.replace('dep-item-', '');
    const lbl = document.getElementById('dep-anual-' + id);
    if (lbl) lbl.textContent = fmt(anual);
  });
  document.getElementById('dep-total-lbl').textContent = fmt(total);
  return total;
}

function getDepAnual() {
  let t = 0;
  document.querySelectorAll('.dep-item').forEach(item => {
    t += (+item.querySelector('.dep-val').value || 0) /
         (+item.querySelector('.dep-vida').value || 1);
  });
  return t;
}

/* ── Init pestaña 1 ── */
function initParametros() {
  addDep('Maquinaria industrial', 300, 10);
  addDep('Infraestructura', 100, 25);
  calcFinanc();
  calcWACC();
}
