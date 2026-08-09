import { useState } from 'react';
import { Printer, FileBarChart } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { Tarjeta, Cargando, ErrorEstado } from '../components/ui';
import { pesos, rangoPeriodo, etiquetaPeriodo, hoyISO } from '../utils/format';

const NOMBRE_CATEGORIA = {
  gasolina: 'Gasolina',
  nomina: 'Nómina',
  publicidad: 'Publicidad',
  mantenimiento: 'Mantenimiento',
  otro: 'Otros gastos',
};

const PERIODOS = [
  { valor: 'dia', etiqueta: 'Día' },
  { valor: 'mes', etiqueta: 'Mes' },
  { valor: 'anio', etiqueta: 'Año' },
];

/**
 * Abre una ventana de impresion con el Estado de Resultados,
 * con el mismo formato de marca que las notas de pedido.
 */
function imprimirReporte({ etiquetaPeriodoTxt, datos }) {
  const filasEgresos = (datos.egresosPorCategoria || []).map(e => `
    <tr>
      <td>${NOMBRE_CATEGORIA[e.categoria] || e.categoria}</td>
      <td class="right">$${e.monto.toFixed(2)}</td>
    </tr>`).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>Estado de Resultados</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 28px 32px; }
      .header { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 2px solid #2D5016; margin-bottom: 14px; }
      .logo { width: 52px; height: 52px; object-fit: contain; }
      .marca h1 { font-size: 18px; font-weight: bold; color: #2D5016; line-height: 1.1; }
      .marca p { font-size: 10px; color: #888; }
      .tipo { margin-left: auto; text-align: right; }
      .tipo .etiqueta { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .5px; }
      .tipo .periodo { font-size: 15px; font-weight: bold; color: #2D5016; text-transform: capitalize; }
      h2.seccion { font-size: 12px; color: #2D5016; text-transform: uppercase; letter-spacing: .5px; margin: 18px 0 6px; border-bottom: 1px solid #c8e6c9; padding-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 5px 4px; border-bottom: 1px solid #f0f0f0; font-size: 12.5px; }
      .right { text-align: right; }
      .total td { font-weight: bold; border-top: 1.5px solid #2D5016; padding-top: 8px; }
      .neta { margin-top: 20px; padding: 14px; background: #f0f7ee; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
      .neta .label { font-size: 14px; font-weight: bold; color: #2D5016; }
      .neta .valor { font-size: 22px; font-weight: bold; color: #2D5016; }
      .margen { font-size: 11px; color: #666; margin-top: 4px; }
      .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
      @media print { body { padding: 12px 16px; } @page { margin: 0.5cm; } }
    </style>
  </head><body>
    <div class="header">
      <img class="logo" src="/logo.png" alt="Logo" />
      <div class="marca">
        <h1>Frutería Kiosko's</h1>
        <p>Distribuidora de Fruta y Verdura</p>
      </div>
      <div class="tipo">
        <div class="etiqueta">Estado de Resultados</div>
        <div class="periodo">${etiquetaPeriodoTxt}</div>
      </div>
    </div>

    <h2 class="seccion">Ingresos</h2>
    <table>
      <tr><td>Ventas (cobros del periodo)</td><td class="right">$${datos.ingresos.toFixed(2)}</td></tr>
      <tr class="total"><td>Total Ingresos</td><td class="right">$${datos.ingresos.toFixed(2)}</td></tr>
    </table>

    <h2 class="seccion">Egresos</h2>
    <table>
      ${filasEgresos || '<tr><td>Sin egresos registrados en el periodo</td><td class="right">$0.00</td></tr>'}
      <tr class="total"><td>Total Egresos</td><td class="right">$${datos.egresos.toFixed(2)}</td></tr>
    </table>

    <div class="neta">
      <div>
        <div class="label">Utilidad Neta</div>
        <div class="margen">Margen: ${datos.margen}%</div>
      </div>
      <div class="valor">$${datos.utilidad.toFixed(2)}</div>
    </div>

    <div class="footer">Sistema Kiosko's — Documento generado el ${new Date().toLocaleDateString('es-MX')}</div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

export default function Reportes() {
  const [periodo, setPeriodo] = useState('mes');
  const [fechaRef, setFechaRef] = useState(hoyISO());
  const { desde, hasta } = rangoPeriodo(periodo, fechaRef);

  const { datos, cargando, error, recargar } = useFetch(`/dashboard?desde=${desde}&hasta=${hasta}`);
  const d = datos || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-600 text-campo-dark flex items-center gap-2">
          <FileBarChart className="h-6 w-6" /> Estado de Resultados
        </h1>
        <p className="text-sm text-carbon/55">Reporte financiero del negocio por período.</p>
      </div>

      <Tarjeta className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-campo/15 bg-crema p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                onClick={() => setPeriodo(p.valor)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  periodo === p.valor ? 'bg-campo text-white' : 'text-carbon/60 hover:text-campo-dark'
                }`}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>

          {periodo === 'dia' && (
            <input type="date" value={fechaRef} onChange={(e) => setFechaRef(e.target.value)}
              className="rounded-lg border border-campo/15 px-3 py-2 text-sm outline-none focus:border-campo" />
          )}
          {periodo === 'mes' && (
            <input type="month" value={fechaRef.slice(0, 7)} onChange={(e) => setFechaRef(e.target.value + '-01')}
              className="rounded-lg border border-campo/15 px-3 py-2 text-sm outline-none focus:border-campo" />
          )}
          {periodo === 'anio' && (
            <input type="number" min="2020" max="2100" value={fechaRef.slice(0, 4)}
              onChange={(e) => setFechaRef(e.target.value + '-01-01')}
              className="w-28 rounded-lg border border-campo/15 px-3 py-2 text-sm outline-none focus:border-campo" />
          )}

          <button
            onClick={() => imprimirReporte({ etiquetaPeriodoTxt: etiquetaPeriodo(periodo, fechaRef), datos: d })}
            disabled={cargando || !!error}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-campo/20 px-3 py-2 text-sm font-medium text-campo hover:bg-campo/10 transition disabled:opacity-40"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </button>
        </div>
      </Tarjeta>

      {cargando ? <Cargando texto="Cargando el reporte..." /> : error ? <ErrorEstado mensaje={error} onReintentar={recargar} /> : (
        <Tarjeta className="p-6 max-w-2xl">
          <p className="mb-4 text-sm font-medium text-carbon/50 capitalize">{etiquetaPeriodo(periodo, fechaRef)}</p>

          <h2 className="mb-2 text-xs font-600 uppercase tracking-wide text-campo-dark border-b border-campo/15 pb-1.5">
            Ingresos
          </h2>
          <div className="flex justify-between py-1.5 text-sm">
            <span className="text-carbon/70">Ventas (cobros del período)</span>
            <span className="font-medium text-carbon">{pesos(d.ingresos)}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm font-700 border-t border-campo/15 mt-1 pt-2">
            <span className="text-campo-dark">Total Ingresos</span>
            <span className="text-campo-dark">{pesos(d.ingresos)}</span>
          </div>

          <h2 className="mt-5 mb-2 text-xs font-600 uppercase tracking-wide text-campo-dark border-b border-campo/15 pb-1.5">
            Egresos
          </h2>
          {(d.egresosPorCategoria || []).length === 0 ? (
            <p className="py-1.5 text-sm text-carbon/50">Sin egresos registrados en el período.</p>
          ) : (
            d.egresosPorCategoria.map((e) => (
              <div key={e.categoria} className="flex justify-between py-1.5 text-sm">
                <span className="text-carbon/70">{NOMBRE_CATEGORIA[e.categoria] || e.categoria}</span>
                <span className="font-medium text-carbon">{pesos(e.monto)}</span>
              </div>
            ))
          )}
          <div className="flex justify-between py-1.5 text-sm font-700 border-t border-campo/15 mt-1 pt-2">
            <span className="text-tierra">Total Egresos</span>
            <span className="text-tierra">{pesos(d.egresos)}</span>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-lg bg-campo/8 p-4">
            <div>
              <p className="font-700 text-campo-dark">Utilidad Neta</p>
              <p className="text-xs text-carbon/50">Margen: {d.margen || 0}%</p>
            </div>
            <p className="font-display text-2xl font-700 text-campo-dark">{pesos(d.utilidad)}</p>
          </div>
        </Tarjeta>
      )}
    </div>
  );
}
