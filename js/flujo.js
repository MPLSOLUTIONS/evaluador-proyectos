/* ═══════════════════════════════════════
   flujo.js — Pestaña 3: Flujo de Caja
═══════════════════════════════════════ */

let chartFCF = null;

/* ── Construir y renderizar el flujo completo ── */
function buildFCF() {
  const inv      = getInvTotal();                  // suma de valores de compra de activos
  const resid    = getResidTotal();                // suma de valores residuales de activos
  const kt       = +document.getElementById('p-kt').value || 0;
  const tax      = (+document.getElementById('p-impuesto').value || 0) / 100;
  const tasa     = getTasa();
  const deuda    = getDeudaTabla();
  const prestamo = Estado.financM === 'mixto'
    ? (+document.getElementById('f-monto').value || 0) : 0;

  const ing  = getColTotals(Estado.ventaRows);
  const cost = getColTotals(Estado.costoRows);
  const anos = Estado.anos;

  // ── Calcular filas año a año ──
  const rows = [];
  const depPorAno = Array.from({ length: anos }, (_, i) => getDepPorAno(i));

  for (let i = 0; i < anos; i++) {
    const depA     = depPorAno[i];               // depreciación real de ese año
    const ebitda   = ing[i]  - cost[i];
    const ebit     = ebitda  - depA;
    const interes  = deuda[i].i;
    const ebt      = ebit    - interes;
    const impuesto = Math.max(0, ebt * tax);
    const utilNeta = ebt     - impuesto;
    const fcOp     = utilNeta + depA;
    const fcn      = fcOp    - deuda[i].a;

    // FCL: FCN + residual y KT en último año del proyecto
    let fcl = fcn;
    if (i === anos - 1) {
      fcl += resid + (Estado.ktRecup === 'si' ? kt : 0);
    }

    rows.push({ ing: ing[i], cost: cost[i], ebitda, depA, ebit, interes, ebt, impuesto, utilNeta, fcOp, amort: deuda[i].a, fcn, fcl });
  }

  // Guardar en estado global
  const yr0FCL = -(inv + kt) + (Estado.financM === 'mixto' ? prestamo : 0);
  Estado.lastFCF = { rows, inv, resid, kt, tasa, tax, depPorAno, anos, deuda, prestamo, ing, cost, yr0FCL };

  // ── Renderizar tabla ──
  renderFCFTable(rows, inv, kt, resid, prestamo, anos);

  // ── Renderizar gráfico ──
  renderFCFChart(rows, anos, yr0FCL);
}

/* ── Tabla de flujo de caja ── */
function renderFCFTable(rows, inv, kt, resid, prestamo, anos) {
  const table = document.getElementById('fcf-table');

  // Cabecera con Año 0
  const yr0th = `<th class="yr0">Año 0</th>`;
  const yrsth = Array.from({ length: anos }, (_, i) => `<th>Año ${i + 1}</th>`).join('');
  const thead = `<thead><tr>
    <th style="text-align:left;min-width:220px">Concepto</th>
    ${yr0th}${yrsth}
  </tr></thead>`;

  // Helpers para filas
  const dash0 = `<td class="yr0-cell">—</td>`;
  const val0  = v => `<td class="yr0-cell" style="font-weight:700;color:${v < 0 ? 'var(--red)' : 'var(--green)'}">${fmt(v)}</td>`;
  const dashN = n => Array(n).fill('<td>—</td>').join('');
  const lastN = (arr, last) => Array.from({ length: anos }, (_, i) =>
    `<td class="${arr[i] < 0 ? 'neg-v' : ''}">${fmt(arr[i])}</td>`
  ).join('');

  function secRow(label, tip) {
    return `<tr class="sec-row"><td colspan="${anos + 2}">${label}${tip ? tipHtml(tip) : ''}</td></tr>`;
  }

  function row(label, yr0val, arr, indent = false, tip = null) {
    const yr0td = yr0val !== null ? val0(yr0val) : dash0;
    const tds = Array.from({ length: anos }, (_, i) =>
      `<td class="${arr[i] < 0 ? 'neg-v' : ''}">${fmt(arr[i])}</td>`
    ).join('');
    return `<tr class="${indent ? 'ind' : ''}"><td>${label}${tip ? tipHtml(tip) : ''}</td>${yr0td}${tds}</tr>`;
  }

  function subRow(label, yr0val, arr, tip = null) {
    const yr0td = yr0val !== null ? val0(yr0val) : dash0;
    const tds = Array.from({ length: anos }, (_, i) =>
      `<td style="font-weight:700;color:${arr[i] < 0 ? 'var(--red)' : 'var(--green)'}">${fmt(arr[i])}</td>`
    ).join('');
    return `<tr class="sub-row"><td>${label}${tip ? tipHtml(tip) : ''}</td>${yr0td}${tds}</tr>`;
  }

  function totRow(label, yr0val, arr, tip = null) {
    const yr0td = yr0val !== null ? val0(yr0val) : dash0;
    const tds = Array.from({ length: anos }, (_, i) =>
      `<td style="font-weight:700;color:${arr[i] < 0 ? 'var(--red)' : 'var(--green)'}">${fmt(arr[i])}</td>`
    ).join('');
    return `<tr class="tot-row"><td>${label}${tip ? tipHtml(tip) : ''}</td>${yr0td}${tds}</tr>`;
  }

  // ── Sección: Resultado de operación ──
  let html = secRow('RESULTADO DE OPERACIÓN', 'Estado de resultados del proyecto: desde ingresos y costos hasta la utilidad neta, año a año.');
  html += row('(+) Ingresos por ventas',     null, rows.map(r => r.ing));
  html += row('(-) Costos operacionales',    null, rows.map(r => -r.cost));
  html += subRow('EBITDA',                   null, rows.map(r => r.ebitda),
    'Ingresos − Costos operacionales. Mide la rentabilidad operativa antes de depreciación, intereses e impuestos.');
  html += row('(-) Depreciaciones',          null, rows.map(r => -r.depA), true,
    'Desgaste contable anual de los activos, calculado en la pestaña Parámetros. No representa una salida real de caja.');
  html += subRow('EBIT — Resultado operacional', null, rows.map(r => r.ebit),
    'EBITDA − Depreciaciones. Utilidad operativa después de descontar el desgaste de los activos.');

  if (Estado.financM === 'mixto') {
    html += row('(-) Gastos financieros (intereses)', null, rows.map(r => -r.interes), true,
      'Intereses del préstamo sobre el saldo insoluto ese año (sistema francés). Se deducen de impuesto.');
  }

  html += subRow('EBT — Resultado antes de impuesto', null, rows.map(r => r.ebt),
    'EBIT − Gastos financieros. Base sobre la cual se calcula el impuesto a la renta.');
  html += row('(-) Impuesto a la renta',     null, rows.map(r => -r.impuesto), true,
    'EBT × tasa de impuesto (definida en Parámetros). Solo se aplica si el EBT es positivo.');
  html += subRow('Utilidad neta',             null, rows.map(r => r.utilNeta),
    'EBT − Impuesto a la renta. Resultado contable final del ejercicio.');

  // ── Sección: Flujo de caja ──
  html += secRow('FLUJO DE CAJA OPERACIONAL', 'Convierte la utilidad contable en caja real: se reincorpora la depreciación (no es salida de caja) y se descuenta la amortización de deuda.');
  html += row('(+) Utilidad neta',           null, rows.map(r => r.utilNeta));
  html += row('(+) Depreciaciones (no caja)', null, rows.map(r => r.depA), true,
    'Se suma de vuelta porque fue descontada contablemente pero no implica una salida real de caja.');
  html += subRow('Flujo de caja operacional (FCO)', null, rows.map(r => r.fcOp),
    'Utilidad neta + Depreciaciones. Caja generada por la operación del negocio, antes de pagos de deuda.');

  if (Estado.financM === 'mixto') {
    html += row('(-) Amortización préstamo', null, rows.map(r => -r.amort), true,
      'Parte del pago anual del préstamo que reduce el capital adeudado (no es gasto contable, pero sí sale de la caja).');
  }

  html += totRow('Flujo de Caja Neto (FCN)', null, rows.map(r => r.fcn),
    'FCO − Amortización del préstamo. Caja neta que efectivamente queda disponible cada año.');

  // ── Sección: Inversión inicial (Año 0) y recuperaciones ──
  html += secRow('INVERSIÓN, FINANCIAMIENTO Y RECUPERACIONES', 'Movimientos de caja del Año 0 (inversión, capital de trabajo, préstamo) y las recuperaciones del último año (valor residual, capital de trabajo).');

  // Año 0: salidas
  html += row('(-) Inversión inicial', -inv, Array(anos).fill(0), false,
    'Suma de los valores de compra de todos los activos (pestaña Parámetros). Sale de caja en el Año 0.');
  html += row('(-) Capital de trabajo', -kt, Array(anos).fill(0), true,
    'Monto de capital de trabajo invertido en el Año 0 para iniciar la operación.');

  if (Estado.financM === 'mixto') {
    html += row('(+) Préstamo recibido', prestamo, Array(anos).fill(0), true,
      'Monto del préstamo que ingresa como caja en el Año 0, financiando parte de la inversión.');
  }

  // Último año: recuperaciones
  if (resid > 0) {
    const residArr = Array(anos).fill(0);
    residArr[anos - 1] = resid;
    html += row('(+) Valor residual activos', 0, residArr, true,
      'Valor residual de los activos, recuperado como ingreso en el último año del horizonte de evaluación.');
  }

  if (Estado.ktRecup === 'si') {
    const ktArr = Array(anos).fill(0);
    ktArr[anos - 1] = kt;
    html += row('(+) Recuperación capital de trabajo', 0, ktArr, true,
      'El capital de trabajo invertido en el Año 0 se recupera como ingreso en el último año (configurado en Parámetros).');
  }

  // FCL: incluye Año 0
  const yr0FCL = -(inv + kt) + (Estado.financM === 'mixto' ? prestamo : 0);
  html += totRow('Flujo de Caja Libre (FCL)', yr0FCL, rows.map(r => r.fcl),
    'Flujo de Caja Neto + recuperaciones del último año (valor residual y capital de trabajo). Es la base para calcular VAN, TIR y Payback.');

  // ── Acumulado ──
  let acum = yr0FCL;
  const acumArr = rows.map(r => { acum += r.fcl; return acum; });
  html += row('Flujo acumulado', yr0FCL, acumArr, false,
    'Suma progresiva del FCL desde el Año 0. El momento en que pasa de negativo a positivo marca el punto de recuperación (payback).');

  table.innerHTML = thead + `<tbody>${html}</tbody>`;
}

/* ── Gráfico EBITDA vs FCN vs FCL acumulado ── */
function renderFCFChart(rows, anos, yr0FCL) {
  const labels  = Array.from({ length: anos }, (_, i) => 'Año ' + (i + 1));
  const ebitda  = rows.map(r => r.ebitda);
  const fcn     = rows.map(r => r.fcn);

  // FCL acumulado desde Año 0
  let acum = yr0FCL;
  const fclAcum = rows.map(r => { acum += r.fcl; return acum; });

  if (chartFCF) {
    // Si el gráfico ya tiene 3 datasets, solo actualizar datos
    if (chartFCF.data.datasets.length === 3) {
      chartFCF.data.labels           = labels;
      chartFCF.data.datasets[0].data = ebitda;
      chartFCF.data.datasets[1].data = fcn;
      chartFCF.data.datasets[2].data = fclAcum;
      chartFCF.update();
      return;
    }
    // Si tiene menos datasets (versión antigua), destruir y recrear
    chartFCF.destroy();
    chartFCF = null;
  }

  const ctx = document.getElementById('chart-fcf')?.getContext('2d');
  if (!ctx) return;

  chartFCF = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'EBITDA',
          data: ebitda,
          backgroundColor: 'rgba(201,168,76,0.25)',
          borderColor: 'rgba(201,168,76,0.9)',
          borderWidth: 2,
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Flujo de Caja Neto',
          data: fcn,
          borderColor: 'rgba(26,107,48,0.9)',
          backgroundColor: 'rgba(26,107,48,0.08)',
          borderWidth: 2.5,
          tension: 0.3,
          fill: false,
          pointRadius: 5,
          pointBackgroundColor: 'rgba(26,107,48,0.9)',
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'FCL Acumulado',
          data: fclAcum,
          borderColor: 'rgba(100,149,237,0.9)',
          backgroundColor: 'rgba(100,149,237,0.08)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: false,
          pointRadius: 5,
          pointBackgroundColor: 'rgba(100,149,237,0.9)',
          borderDash: [6, 3],
          yAxisID: 'y',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'DM Sans', size: 11 }, padding: 14 },
        },
        tooltip: {
          callbacks: {
            label: c => `${c.dataset.label}: ${fmt(c.raw)}`,
            afterBody: (items) => {
              // Indicar si FCL acumulado cruza cero (punto de payback)
              const fclItem = items.find(i => i.dataset.label === 'FCL Acumulado');
              if (fclItem && fclItem.raw >= 0) {
                const prev = fclItem.dataset.data[fclItem.dataIndex - 1];
                if (prev !== undefined && prev < 0) return ['✅ Punto de recuperación'];
              }
              return [];
            }
          },
        },
        // Línea de referencia en cero para FCL acumulado
        annotation: null,
      },
      scales: {
        y: {
          ticks: { callback: v => fmt(v) },
          grid: { color: 'rgba(0,0,0,0.05)' },
          // Línea en cero destacada
          afterDataLimits: axis => {
            if (axis.max < 0) axis.max = axis.max * 0.9;
          },
        },
        x: { grid: { display: false } },
      },
    },
  });
}
