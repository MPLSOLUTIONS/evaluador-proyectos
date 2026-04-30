/* ═══════════════════════════════════════
   parametros.js — Pestaña 1
   Activos: valor compra + vida útil + valor residual
   Inversión inicial = suma de valores de compra
   Depreciación por año = (valor - residual) / vida útil
   Depreciación solo durante años de vida útil del activo
═══════════════════════════════════════ */

/* ── Moneda ── */
function setMoneda(m, btn) {
  Estado.moneda = m;
  document.querySelectorAll('.hero-moneda button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  refreshUnits();
  recalcActivos();
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

/* ══════════════════════════════════════════
   ACTIVOS — corazón del módulo
   Cada activo tiene:
     nm      : nombre
     val     : valor de compra (= inversión)
     resid   : valor residual al final de vida útil
     vida    : vida útil en años
     tipo    : tipo seleccionado
   Depreciación anual = (val - resid) / vida
   Solo aplica durante años 1..vida
   Residual se recupera al final del PROYECTO
══════════════════════════════════════════ */

let activoCnt = 0;

const TIPOS_ACTIVO = {
  'Maquinaria industrial':  { vida: 10, residPct: 10 },
  'Vehículos / equipos':    { vida: 5,  residPct: 15 },
  'Infraestructura':        { vida: 25, residPct: 20 },
  'Equipos TI':             { vida: 3,  residPct: 5  },
  'Manual (definir)':       { vida: 10, residPct: 0  },
};

function addActivo(nm = 'Maquinaria industrial', val = 300, resid = null, vida = null) {
  const id = ++activoCnt;
  const tipo = TIPOS_ACTIVO[nm] || TIPOS_ACTIVO['Manual (definir)'];
  const vidaDefault = vida ?? tipo.vida;
  const residDefault = resid ?? +(val * tipo.residPct / 100).toFixed(2);

  const list = document.getElementById('activos-list');
  const div = document.createElement('div');
  div.className = 'activo-item';
  div.id = 'activo-' + id;

  const opts = Object.keys(TIPOS_ACTIVO).map(k =>
    `<option ${k === nm ? 'selected' : ''}>${k}</option>`
  ).join('');

  div.innerHTML = `
    <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
      <input type="text" id="activo-nm-${id}" value="${nm}"
        style="font-weight:600;font-size:0.88rem;border:none;background:transparent;
               color:var(--navy);font-family:'DM Sans',sans-serif;width:100%"
        oninput="recalcActivos()"/>
      <button class="btn-sm btn-danger" onclick="removeActivo(${id})" style="margin-left:8px;flex-shrink:0">✕</button>
    </div>

    <div class="field" style="margin:0">
      <label>Tipo de activo</label>
      <select id="activo-tipo-${id}" onchange="onTipoChange(${id})">
        ${opts}
      </select>
    </div>

    <div class="field" style="margin:0">
      <label>Valor de compra <span class="munit">${unit()}</span></label>
      <input type="number" id="activo-val-${id}" class="activo-val"
        value="${val}" min="0" step="0.1"
        oninput="onValChange(${id})"/>
    </div>

    <div class="field" style="margin:0">
      <label>Vida útil (años)</label>
      <input type="number" id="activo-vida-${id}" class="activo-vida"
        value="${vidaDefault}" min="1" max="50"
        oninput="recalcActivos()"/>
    </div>

    <div class="field" style="margin:0">
      <label>Valor residual <span class="munit">${unit()}</span></label>
      <input type="number" id="activo-resid-${id}" class="activo-resid"
        value="${residDefault}" min="0" step="0.1"
        oninput="recalcActivos()"/>
      <p class="hint" id="activo-resid-pct-${id}"></p>
    </div>

    <div class="field" style="margin:0">
      <label>Dep. anual</label>
      <div id="activo-dep-${id}"
           style="padding:9px 12px;background:var(--surface2);border:1px solid var(--border);
                  border-radius:var(--radius-sm);font-weight:600;font-size:0.85rem;color:var(--navy)">—</div>
      <p class="hint" id="activo-dep-anos-${id}"></p>
    </div>`;

  list.appendChild(div);
  recalcActivos();
}

/* ── Al cambiar tipo: actualizar vida útil y residual sugerido ── */
function onTipoChange(id) {
  const tipoNm = document.getElementById('activo-tipo-' + id).value;
  const tipo   = TIPOS_ACTIVO[tipoNm] || TIPOS_ACTIVO['Manual (definir)'];
  const val    = +document.getElementById('activo-val-' + id).value || 0;
  document.getElementById('activo-vida-'  + id).value = tipo.vida;
  document.getElementById('activo-resid-' + id).value = (val * tipo.residPct / 100).toFixed(2);
  recalcActivos();
}

/* ── Al cambiar valor: recalcular residual sugerido ── */
function onValChange(id) {
  const tipoNm = document.getElementById('activo-tipo-' + id).value;
  const tipo   = TIPOS_ACTIVO[tipoNm] || TIPOS_ACTIVO['Manual (definir)'];
  const val    = +document.getElementById('activo-val-' + id).value || 0;
  document.getElementById('activo-resid-' + id).value = (val * tipo.residPct / 100).toFixed(2);
  recalcActivos();
}

function removeActivo(id) {
  document.getElementById('activo-' + id)?.remove();
  recalcActivos();
}

/* ── Recalcular resumen de activos ── */
function recalcActivos() {
  let totalInv   = 0;
  let totalResid = 0;
  let totalDepAnual = 0; // solo como referencia año 1

  document.querySelectorAll('.activo-item').forEach(item => {
    const id    = item.id.replace('activo-', '');
    const val   = +document.getElementById('activo-val-'   + id).value || 0;
    const resid = +document.getElementById('activo-resid-' + id).value || 0;
    const vida  = +document.getElementById('activo-vida-'  + id).value || 1;
    const dep   = (val - resid) / vida;

    totalInv   += val;
    totalResid += resid;
    totalDepAnual += dep;

    // Labels
    const depLbl = document.getElementById('activo-dep-' + id);
    if (depLbl) depLbl.textContent = fmt(dep) + ' / año';

    const depAnosLbl = document.getElementById('activo-dep-anos-' + id);
    if (depAnosLbl) depAnosLbl.textContent = `Durante ${vida} año${vida > 1 ? 's' : ''}`;

    const residPctLbl = document.getElementById('activo-resid-pct-' + id);
    if (residPctLbl && val > 0)
      residPctLbl.textContent = `${((resid / val) * 100).toFixed(1)}% del valor de compra`;
  });

  // Actualizar panel resumen
  document.getElementById('activos-inv-total').textContent  = fmt(totalInv);
  document.getElementById('activos-resid-total').textContent = fmt(totalResid);
  document.getElementById('activos-dep-total').textContent   = fmt(totalDepAnual);

  // Actualizar unidades
  refreshUnits();
}

/* ── Obtener datos de activos para el flujo de caja ── */
function getActivosData() {
  const activos = [];
  document.querySelectorAll('.activo-item').forEach(item => {
    const id    = item.id.replace('activo-', '');
    const val   = +document.getElementById('activo-val-'   + id).value || 0;
    const resid = +document.getElementById('activo-resid-' + id).value || 0;
    const vida  = +document.getElementById('activo-vida-'  + id).value || 1;
    activos.push({ val, resid, vida, dep: (val - resid) / vida });
  });
  return activos;
}

/* ── Depreciación total para el año i (0-indexed) ── */
function getDepPorAno(ano) {
  // ano: 0 = Año 1, 1 = Año 2, etc.
  let dep = 0;
  document.querySelectorAll('.activo-item').forEach(item => {
    const id   = item.id.replace('activo-', '');
    const val  = +document.getElementById('activo-val-'   + id).value || 0;
    const resid = +document.getElementById('activo-resid-' + id).value || 0;
    const vida = +document.getElementById('activo-vida-'  + id).value || 1;
    if (ano < vida) dep += (val - resid) / vida; // solo si está dentro de vida útil
  });
  return dep;
}

/* ── Inversión total (suma de valores de compra) ── */
function getInvTotal() {
  let t = 0;
  document.querySelectorAll('.activo-val').forEach(el => t += +el.value || 0);
  return t;
}

/* ── Residual total (suma de valores residuales) ── */
function getResidTotal() {
  let t = 0;
  document.querySelectorAll('.activo-resid').forEach(el => t += +el.value || 0);
  return t;
}

/* ── Init ── */
function initParametros() {
  addActivo('Maquinaria industrial', 300, 30, 10);
  addActivo('Infraestructura',       200, 40, 25);
  calcFinanc();
  calcWACC();
}
