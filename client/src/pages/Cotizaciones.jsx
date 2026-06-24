import { useState } from 'react';
import { Calculator, Plus, Trash2, Printer } from 'lucide-react';
import api from '../api/axios';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import { Tarjeta, Vacio, Boton, Campo, Select } from '../components/ui';
import { pesos, hoyISO } from '../utils/format';

/**
 * Pagina de cotizaciones.
 * Permite calcular cuanto saldria un pedido SIN guardarlo en la BD.
 * Usa los precios del dia actual para calcular subtotales y total.
 * Solo el admin ve el margen; en la impresion NO aparece.
 */
export default function Cotizaciones() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  const clientes = useFetch('/clientes');
  const productos = useFetch('/productos');
  const precios = useFetch(`/productos/precios?fecha=${hoyISO()}`);

  const [clienteId, setClienteId] = useState('');
  const [reng, setReng] = useState([{ productoId: '', cantidad: '' }]);
  const [resultado, setResultado] = useState(null);
  const [msg, setMsg] = useState('');

  const precioMap = {};
  (precios.datos?.items || []).forEach(p => {
    precioMap[p.productoId] = { precio: p.precioVenta, costo: p.costo, nombre: p.nombre };
  });

  const addReng = () => setReng([...reng, { productoId: '', cantidad: '' }]);

  const quitarReng = (i) => setReng(reng.filter((_, idx) => idx !== i));

  const setRenglon = (i, campo, val) => {
    const c = [...reng]; c[i] = { ...c[i], [campo]: val }; setReng(c);
  };

  const calcular = (e) => {
    e.preventDefault();
    setMsg('');
    const items = reng.filter(r => r.productoId && Number(r.cantidad) > 0);
    if (!items.length) { setMsg('Agrega al menos un producto con cantidad.'); return; }

    const detalle = items.map(r => {
      const pid = Number(r.productoId);
      const info = precioMap[pid];
      if (!info) return null;
      const cantidad = Number(r.cantidad);
      const subtotal = Number((info.precio * cantidad).toFixed(2));
      const margen = Number(((info.precio - info.costo) * cantidad).toFixed(2));
      return { productoId: pid, nombre: info.nombre, cantidad, precioUnit: info.precio, costo: info.costo, subtotal, margen };
    }).filter(Boolean);

    if (detalle.length !== items.length) {
      setMsg('Algunos productos no tienen precio registrado para hoy. Registra los precios del día primero.');
      return;
    }

    const total = Number(detalle.reduce((s, d) => s + d.subtotal, 0).toFixed(2));
    const margenTotal = Number(detalle.reduce((s, d) => s + d.margen, 0).toFixed(2));
    const cliente = clientes.datos?.find(c => c.id === Number(clienteId));

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
      <meta charset="UTF-8"/>
      <title>Cotización</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 28px 32px; }
        .header { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 2px solid #2D5016; margin-bottom: 14px; }
        .logo { width: 52px; height: 52px; object-fit: contain; }
        .marca h1 { font-size: 18px; font-weight: bold; color: #2D5016; line-height: 1.1; }
        .marca p { font-size: 10px; color: #888; }
        .tipo-nota { margin-left: auto; text-align: right; }
        .tipo-nota .etiqueta { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .5px; }
        .tipo-nota .aviso { font-size: 11px; color: #aaa; font-style: italic; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 16px; font-size: 11.5px; }
        .info-grid .label { color: #888; }
        .info-grid .valor { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        thead tr { background: #f0f7ee; }
        th { padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; color: #2D5016; border-bottom: 1px solid #c8e6c9; }
        td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
        .right { text-align: right; }
        tfoot tr td { padding-top: 10px; border-top: 2px solid #2D5016; font-weight: bold; font-size: 13px; }
        .footer { margin-top: 22px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
        @media print { body { padding: 12px 16px; } @page { margin: 0.5cm; } }
      </style>
    </head><body>
      <div class="header">
        <img class="logo" src="/logo.png" alt="Logo" />
        <div class="marca">
          <h1>Frutería Kiosko's</h1>
          <p>Distribuidora de Fruta y Verdura</p>
        </div>
        <div class="tipo-nota">
          <div class="etiqueta">Cotización</div>
          <div class="aviso">No es nota de venta</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="label">Fecha</div>
        <div class="valor">${new Date().toLocaleDateString('es-MX')}</div>
        ${cliente ? `<div class="label">Cliente</div><div class="valor">${cliente.nombre}</div>` : ''}
      </div>
      <table>
        <thead><tr>
          <th>Producto</th>
          <th class="right">Cantidad</th>
          <th class="right">Precio unit.</th>
          <th class="right">Subtotal</th>
        </tr></thead>
        <tbody>${filas}</tbody>
        <tfoot><tr>
          <td colspan="3" class="right" style="color:#2D5016">TOTAL</td>
          <td class="right" style="color:#2D5016;font-size:15px">$${total.toFixed(2)}</td>
        </tr></tfoot>
      </table>
      <div class="footer">Frutería Kiosko's — Esta es una cotización, no una nota de venta</div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const limpiar = () => {
    setClienteId(''); setReng([{ productoId: '', cantidad: '' }]); setResultado(null); setMsg('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-600 text-campo-dark">Cotizaciones</h1>
        <p className="text-sm text-carbon/55">
          Calcula cuánto saldría un pedido sin registrarlo. Usa los precios del día de hoy.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario */}
        <Tarjeta className="p-5 h-fit">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-600 text-campo-dark">
            <Calculator className="h-5 w-5" /> Nueva cotización
          </h2>
          <form onSubmit={calcular} className="space-y-3">
            <Campo etiqueta="Cliente (opcional)">
              <Select value={clienteId} onChange={e => setClienteId(e.target.value)}>
                <option value="">Sin cliente específico</option>
                {(clientes.datos || []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Campo>

            <div className="space-y-2">
              {reng.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={r.productoId} onChange={e => setRenglon(i, 'productoId', e.target.value)}>
                    <option value="">Producto...</option>
                    {(productos.datos || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}{precioMap[p.id] ? ` — $${precioMap[p.id].precio.toFixed(2)}/kg` : ''}
                      </option>
                    ))}
                  </Select>
                  <input
                    type="number" step="0.01" placeholder="kg"
                    value={r.cantidad}
                    onChange={e => setRenglon(i, 'cantidad', e.target.value)}
                    className="w-24 rounded-lg border border-campo/15 px-3 py-2.5 text-sm outline-none focus:border-campo"
                  />
                  {reng.length > 1 && (
                    <button type="button" onClick={() => quitarReng(i)} className="text-carbon/40 hover:text-tierra">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={addReng} className="text-sm font-medium text-campo hover:underline">
              <Plus className="inline h-3.5 w-3.5 mr-1" />Agregar producto
            </button>

            {msg && <p className="text-sm text-tierra">{msg}</p>}

            <div className="flex gap-2">
              <Boton tipo="submit"><Calculator className="h-4 w-4" />Calcular</Boton>
              {resultado && <Boton variante="fantasma" tipo="button" onClick={limpiar}>Limpiar</Boton>}
            </div>
          </form>
        </Tarjeta>

        {/* Resultado */}
        <div>
          {!resultado ? (
            <Tarjeta className="p-5">
              <Vacio mensaje="Llena el formulario y haz clic en Calcular para ver el desglose." />
            </Tarjeta>
          ) : (
            <Tarjeta className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-600 text-campo-dark">
                  {resultado.cliente ? `Cotización para ${resultado.cliente.nombre}` : 'Resultado de cotización'}
                </h2>
                <button
                  onClick={imprimir}
                  className="flex items-center gap-1.5 rounded-lg border border-campo/20 px-3 py-1.5 text-sm font-medium text-campo hover:bg-campo/10 transition"
                >
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
                    <td colSpan={esAdmin ? 3 : 3} className="pt-2 text-right font-600 text-campo-dark">Total</td>
                    <td className="pt-2 text-right font-700 text-campo">{pesos(resultado.total)}</td>
                    {esAdmin && <td className="pt-2 text-right font-700 text-campo">{pesos(resultado.margenTotal)}</td>}
                  </tr>
                </tfoot>
              </table>

              {esAdmin && (
                <p className="mt-3 text-xs text-carbon/50">
                  El margen solo es visible para el administrador y no aparece en la impresión.
                </p>
              )}

              <div className="mt-4">
                <Boton onClick={() => {
                  // Convertir cotización en pedido real
                  document.querySelector('[data-crear-pedido]')?.click();
                }} variante="secundario">
                  Convertir en pedido real
                </Boton>
              </div>
            </Tarjeta>
          )}
        </div>
      </div>
    </div>
  );
}
