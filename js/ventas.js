/* ═══════════════════════════════════════
   ventas.js — Pestaña 2: Ventas y Costos
═══════════════════════════════════════ */

let chartVentas = null;
let chartCostos = null;

/* ── Cabecera de años ── */
function buildYearsHeader(theadId) {
  const thead = document.getElementById(theadId);
  const cols = Array.from({ length: Estado.anos }, (_, i) => `<th>Año ${i + 1}</th>`).join('');
  thead.innerHTML = `<tr>
    <th style="text-align:left;min-width:170px">Concepto</th>
    ${cols}
    <th>Total</th>
    <th></th>
  </tr>`;
}

/* ── Fila editable ── */
function makeRow(prefix, ri) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  const r = rows[ri];
  const tr = document.createElement('tr');

  const nameTd = `<td>
    <input type="text" value="${r.nm}"
      style="width:155px;background:var(--surface2);text-align:left;font-weight:500"
      oninput="updateRowName('${prefix}', ${ri}, this.value)"/>
  </td>`;

  const valsTd = Array.from({ length: Estado.anos }, (_, i) => `
    <td>
      <input type="number" value="${r.vals[i] || 0}" min="0" step="0.1"
        oninput="updateRowVal('${prefix}', ${ri}, ${i}, +this.value)"/>
    </td>`).join('');

  const totalTd = `<td id="${prefix}-rt-${ri}" style="font-weight:700;text-align:right;padding:6px 10px">—</td>`;
  const deleteTd = `<td><button class="btn-sm btn-danger" onclick="removeRow('${prefix}', ${ri})">✕</button></td>`;

  tr.innerHTML = nameTd + valsTd + totalTd + deleteTd;
  return tr;
}

/* ── Actualizar nombre ── */
function updateRowName(prefix, ri, value) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  rows[ri].nm = value;
}

/* ── Actualizar valor y recalcular ── */
function updateRowVal(prefix, ri, col, value) {
  const rows = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  rows[ri].vals[col] = value;
  recalcTotals(prefix);
}

/* ── Recalcular totales y gráfico ── */
function recalcTotals(prefix) {
  const rows   = prefix === 'v' ? Estado.ventaRows : Estado.costoRows;
  const colTot = Array(Estado.anos).fill(0);

  rows.forEach((r, ri) => {
    let rowTotal = 0;
    for (let i = 0; i < Estado.anos; i++) {
      rowTotal += (r.vals[i] || 0);
      colTot[i] += (r.vals[i] || 0);
    }
    const el = document.getElementById(`${prefix}-rt-${ri}`);
    if (el) el.textContent = fmt(rowTotal);
  });

  // Fila de totales
  const totRow = document.getElementById(`${prefix}-total-row`);
  if (totRow) {
    const tds = totRow.querySelectorAll('td');
    colTot.forEach((v, i) => {
      if (tds[i + 1]) tds[i + 1].textContent = fmt(v);
    });
    const grandTotal = colTot.reduce((a, b) => a + b, 0);
    if (tds[Estado.anos + 1]) tds[Estado.anos + 1].textContent = fmt(grandTotal);
  }

  // Actualizar gráfico
  if (prefix === 'v') updateChartVentas(colTot);
  else updateChartCostos(colTot);
}

/* ── Gráficos ── */
function updateChartVentas(data) {
  const labels = Array.from({ length: Estado.anos }, (_, i) => 'Año ' + (i + 1));
  if (chartVentas) {
    chartVentas.data.labels = labels;
    chartVentas.data.datasets[0].data = data.slice(0, Estado.anos);
    chartVentas.update();
    return;
  }
  const ctx = document.getElementById('chart-ventas')?.getContext('2d');
  if (!ctx) return;
  chartVentas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ingresos totales',
        data: data.slice(0, Estado.anos),
        backgroundColor: 'rgba(201,168,76,0.25)',
        borderColor: 'rgba(201,168,76,0.9)',
        borderWidth: 2,
        borderRadius: 5,
      }]
    },
    options: chartOptions('Ingresos'),
  });
}

function updateChartCostos(data) {
  const labels = Array.from({ length: Estado.anos }, (_, i) => 'Año ' + (i + 1));
  if (chartCostos) {
    chartCostos.data.labels = labels;
    chartCostos.data.datasets[0].data = data.slice(0, Estado.anos);
    chartCostos.update();
    return;
  }
  const ctx = document.getElementById('chart-costos')?.getContext('2d');
  if (!ctx) return;
  chartCostos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Costos totales',
        data: data.slice(0, Estado.anos),
        backgroundColor: 'rgba(228,75,74,0.18)',
        borderColor: 'rgba(228,75,74,0.85)',
        borderWidth: 2,
        borderRadius: 5,
      }]
    },
    options: chartOptions('Costos'),
  });
}

function chartOptions(label) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: c => fmt(c.raw) } },
    },
    scales: {
      y: { ticks: { callback: v => fmt(v) }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };
}

/* ── Render completo de tabla ── */
function renderVentas() {
  buildYearsHeader('v-thead');
  const tb = document.getElementById('v-tbody');
  tb.innerHTML = '';

  if (!Estado.ventaRows.length) {
    Estado.ventaRows = [{ nm: 'Ventas producto principal', vals: Array(10).fill(80) }];
  }

  Estado.ventaRows.forEach((_, ri) => tb.appendChild(makeRow('v', ri)));
  buildTotalRow('v-tfoot', 'v');
  recalcTotals('v');
}

function renderCostos() {
  buildYearsHeader('c-thead');
  const tb = document.getElementById('c-tbody');
  tb.innerHTML = '';

  if (!Estado.costoRows.length) {
    Estado.costoRows = [
      { nm: 'Costo de ventas', vals: Array(10).fill(48) },
      { nm: 'Gastos operacionales', vals: Array(10).fill(12) },
    ];
  }

  Estado.costoRows.forEach((_, ri) => tb.appendChild(makeRow('c', ri)));
  buildTotalRow('c-tfoot', 'c');
  recalcTotals('c');
}

function buildTotalRow(tfootId, prefix) {
  const tfoot = document.getElementById(tfootId);
  const cols = Array.from({ length: Estado.anos }, (_, i) =>
    `<td id="${prefix}-col-tot-${i}" style="font-weight:700;text-align:right;padding:7px 10px">—</td>`
  ).join('');
  tfoot.innerHTML = `<tr class="total-row" id="${prefix}-total-row">
    <td>TOTAL</td>${cols}
    <td id="${prefix}-grand-tot" style="font-weight:700;text-align:right;padding:7px 10px">—</td>
    <td></td>
  </tr>`;
}

/* ── Agregar / eliminar filas ── */
function addVentaRow() {
  Estado.ventaRows.push({ nm: 'Nuevo ingreso', vals: Array(10).fill(0) });
  renderVentas();
}

function addCostoRow() {
  Estado.costoRows.push({ nm: 'Nuevo costo', vals: Array(10).fill(0) });
  renderCostos();
}

function removeRow(prefix, ri) {
  if (prefix === 'v') { Estado.ventaRows.splice(ri, 1); renderVentas(); }
  else { Estado.costoRows.splice(ri, 1); renderCostos(); }
}
