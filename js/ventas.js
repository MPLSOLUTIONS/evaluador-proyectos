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
  const col0 = `<th class="col-base">Año 1<small>Valor base</small></th>`;
  const cols = Array.from({ length: Estado.anos - 1 }, (_, i) =>
    `<th>Año ${i + 2}<small>% o valor</small></th>`
  ).join('');
  thead.innerHTML = `<tr>
    <th>Concepto</th>
    ${Estado.anos >= 1 ? col0 : ''}${cols}
    <th>Total</th><th></th>
  </tr>`;
}

/* ── Fila editable ── */
function makeRow(prefix, ri) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  const r = rows[ri];
  const computed = calcValsFromPcts(r);

  const nameTd = `<td><input type="text" class="row-name" value="${r.nm}" aria-label="Concepto"
    oninput="updateRowName('${prefix}',${ri},this.value)"/></td>`;

  const year1Td = Estado.anos >= 1 ? `<td class="col-base">
    <input type="number" value="${(r.base||0).toFixed(2)}" min="0" step="0.1"
      oninput="updateBase('${prefix}',${ri},+this.value)"/>
    </td>` : '';

  let yearsTd = '';
  for (let i = 1; i < Estado.anos; i++) {
    const esPct = r.modo[i] === 'pct';
    const inputVal = esPct ? (r.pcts[i] || 5) : (computed[i] || 0);
    yearsTd += `<td id="${prefix}-cell-${ri}-${i}">
      <div class="cell-edit">
        <input type="number" id="${prefix}-inp-${ri}-${i}"
          class="${esPct ? 'is-pct' : ''}"
          value="${Number(inputVal).toFixed(esPct?1:2)}"
          step="0.1" min="${esPct?-100:0}"
          oninput="updateYearVal('${prefix}',${ri},${i},+this.value)"/>
        <button class="mode-btn ${esPct ? 'is-pct' : ''}" onclick="toggleModo('${prefix}',${ri},${i})"
          title="Cambiar entre % y valor">${esPct?'%':'#'}</button>
      </div>
      <div class="cell-calc" id="${prefix}-calc-${ri}-${i}">= ${fmt(computed[i])}</div>
    </td>`;
  }

  const totalTd = `<td class="row-total" id="${prefix}-rt-${ri}">—</td>`;
  const deleteTd = `<td><button class="btn-sm btn-danger" onclick="removeRow('${prefix}',${ri})" aria-label="Quitar línea">✕</button></td>`;

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
      backgroundColor: 'rgba(26,115,184,0.85)', borderRadius: 3, maxBarThickness: 44 }]
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
      backgroundColor: 'rgba(106,114,128,0.7)', borderRadius: 3, maxBarThickness: 44 }]
  }, options: chartOptions() });
}

function chartOptions() {
  return { responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.raw) } } },
    scales: { y: { ticks: { callback: v => fmt(v), color: '#6a7280' }, grid: { color: '#dbe8f2' }, border: { display: false } },
              x: { ticks: { color: '#6a7280' }, grid: { display: false } } } };
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
    Estado.ventaRows = [newRow('Ingreso 1', 0, 5)];
  Estado.ventaRows.forEach((_, ri) => tb.appendChild(makeRow('v', ri)));
  buildTotalRow('v-tfoot', 'v');
  recalcTotals('v');
}

function renderCostos() {
  buildYearsHeader('c-thead');
  const tb = document.getElementById('c-tbody'); tb.innerHTML = '';
  if (!Estado.costoRows.length)
    Estado.costoRows = [newRow('Costo 1', 0, 5)];
  Estado.costoRows.forEach((_, ri) => tb.appendChild(makeRow('c', ri)));
  buildTotalRow('c-tfoot', 'c');
  recalcTotals('c');
}

function buildTotalRow(tfootId, prefix) {
  const tfoot = document.getElementById(tfootId);
  const cols = Array.from({ length: Estado.anos }, () =>
    `<td>—</td>`).join('');
  tfoot.innerHTML = `<tr class="total-row" id="${prefix}-total-row">
    <td>Total</td>${cols}
    <td>—</td><td></td>
  </tr>`;
}

/* ── Agregar / eliminar ── */
function addVentaRow() { Estado.ventaRows.push(newRow('Nuevo ingreso', 0, 5)); renderVentas(); }
function addCostoRow() { Estado.costoRows.push(newRow('Nuevo costo', 0, 5)); renderCostos(); }
function removeRow(prefix, ri) {
  if (prefix === 'v') { Estado.ventaRows.splice(ri, 1); renderVentas(); }
  else { Estado.costoRows.splice(ri, 1); renderCostos(); }
}
