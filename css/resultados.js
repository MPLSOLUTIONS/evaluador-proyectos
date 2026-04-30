/* ═══════════════════════════════════════
   resultados.js — Pestaña 4: Resultados
═══════════════════════════════════════ */

function buildResults() {
  // Primero recalcular FCF con datos actuales
  buildFCF();

  const { rows, inv, kt, tasa, anos, ing, cost, tax, depA, deuda, resid, prestamo } = Estado.lastFCF;
  const yr0 = -(inv + kt) + (Estado.financM === 'mixto' ? prestamo : 0);
  const fcl  = rows.map(r => r.fcl);
  const allF = [yr0, ...fcl]; // flujos desde año 0

  // ── Indicadores ──
  const van = allF.reduce((a, v, i) => a + v / Math.pow(1 + tasa, i), 0);
  const tir = calcTIR(allF);

  // Payback simple (sobre FCL)
  let acum = yr0, pb = null;
  for (let i = 0; i < fcl.length; i++) {
    acum += fcl[i];
    if (acum >= 0 && pb === null) {
      pb = Math.max(0, i + 1 - acum / fcl[i]);
      break;
    }
  }

  // Payback descontado
  let acumD = yr0, pbd = null;
  for (let i = 0; i < fcl.length; i++) {
    const fd = fcl[i] / Math.pow(1 + tasa, i + 1);
    acumD += fd;
    if (acumD >= 0 && pbd === null) {
      pbd = Math.max(0, i + 1 - acumD / fd);
      break;
    }
  }

  Estado.lastFCF.van = van;
  Estado.lastFCF.tir = tir;
  Estado.lastFCF.pb  = pb;
  Estado.lastFCF.pbd = pbd;

  // ── KPIs ──
  const ebitdaY1 = rows[0]?.ebitda ?? 0;
  const fclTotal = fcl.reduce((a, b) => a + b, 0);
  const margenY1 = ing[0] > 0 ? (rows[0]?.ebitda / ing[0]) * 100 : 0;

  const kpis = [
    { l: 'VAN',               v: fmt(van),                          s: 'Valor Actual Neto',          pos: van > 0 },
    { l: 'TIR',               v: fmtP(tir * 100),                   s: 'Tasa Interna de Retorno',    pos: tir > tasa },
    { l: 'Payback simple',    v: pb  != null ? pb.toFixed(1)  + ' años' : 'No recupera', s: 'Período de recuperación', pos: pb != null },
    { l: 'Payback descontado',v: pbd != null ? pbd.toFixed(1) + ' años' : 'No recupera', s: 'Con valor tiempo del dinero', pos: pbd != null },
    { l: 'EBITDA año 1',      v: fmt(ebitdaY1),                     s: 'Primer año del proyecto',    pos: ebitdaY1 > 0 },
    { l: 'Margen EBITDA Y1',  v: fmtP(margenY1),                    s: 'Sobre ingresos año 1',       pos: margenY1 > 0 },
    { l: 'FCL acumulado',     v: fmt(fclTotal),                     s: 'Total sin descontar',        pos: fclTotal > 0 },
    { l: 'Tasa exigida',      v: fmtP(tasa * 100),                  s: 'Tasa de descuento usada',    pos: true },
  ];

  document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
    <div class="metric ${k.pos ? 'pos' : 'neg'}">
      <div class="metric-label">${k.l}</div>
      <div class="metric-value">${k.v}</div>
      <div class="metric-sub">${k.s}</div>
    </div>`).join('');

  // ── Semáforo ──
  const viable  = van > 0 && tir > tasa;
  const revisar = !viable && van > -(inv + kt) * 0.15;

  document.getElementById('v-icon').textContent = viable ? '✅' : revisar ? '⚠️' : '❌';
  document.getElementById('v-titulo').textContent = viable
    ? 'Proyecto viable'
    : revisar ? 'Revisar supuestos' : 'Proyecto no recomendado';
  document.getElementById('v-desc').textContent = viable
    ? `VAN positivo de ${fmt(van)} y TIR de ${fmtP(tir * 100)}, superior a la tasa exigida de ${fmtP(tasa * 100)}. El proyecto crea valor bajo los supuestos ingresados.`
    : revisar
    ? `Los indicadores son marginales (VAN ${fmt(van)}, TIR ${fmtP(tir * 100)}). Conviene revisar los supuestos antes de decidir.`
    : `VAN negativo (${fmt(van)}) y/o TIR (${fmtP(tir * 100)}) por debajo de la tasa exigida (${fmtP(tasa * 100)}). No se recomienda invertir bajo los supuestos actuales.`;

  const badge = document.getElementById('v-badge');
  badge.textContent = viable ? 'VIABLE' : revisar ? 'REVISAR' : 'NO VIABLE';
  badge.className = 'v-badge ' + (viable ? 'badge-viable' : revisar ? 'badge-revisar' : 'badge-noviable');

  // Mostrar resultados
  document.getElementById('res-placeholder').classList.add('hidden');
  document.getElementById('res-content').classList.remove('hidden');

  renderSens();
}

/* ── Sensibilidad ── */
function renderSens() {
  if (!Estado.lastFCF) return;

  const { inv, kt, tasa, anos, ing, cost, tax, depA, deuda, resid, prestamo } = Estado.lastFCF;
  const variable = document.getElementById('sens-var').value;
  const rango    = +document.getElementById('sens-rango').value;
  const steps    = [-rango, -rango / 2, 0, rango / 2, rango];
  const yr0base  = -(inv + kt) + (Estado.financM === 'mixto' ? prestamo : 0);

  const tbody = document.getElementById('sens-body');
  tbody.innerHTML = '';

  steps.forEach(pct => {
    let ingM  = [...ing];
    let costM = [...cost];
    let invM  = inv;
    let tasaM = tasa;

    if (variable === 'ingresos')   ingM  = ingM.map(v => v * (1 + pct / 100));
    if (variable === 'costos')     costM = costM.map(v => v * (1 + pct / 100));
    if (variable === 'inversion')  invM  = inv * (1 + pct / 100);
    if (variable === 'tasa')       tasaM = tasa * (1 + pct / 100);

    const yr0M = -(invM + kt) + (Estado.financM === 'mixto' ? prestamo : 0);
    const fclM = [];

    for (let i = 0; i < anos; i++) {
      const ebitda   = ingM[i] - costM[i];
      const ebit     = ebitda - depA;
      const interes  = deuda[i].i;
      const ebt      = ebit - interes;
      const impuesto = Math.max(0, ebt * tax);
      const utilNeta = ebt - impuesto;
      const fcOp     = utilNeta + depA;
      let   fcl      = fcOp - deuda[i].a;
      if (i === anos - 1) fcl += resid + (Estado.ktRecup === 'si' ? kt : 0);
      fclM.push(fcl);
    }

    const allFM = [yr0M, ...fclM];
    const vanM  = allFM.reduce((a, v, i) => a + v / Math.pow(1 + tasaM, i), 0);
    const tirM  = calcTIR(allFM);

    let pbM = null, acumM = yr0M;
    for (let i = 0; i < fclM.length; i++) {
      acumM += fclM[i];
      if (acumM >= 0 && pbM === null) { pbM = Math.max(0, i + 1 - acumM / fclM[i]); break; }
    }

    const viableM  = vanM > 0 && tirM > tasaM;
    const revisarM = !viableM && vanM > -(invM + kt) * 0.15;
    const isBase   = pct === 0;

    tbody.innerHTML += `<tr class="${isBase ? 'base-row' : ''}">
      <td>${pct === 0 ? 'Base (sin variación)' : (pct > 0 ? '+' : '') + pct + '%'}</td>
      <td style="color:${vanM >= 0 ? 'var(--green)' : 'var(--red)'};">${fmt(vanM)}</td>
      <td>${fmtP(tirM * 100)}</td>
      <td>${pbM != null ? pbM.toFixed(1) + ' años' : 'No recupera'}</td>
      <td><span class="pill ${viableM ? 'pill-pos' : revisarM ? 'pill-neu' : 'pill-neg'}">
        ${viableM ? 'Viable' : revisarM ? 'Revisar' : 'No viable'}
      </span></td>
    </tr>`;
  });
}
