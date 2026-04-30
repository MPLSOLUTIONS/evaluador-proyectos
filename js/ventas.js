/* ═══════════════════════════════════════
   ventas.js — Pestaña 2: Ventas y Costos
   Año 1 = valor base absoluto
   Año 2+ = % de aumento o valor absoluto (toggle)
═══════════════════════════════════════ */

let chartVentas = null;
let chartCostos = null;

/* ── Calcular valores reales desde base + porcentajes ── */
function calcValsFromPcts(r) {
  const computed = Array(10).fill(0);
  computed[0] = r.base || 0;
  for (let i = 1; i < 10; i++) {
    if (r.modo[i] === 'pct') {
      computed[i] = computed[i - 1] * (1 + (r.pcts[i] || 0) / 100);
    } else {
      computed[i] = r.vals[i] || 0;
    }
  }
  return computed;
}

/* ── Cabecera ── */
function buildYearsHeader(theadId) {
  const thead = document.getElementById(theadId);
  const col0 = `<th style="background:rgba(201,168,76,0.15);color:var(--gold-light)">Año 1<br><small style="font-weight:400;font-size:0.65rem;opacity:0.8">Valor base</small></th>`;
  const cols = Array.from({ length: Estado.anos - 1 }, (_, i) =>
    `<th>Año ${i + 2}<br><small style="font-weight:400;font-size:0.65rem">% o valor</small></th>`
  ).join('');
  thead.innerHTML = `<tr>
    <th style="text-align:left;min-width:170px">Concepto</th>
    ${Estado.anos >= 1 ? col0 : ''}${cols}
    <th>Total acum.</th><th></th>
  </tr>`;
}

/* ── Fila editable ── */
function makeRow(prefix, ri) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  const r = rows[ri];
  const computed = calcValsFromPcts(r);

  const nameTd = `<td><input type="text" value="${r.nm}"
    style="width:150px;background:var(--surface2);text-align:left;font-weight:500"
    oninput="updateRowName('${prefix}',${ri},this.value)"/></td>`;

  const year1Td = Estado.anos >= 1 ? `<td style="background:rgba(201,168,76,0.06)">
    <input type="number" value="${(r.base||0).toFixed(2)}" min="0" step="0.1"
      style="border-color:rgba(201,168,76,0.4)"
      oninput="updateBase('${prefix}',${ri},+this.value)"/>
    </td>` : '';

  let yearsTd = '';
  for (let i = 1; i < Estado.anos; i++) {
    const esPct = r.modo[i] === 'pct';
    const inputVal = esPct ? (r.pcts[i] || 5) : (computed[i] || 0);
    yearsTd += `<td id="${prefix}-cell-${ri}-${i}">
      <div style="display:flex;gap:3px;align-items:center">
        <input type="number" id="${prefix}-inp-${ri}-${i}"
          value="${Number(inputVal).toFixed(esPct?1:2)}"
          step="0.1" min="${esPct?-100:0}"
          style="min-width:62px;${esPct?'background:#eef4ff;border-color:#6b9fd4':''}"
          oninput="updateYearVal('${prefix}',${ri},${i},+this.value)"/>
        <button onclick="toggleModo('${prefix}',${ri},${i})"
          title="Cambiar entre % y valor"
          style="padding:3px 7px;font-size:0.72rem;border:1px solid var(--border);border-radius:4px;
                 cursor:pointer;background:${esPct?'#ddeaff':'var(--surface2)'};
                 color:${esPct?'#1a4a8a':'var(--gray)'};font-weight:700;
                 font-family:'DM Sans',sans-serif;white-space:nowrap">
          ${esPct?'%':'#'}
        </button>
      </div>
      <div id="${prefix}-calc-${ri}-${i}"
           style="font-size:0.68rem;color:var(--gray);text-align:right;margin-top:2px">
        = ${fmt(computed[i])}
      </div>
    </td>`;
  }

  const totalTd = `<td id="${prefix}-rt-${ri}" style="font-weight:700;text-align:right;padding:6px 10px">—</td>`;
  const deleteTd = `<td><button class="btn-sm btn-danger" onclick="removeRow('${prefix}',${ri})">✕</button></td>`;

  const tr = document.createElement('tr');
  tr.innerHTML = nameTd + year1Td + yearsTd + totalTd + deleteTd;
  return tr;
}

/* ── Actualizar nombre ── */
function updateRowName(prefix, ri, value) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  rows[ri].nm = value;
}

/* ── Actualizar Año 1 ── */
function updateBase(prefix, ri, value) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  rows[ri].base = value;
  refreshRowCalcs(prefix, ri);
  recalcTotals(prefix);
}

/* ── Actualizar Año 2+ ── */
function updateYearVal(prefix, ri, col, value) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  const r = rows[ri];
  if (r.modo[col] === 'pct') r.pcts[col] = value;
  else r.vals[col] = value;
  refreshRowCalcs(prefix, ri);
  recalcTotals(prefix);
}

/* ── Toggle % / valor ── */
function toggleModo(prefix, ri, col) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  const r = rows[ri];
  const computed = calcValsFromPcts(r);
  if (r.modo[col] === 'pct') {
    r.modo[col] = 'val';
    r.vals[col] = computed[col];
  } else {
    r.modo[col] = 'pct';
    const prev = computed[col - 1] || 1;
    r.pcts[col] = +((computed[col] / prev - 1) * 100).toFixed(1);
  }
  // Re-renderizar solo la fila afectada
  const tbody = document.getElementById(prefix === 'v' ? 'v-tbody' : 'c-tbody');
  const trs = tbody.querySelectorAll('tr');
  if (trs[ri]) tbody.replaceChild(makeRow(prefix, ri), trs[ri]);
  recalcTotals(prefix);
}

/* ── Refrescar labels "= valor" sin re-renderizar ── */
function refreshRowCalcs(prefix, ri) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  const computed = calcValsFromPcts(rows[ri]);
  for (let i = 1; i < Estado.anos; i++) {
    const lbl = document.getElementById(`${prefix}-calc-${ri}-${i}`);
    if (lbl) lbl.textContent = '= ' + fmt(computed[i]);
  }
}

/* ── Recalcular totales de columna y actualizar gráfico ── */
function recalcTotals(prefix) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  const colTot = Array(Estado.anos).fill(0);

  rows.forEach((r, ri) => {
    const computed = calcValsFromPcts(r);
    for (let i = 0; i < 10; i++) r.vals[i] = computed[i]; // sync para flujo de caja
    let rowTotal = 0;
    for (let i = 0; i < Estado.anos; i++) { rowTotal += computed[i]; colTot[i] += computed[i]; }
    const el = document.getElementById(`${prefix}-rt-${ri}`);
    if (el) el.textContent = fmt(rowTotal);
  });

  // Fila total
  const totRow = document.getElementById(`${prefix}-total-row`);
  if (totRow) {
    const tds = totRow.querySelectorAll('td');
    colTot.forEach((v, i) => { if (tds[i + 1]) tds[i + 1].textContent = fmt(v); });
    const grand = colTot.reduce((a, b) => a + b, 0);
    if (tds[Estado.anos + 1]) tds[Estado.anos + 1].textContent = fmt(grand);
  }

  if (prefix === 'v') updateChartVentas(colTot);
  else updateChartCostos(colTot);
}

/* ── Gráficos ── */
function updateChartVentas(data) {
  const labels = Array.from({ length: Estado.anos }, (_, i) => 'Año ' + (i + 1));
  if (chartVentas) {
    chartVentas.data.labels = labels;
    chartVentas.data.datasets[0].data = data.slice(0, Estado.anos);
    chartVentas.update(); return;
  }
  const ctx = document.getElementById('chart-ventas')?.getContext('2d');
  if (!ctx) return;
  chartVentas = new Chart(ctx, { type: 'bar', data: { labels,
    datasets: [{ label: 'Ingresos', data: data.slice(0, Estado.anos),
      backgroundColor: 'rgba(201,168,76,0.25)', borderColor: 'rgba(201,168,76,0.9)',
      borderWidth: 2, borderRadius: 5 }]
  }, options: chartOptions() });
}

function updateChartCostos(data) {
  const labels = Array.from({ length: Estado.anos }, (_, i) => 'Año ' + (i + 1));
  if (chartCostos) {
    chartCostos.data.labels = labels;
    chartCostos.data.datasets[0].data = data.slice(0, Estado.anos);
    chartCostos.update(); return;
  }
  const ctx = document.getElementById('chart-costos')?.getContext('2d');
  if (!ctx) return;
  chartCostos = new Chart(ctx, { type: 'bar', data: { labels,
    datasets: [{ label: 'Costos', data: data.slice(0, Estado.anos),
      backgroundColor: 'rgba(228,75,74,0.18)', borderColor: 'rgba(228,75,74,0.85)',
      borderWidth: 2, borderRadius: 5 }]
  }, options: chartOptions() });
}

function chartOptions() {
  return { responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.raw) } } },
    scales: { y: { ticks: { callback: v => fmt(v) }, grid: { color: 'rgba(0,0,0,0.05)' } },
              x: { grid: { display: false } } } };
}

/* ── Render completo ── */
function newRow(nm, base, pct5) {
  return { nm, base, pcts: [null, pct5, pct5, pct5, pct5, pct5, pct5, pct5, pct5, pct5],
    vals: Array(10).fill(base),
    modo: ['val','pct','pct','pct','pct','pct','pct','pct','pct','pct'] };
}

function renderVentas() {
  buildYearsHeader('v-thead');
  const tb = document.getElementById('v-tbody'); tb.innerHTML = '';
  if (!Estado.ventaRows.length)
    Estado.ventaRows = [newRow('Ventas producto principal', 80, 5)];
  Estado.ventaRows.forEach((_, ri) => tb.appendChild(makeRow('v', ri)));
  buildTotalRow('v-tfoot', 'v');
  recalcTotals('v');
}

function renderCostos() {
  buildYearsHeader('c-thead');
  const tb = document.getElementById('c-tbody'); tb.innerHTML = '';
  if (!Estado.costoRows.length)
    Estado.costoRows = [newRow('Costo de ventas', 48, 5), newRow('Gastos operacionales', 12, 3)];
  Estado.costoRows.forEach((_, ri) => tb.appendChild(makeRow('c', ri)));
  buildTotalRow('c-tfoot', 'c');
  recalcTotals('c');
}

function buildTotalRow(tfootId, prefix) {
  const tfoot = document.getElementById(tfootId);
  const cols = Array.from({ length: Estado.anos }, () =>
    `<td style="font-weight:700;text-align:right;padding:7px 10px">—</td>`).join('');
  tfoot.innerHTML = `<tr class="total-row" id="${prefix}-total-row">
    <td>TOTAL</td>${cols}
    <td style="font-weight:700;text-align:right;padding:7px 10px">—</td><td></td>
  </tr>`;
}

/* ── Agregar / eliminar ── */
function addVentaRow() { Estado.ventaRows.push(newRow('Nuevo ingreso', 0, 5)); renderVentas(); }
function addCostoRow() { Estado.costoRows.push(newRow('Nuevo costo', 0, 5)); renderCostos(); }
function removeRow(prefix, ri) {
  if (prefix === 'v') { Estado.ventaRows.splice(ri, 1); renderVentas(); }
  else { Estado.costoRows.splice(ri, 1); renderCostos(); }
}
