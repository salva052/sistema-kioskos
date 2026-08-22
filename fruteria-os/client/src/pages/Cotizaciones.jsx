import { useState } from 'react';
import { Calculator, Plus, Trash2, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import { Tarjeta, Vacio, Boton, Campo, Select } from '../components/ui';
import { pesos, hoyISO } from '../utils/format';

export default function Cotizaciones() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const navigate = useNavigate();

  const clientes = useFetch('/clientes');
  const precios  = useFetch(`/productos/precios?fecha=${hoyISO()}`);

  // Solo productos con precio registrado (hoy o heredado)
  const precioMap = {};
  (precios.datos?.items || []).forEach(p => {
    precioMap[p.productoId] = { precio: p.precioVenta, costo: p.costo, nombre: p.nombre };
  });
  const productosConPrecio = Object.entries(precioMap)
    .map(([id, v]) => ({ id: Number(id), ...v }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const [clienteId, setClienteId] = useState('');
  const [reng, setReng]           = useState([{ productoId: '', cantidad: '' }]);
  const [resultado, setResultado] = useState(null);
  const [errores, setErrores]     = useState([]); // errores por renglon

  const addReng    = () => {
    if (reng.length >= 30) return; // máximo 30 productos por cotización
    setReng([...reng, { productoId: '', cantidad: '' }]);
  };
  const quitarReng = (i) => {
    if (reng.length === 1) return; // siempre al menos 1
    setReng(reng.filter((_, idx) => idx !== i));
    setErrores(errores.filter((_, idx) => idx !== i));
  };
  const setRenglon = (i, campo, val) => {
    const c = [...reng]; c[i] = { ...c[i], [campo]: val }; setReng(c);
    // Limpiar error de ese renglon al editar
    const e = [...errores]; e[i] = ''; setErrores(e);
    // Limpiar resultado al cambiar el formulario
    setResultado(null);
  };

  // ── Validaciones antes de calcular ─────────────────────────────────────────
  const validar = () => {
    const nuevosErrores = reng.map(() => '');
    let hayError = false;

    const idsUsados = new Set();

    reng.forEach((r, i) => {
      const pid = Number(r.productoId);
      const qty = Number(r.cantidad);

      if (!r.productoId) {
        nuevosErrores[i] = 'Selecciona un producto.';
        hayError = true;
        return;
      }
      if (!r.cantidad || isNaN(qty)) {
        nuevosErrores[i] = 'Escribe una cantidad.';
        hayError = true;
        return;
      }
      if (qty <= 0) {
        nuevosErrores[i] = 'La cantidad debe ser mayor a 0.';
        hayError = true;
        return;
      }
      if (qty > 10000) {
        nuevosErrores[i] = 'La cantidad parece muy alta (máx. 10,000 kg).';
        hayError = true;
        return;
      }
      if (idsUsados.has(pid)) {
        nuevosErrores[i] = 'Este producto ya está en la lista.';
        hayError = true;
        return;
      }
      idsUsados.add(pid);
    });

    setErrores(nuevosErrores);
    return !hayError;
  };

  const calcular = (e) => {
    e.preventDefault();
    if (!validar()) return;

    const itemsValidos = reng.filter(r => r.productoId && Number(r.cantidad) > 0);
    const detalle = itemsValidos.map(r => {
      const pid  = Number(r.productoId);
      const info = precioMap[pid];
      const cantidad = Number(r.cantidad);
      const subtotal = Number((info.precio * cantidad).toFixed(2));
      const margen   = Number(((info.precio - info.costo) * cantidad).toFixed(2));
      return { productoId: pid, nombre: info.nombre, cantidad, precioUnit: info.precio, costo: info.costo, subtotal, margen };
    });

    const total       = Number(detalle.reduce((s, d) => s + d.subtotal, 0).toFixed(2));
    const margenTotal = Number(detalle.reduce((s, d) => s + d.margen, 0).toFixed(2));
    const cliente     = clientes.datos?.find(c => c.id === Number(clienteId));
    setResultado({ detalle, total, margenTotal, cliente });
  };

  const imprimir = () => {
    if (!resultado) return;
    const { detalle, total, cliente } = resultado;
    const win = window.open('', '_blank');
    const filas = detalle.map(d => `
      <tr>
        <td>${d.nombre}</td>
        <td class="right">${d.cantidad} kg</td>
        <td class="right">$${d.precioUnit.toFixed(2)}</td>
        <td class="right">$${d.subtotal.toFixed(2)}</td>
      </tr>`).join('');
    win.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8"/><title>Cotización</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; padding: 28px 32px; }
        .header { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 2px solid #2D5016; margin-bottom: 14px; }
        .logo { width: 52px; height: 52px; object-fit: contain; }
        .marca h1 { font-size: 18px; font-weight: bold; color: #2D5016; }
        .marca p { font-size: 10px; color: #888; }
        .tipo { margin-left: auto; text-align: right; }
        .tipo .etq { font-size: 10px; color: #888; text-transform: uppercase; }
        .tipo .aviso { font-size: 11px; color: #aaa; font-style: italic; }
        .info { margin-bottom: 14px; font-size: 12px; }
        .info .label { color: #888; margin-right: 8px; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f0f7ee; }
        th { padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #2D5016; border-bottom: 1px solid #c8e6c9; }
        td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
        .right { text-align: right; }
        tfoot td { padding-top: 10px; border-top: 2px solid #2D5016; font-weight: bold; font-size: 13px; }
        .footer { margin-top: 22px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
        @media print { body { padding: 12px 16px; } @page { margin: 0.5cm; } }
      </style>
    </head><body>
      <div class="header">
        <img class="logo" src="/logo.png" alt="Logo" />
        <div class="marca"><h1>Frutería Kiosko's</h1><p>Distribuidora de Fruta y Verdura</p></div>
        <div class="tipo"><div class="etq">Cotización</div><div class="aviso">No es nota de venta</div></div>
      </div>
      <div class="info">
        <span class="label">Fecha:</span>${new Date().toLocaleDateString('es-MX')}
        ${cliente ? `&nbsp;&nbsp;<span class="label">Cliente:</span><strong>${cliente.nombre}</strong>` : ''}
      </div>
      <table>
        <thead><tr><th>Producto</th><th class="right">Cantidad</th><th class="right">Precio unit.</th><th class="right">Subtotal</th></tr></thead>
        <tbody>${filas}</tbody>
        <tfoot><tr>
          <td colspan="3" class="right" style="color:#2D5016">TOTAL</td>
          <td class="right" style="color:#2D5016;font-size:15px">$${total.toFixed(2)}</td>
        </tr></tfoot>
      </table>
      <div class="footer">Frutería Kiosko's — Cotización, no es nota de venta</div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const limpiar = () => {
    setClienteId('');
    setReng([{ productoId: '', cantidad: '' }]);
    setResultado(null);
    setErrores([]);
  };

  const cargandoPrecios = precios.cargando;
  const sinPrecios = !cargandoPrecios && productosConPrecio.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-600 text-campo-dark">Cotizaciones</h1>
        <p className="text-sm text-carbon/55">Calcula cuánto saldría un pedido sin registrarlo. Usa los precios del día.</p>
      </div>

      {sinPrecios && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠️ No hay precios registrados para hoy. Ve a <strong>Precios del día</strong> y guarda los precios antes de cotizar.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta className="p-5 h-fit">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-600 text-campo-dark">
            <Calculator className="h-5 w-5" /> Nueva cotización
          </h2>
          <form onSubmit={calcular} className="space-y-3">
            <Campo etiqueta="Cliente (opcional)">
              <Select value={clienteId} onChange={e => { setClienteId(e.target.value); setResultado(null); }}>
                <option value="">Sin cliente específico</option>
                {(clientes.datos || []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Campo>

            <div className="space-y-2">
              {reng.map((r, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <Select
                      value={r.productoId}
                      onChange={e => setRenglon(i, 'productoId', e.target.value)}
                      className={errores[i] ? 'border-tierra/50' : ''}
                    >
                      <option value="">
                        {cargandoPrecios ? 'Cargando precios...' : 'Selecciona producto...'}
                      </option>
                      {productosConPrecio.map(p => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={reng.some((rr, ii) => ii !== i && Number(rr.productoId) === p.id)}
                        >
                          {p.nombre} — ${p.precio.toFixed(2)}/kg
                        </option>
                      ))}
                    </Select>
                    <input
                      type="number" step="0.01" min="0.01" max="10000"
                      placeholder="kg"
                      value={r.cantidad}
                      onChange={e => setRenglon(i, 'cantidad', e.target.value)}
                      className={`w-24 rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-campo ${errores[i] ? 'border-tierra/50 bg-tierra/5' : 'border-campo/15'}`}
                    />
                    {reng.length > 1 && (
                      <button type="button" onClick={() => quitarReng(i)} className="text-carbon/40 hover:text-tierra flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {errores[i] && (
                    <p className="text-xs text-tierra pl-1">{errores[i]}</p>
                  )}
                </div>
              ))}
            </div>

            {reng.length < 30 && (
              <button type="button" onClick={addReng}
                className="text-sm font-medium text-campo hover:underline disabled:opacity-40"
                disabled={sinPrecios}>
                <Plus className="inline h-3.5 w-3.5 mr-1" />Agregar producto
              </button>
            )}

            <div className="flex gap-2 pt-1">
              <Boton tipo="submit" disabled={cargandoPrecios || sinPrecios}>
                <Calculator className="h-4 w-4" />Calcular
              </Boton>
              {(resultado || reng.some(r => r.productoId || r.cantidad)) && (
                <Boton variante="fantasma" tipo="button" onClick={limpiar}>Limpiar</Boton>
              )}
            </div>
          </form>
        </Tarjeta>

        <div>
          {!resultado ? (
            <Tarjeta className="p-5">
              <Vacio mensaje="Llena el formulario y haz clic en Calcular para ver el desglose." />
            </Tarjeta>
          ) : (
            <Tarjeta className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-600 text-campo-dark">
                  {resultado.cliente ? `Para ${resultado.cliente.nombre}` : 'Resultado'}
                </h2>
                <button onClick={imprimir}
                  className="flex items-center gap-1.5 rounded-lg border border-campo/20 px-3 py-1.5 text-sm font-medium text-campo hover:bg-campo/10 transition">
                  <Printer className="h-4 w-4" /> Imprimir
                </button>
              </div>

              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-campo-dark/70">
                  <tr>
                    <th className="pb-2 font-600">Producto</th>
                    <th className="pb-2 font-600 text-right">Cantidad</th>
                    <th className="pb-2 font-600 text-right">Precio</th>
                    <th className="pb-2 font-600 text-right">Subtotal</th>
                    {esAdmin && <th className="pb-2 font-600 text-right text-campo">Margen</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-campo/8">
                  {resultado.detalle.map((d, i) => (
                    <tr key={i}>
                      <td className="py-1.5 text-carbon">{d.nombre}</td>
                      <td className="py-1.5 text-right text-carbon/70">{d.cantidad} kg</td>
                      <td className="py-1.5 text-right text-carbon/70">{pesos(d.precioUnit)}</td>
                      <td className="py-1.5 text-right font-medium text-carbon">{pesos(d.subtotal)}</td>
                      {esAdmin && <td className="py-1.5 text-right font-600 text-campo">{pesos(d.margen)}</td>}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-campo/15">
                    <td colSpan={3} className="pt-2 text-right font-600 text-campo-dark">Total</td>
                    <td className="pt-2 text-right font-700 text-campo">{pesos(resultado.total)}</td>
                    {esAdmin && <td className="pt-2 text-right font-700 text-campo">{pesos(resultado.margenTotal)}</td>}
                  </tr>
                </tfoot>
              </table>

              {esAdmin && (
                <p className="mt-3 text-xs text-carbon/50">El margen no aparece en la impresión.</p>
              )}
              <div className="mt-4">
                <Boton variante="secundario" onClick={() => navigate('/pedidos')}>
                  Ir a crear pedido real
                </Boton>
              </div>
            </Tarjeta>
          )}
        </div>
      </div>
    </div>
  );
}
