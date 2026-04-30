# 📊 Evaluador de Proyectos de Inversión
### MPL Solutions · Herramienta financiera profesional

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://mplsolutions.github.io/evaluador-proyectos)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)](LICENSE)
[![Sin backend](https://img.shields.io/badge/Backend-Ninguno-lightgrey)](.)
[![Gratis](https://img.shields.io/badge/Costo-Gratuito-gold)](.)

Herramienta de evaluación financiera de proyectos de inversión desarrollada para el sector maderero y empresarial. Funciona 100% en el navegador, sin servidores ni bases de datos.

---

## 🚀 Demo en vivo

**[mplsolutions.github.io/evaluador-proyectos](https://mplsolutions.github.io/evaluador-proyectos)**

---

## ✨ Funcionalidades

### 📋 Pestaña 1 — Parámetros iniciales
- Nombre y tipo de proyecto (nueva línea, maquinaria, nuevo negocio, etc.)
- **Horizonte de evaluación**: slider ajustable de 1 a 10 años
- Inversión inicial y valor residual de activos
- **Financiamiento**: capital propio o mixto con préstamo (sistema francés, cuota fija)
- **Depreciaciones**: por tipo de activo (maquinaria, vehículos, infraestructura, TI) o vida útil manual
- **Capital de trabajo**: monto fijo con opción de recuperación al término del proyecto
- **Tasa de descuento**: ingreso manual o cálculo automático mediante **WACC simplificado**
- Tasa de impuesto a la renta configurable

### 📈 Pestaña 2 — Ventas y Costos
- Múltiples líneas de ingresos y costos
- **Año 1**: valor base absoluto
- **Años 2 en adelante**: porcentaje de aumento sobre el año anterior (%) o valor absoluto (#) — toggle por celda
- Los valores en cadena se recalculan automáticamente al cambiar el año base
- Gráficos de barras interactivos que se actualizan en tiempo real

### 💹 Pestaña 3 — Flujo de Caja
- **Año 0** con inversión inicial, capital de trabajo y préstamo recibido
- Estado de resultados completo: EBITDA → EBIT → EBT → Utilidad neta
- Flujo de caja operacional (FCO)
- Flujo de caja neto (FCN) con amortización de deuda
- Flujo de caja libre (FCL) con valor residual y recuperación de capital de trabajo
- Flujo acumulado por año
- Gráfico dual EBITDA vs FCN

### 🎯 Pestaña 4 — Resultados y Conclusiones
- **VAN** (Valor Actual Neto)
- **TIR** (Tasa Interna de Retorno)
- **Payback simple** y **Payback descontado**
- EBITDA año 1 y margen EBITDA
- FCL acumulado total
- **Semáforo de viabilidad**: Viable / Revisar / No viable
- **Análisis de sensibilidad**: varía ingresos, costos, inversión o tasa de descuento en rangos de ±10% a ±50%

---

## 🗂️ Estructura del proyecto

```
evaluador-proyectos/
│
├── index.html              ← Estructura HTML (solo markup)
│
├── css/
│   └── styles.css          ← Diseño y estilos completos
│
├── js/
│   ├── estado.js           ← Estado global, utilidades (fmt, TIR, tabs)
│   ├── parametros.js       ← Lógica pestaña 1 (WACC, depreciaciones, financiamiento)
│   ├── ventas.js           ← Lógica pestaña 2 (tablas, gráficos, % de aumento)
│   ├── flujo.js            ← Construcción del FCF con Año 0
│   └── resultados.js       ← KPIs, semáforo y análisis de sensibilidad
│
└── README.md
```

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| HTML5 / CSS3 | Estructura y diseño |
| JavaScript (vanilla) | Lógica financiera y UI |
| [Chart.js 4.4](https://www.chartjs.org/) | Gráficos interactivos |
| Google Fonts | Tipografías (Playfair Display, DM Sans) |
| GitHub Pages | Hosting gratuito |

Sin frameworks, sin npm, sin build process. Abre `index.html` y funciona.

---

## 📐 Modelo financiero

El evaluador implementa el siguiente modelo:

```
EBITDA  = Ingresos − Costos operacionales
EBIT    = EBITDA − Depreciaciones
EBT     = EBIT − Gastos financieros (intereses préstamo)
Utilidad neta = EBT − Impuesto a la renta

FCO     = Utilidad neta + Depreciaciones
FCN     = FCO − Amortización préstamo
FCL     = FCN + Valor residual + Recuperación KT (último año)

Año 0   = −Inversión − Capital de trabajo + Préstamo recibido

VAN     = Σ FCL_t / (1+r)^t   [desde Año 0]
TIR     = r tal que VAN = 0   [bisección numérica]
Payback = Período en que el FCL acumulado ≥ 0
WACC    = (D% × Kd × (1−T)) + (P% × Ke)
```

---

## 🚀 Cómo usar

### Opción 1 — Directo en el navegador
Visita **[mplsolutions.github.io/evaluador-proyectos](https://mplsolutions.github.io/evaluador-proyectos)**

### Opción 2 — Local
```bash
git clone https://github.com/mplsolutions/evaluador-proyectos.git
cd evaluador-proyectos
# Abrir index.html en cualquier navegador moderno
open index.html
```

No requiere instalación ni servidor local.

---

## 🔧 Cómo modificar

Cada archivo tiene una responsabilidad única:

| Quiero cambiar... | Editar archivo |
|---|---|
| Diseño visual, colores, fuentes | `css/styles.css` |
| Parámetros, WACC, depreciaciones | `js/parametros.js` |
| Tablas de ventas y costos | `js/ventas.js` |
| Estructura del flujo de caja | `js/flujo.js` |
| KPIs, semáforo, sensibilidad | `js/resultados.js` |
| Estructura HTML de pestañas | `index.html` |

---

## 📁 Otros proyectos del portal

| Herramienta | Repositorio |
|---|---|
| Optimizador de Corte 1D | [dob97abc-eng.github.io/optimizador-corte](https://dob97abc-eng.github.io/optimizador-corte/) |
| Portal principal | _próximamente_ |

---

## 📄 Licencia

MIT — libre para usar, modificar y distribuir.

---

*Desarrollado con asistencia de [Claude AI](https://claude.ai) · MPL Solutions · 2025*
