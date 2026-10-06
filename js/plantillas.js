/* ═══════════════════════════════════════
   plantillas.js — Plantillas de partida por rubro
   Precargan supuestos de ejemplo; todo es editable.
   Valores en millones (CLP) o miles (UF), según la moneda activa.
   activos : [nombre, tipo, valor, residual% (opcional), vida (opcional)]
   ventas / costos : [nombre, base año 1, % de crecimiento anual]
═══════════════════════════════════════ */

const PLANTILLAS = {
  ejemplo: {
    label: 'Ejemplo genérico',
    desc: 'Caso de muestra con valores neutros.',
    nombre: 'Proyecto de ejemplo', tipo: 'Nuevo negocio', anos: 5, kt: 30, tasa: 12,
    activos: [
      ['Equipamiento principal', 'Maquinaria y equipos', 300],
      ['Infraestructura', 'Edificios e infraestructura', 200],
    ],
    ventas: [['Ingresos principales', 380, 6]],
    costos: [['Costo de ventas', 100, 4], ['Gastos operacionales', 30, 3]],
  },
  blanco: {
    label: 'En blanco',
    desc: 'Sin datos precargados.',
    nombre: '', tipo: 'Otro', anos: 5, kt: 0, tasa: 12,
    activos: [['Activo 1', 'Otro (definir)', 0]],
    ventas: [['Ingreso 1', 0, 5]],
    costos: [['Costo 1', 0, 5]],
  },
  manufactura: {
    label: 'Manufactura / producción',
    desc: 'Nueva línea o planta de producción.',
    nombre: 'Nueva línea de producción', tipo: 'Expansión de capacidad', anos: 6, kt: 45, tasa: 12,
    activos: [
      ['Maquinaria de producción', 'Maquinaria y equipos', 350],
      ['Obras civiles y galpón', 'Edificios e infraestructura', 180],
      ['Equipos de transporte interno', 'Vehículos', 40],
    ],
    ventas: [['Venta de producto terminado', 520, 5]],
    costos: [['Materias primas', 220, 5], ['Mano de obra directa', 50, 4], ['Gastos generales de planta', 20, 3]],
  },
  comercio: {
    label: 'Comercio minorista',
    desc: 'Apertura o ampliación de un local de venta.',
    nombre: 'Nuevo local de venta', tipo: 'Nuevo negocio', anos: 5, kt: 60, tasa: 14,
    activos: [
      ['Habilitación del local', 'Edificios e infraestructura', 110],
      ['Mobiliario y exhibición', 'Mobiliario y habilitación', 45],
      ['Equipos de venta y TI', 'Tecnología y software', 15],
    ],
    ventas: [['Ventas de productos', 480, 6]],
    costos: [['Costo de mercadería', 290, 6], ['Arriendo y gastos del local', 45, 3], ['Remuneraciones', 45, 4]],
  },
  servicios: {
    label: 'Servicios profesionales',
    desc: 'Consultoría, estudio o empresa de servicios.',
    nombre: 'Nueva unidad de servicios', tipo: 'Nuevo negocio', anos: 5, kt: 15, tasa: 15,
    activos: [
      ['Equipos computacionales', 'Tecnología y software', 25],
      ['Oficina y mobiliario', 'Mobiliario y habilitación', 20],
    ],
    ventas: [['Servicios por proyecto', 70, 8], ['Contratos recurrentes', 25, 10]],
    costos: [['Remuneraciones', 55, 5], ['Gastos generales', 12, 3]],
  },
  tecnologia: {
    label: 'Tecnología / software',
    desc: 'Desarrollo de un producto digital o plataforma.',
    nombre: 'Desarrollo de plataforma digital', tipo: 'Desarrollo tecnológico', anos: 5, kt: 30, tasa: 16,
    activos: [
      ['Desarrollo de la plataforma', 'Tecnología y software', 120, 0, 5],
      ['Equipos del equipo técnico', 'Tecnología y software', 25],
    ],
    ventas: [['Suscripciones', 110, 40]],
    costos: [['Equipo de desarrollo y soporte', 90, 10], ['Infraestructura y marketing', 25, 25]],
  },
  inmobiliario: {
    label: 'Inmobiliario / arriendo',
    desc: 'Compra de un inmueble para renta.',
    nombre: 'Inmueble para renta', tipo: 'Inmueble o infraestructura', anos: 8, kt: 0, tasa: 6,
    activos: [['Inmueble', 'Edificios e infraestructura', 800, 80, 40]],
    ventas: [['Ingresos por arriendo', 85, 3]],
    costos: [['Mantención y contribuciones', 12, 3], ['Administración', 5, 3]],
  },
  agro: {
    label: 'Agroindustria',
    desc: 'Plantación, riego o maquinaria agrícola.',
    nombre: 'Nueva plantación', tipo: 'Expansión de capacidad', anos: 8, kt: 50, tasa: 10,
    activos: [
      ['Maquinaria agrícola', 'Maquinaria y equipos', 150],
      ['Sistema de riego e infraestructura', 'Edificios e infraestructura', 120],
    ],
    ventas: [['Venta de cosecha', 330, 4]],
    costos: [['Insumos y labores', 130, 4], ['Mano de obra', 70, 4], ['Gastos generales', 20, 3]],
  },
};

function initPlantillas() {
  const sel = document.getElementById('p-plantilla');
  sel.innerHTML = Object.entries(PLANTILLAS)
    .map(([id, t]) => `<option value="${id}">${t.label}</option>`).join('');
  aplicarPlantilla('ejemplo');
}

function aplicarPlantilla(id) {
  const t = PLANTILLAS[id];
  if (!t) return;

  document.getElementById('p-plantilla').value = id;
  document.getElementById('p-plantilla-desc').textContent = t.desc;

  // Proyecto
  document.getElementById('p-nombre').value = t.nombre;
  document.getElementById('p-tipo').value = t.tipo;
  document.getElementById('p-anos').value = t.anos;
  Estado.anos = t.anos;
  document.getElementById('p-anos-label').textContent = t.anos + ' años';

  // Financiamiento y capital de trabajo
  setFinanc('propio', document.querySelector('#financ-toggle button'));
  document.getElementById('f-monto').value = 0;
  document.getElementById('p-kt').value = t.kt;
  setKTR('si', document.querySelector('#kt-toggle button'));
  setTasaM('manual', document.querySelector('#tasa-toggle button'));
  document.getElementById('p-tasa').value = t.tasa;

  // Activos
  document.getElementById('activos-list').innerHTML = '';
  t.activos.forEach(([nm, tipo, val, residPct, vida]) =>
    addActivo(nm, val, residPct == null ? null : +(val * residPct / 100).toFixed(2), vida ?? null, tipo));
  calcFinanc();
  calcWACC();

  // Ventas y costos
  Estado.ventaRows = t.ventas.map(([nm, base, pct]) => newRow(nm, base, pct));
  Estado.costoRows = t.costos.map(([nm, base, pct]) => newRow(nm, base, pct));
  if (_tabInit[1]) { renderVentas(); renderCostos(); }

  // Resultados anteriores ya no aplican
  Estado.lastFCF = null;
  document.getElementById('res-content').classList.add('hidden');
  document.getElementById('res-placeholder').classList.remove('hidden');
}
