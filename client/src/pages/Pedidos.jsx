import { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Check, Clock, ChevronDown, ChevronRight, Printer, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import { Tarjeta, Cargando, ErrorEstado, Vacio, Boton, Campo, Select, Badge } from '../components/ui';
import { pesos, fechaCorta, hoyISO } from '../utils/format';

/**
 * Abre una ventana de impresion con la nota del pedido.
 * NO incluye margenes ni costos — solo lo que el cliente ve.
 */
function buildNotaHTML({ titulo, numero, cliente, fecha, estado, detalle, total }) {
  const filas = detalle.map(d => `
    <tr>
      <td>${d.producto_nombre || d.nombre}</td>
      <td class="right">${Number(d.cantidad)} kg</td>
      <td class="right">$${Number(d.precio_unit || d.precioUnit).toFixed(2)}</td>
      <td class="right">$${Number(d.subtotal).toFixed(2)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>${titulo} #${numero || ''}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; padding: 28px 32px; }
      .header { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 2px solid #2D5016; margin-bottom: 14px; }
      .logo { width: 52px; height: 52px; object-fit: contain; }
      .marca h1 { font-size: 18px; font-weight: bold; color: #2D5016; line-height: 1.1; }
      .marca p { font-size: 10px; color: #888; }
      .tipo-nota { margin-left: auto; text-align: right; }
      .tipo-nota .etiqueta { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .5px; }
      .tipo-nota .numero { font-size: 20px; font-weight: bold; color: #2D5016; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 16px; font-size: 11.5px; }
      .info-grid .label { color: #888; }
      .info-grid .valor { font-weight: 600; }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      thead tr { background: #f0f7ee; }
      th { padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; color: #2D5016; border-bottom: 1px solid #c8e6c9; }
      td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
      .right { text-align: right; }
      tfoot tr td { padding-top: 10px; border-top: 2px solid #2D5016; font-weight: bold; font-size: 13px; }
      tfoot .label { color: #2D5016; }
      tfoot .valor { color: #2D5016; font-size: 15px; }
      .footer { margin-top: 22px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
      @media print {
        body { padding: 12px 16px; }
        @page { margin: 0.5cm; }
      }
    </style>
  </head><body>
    <div class="header">
      <img class="logo" src="/logo.png" alt="Logo" />
      <div class="marca">
        <h1>Frutería Kiosko's</h1>
        <p>Distribuidora de Fruta y Verdura</p>
      </div>
      <div class="tipo-nota">
        <div class="etiqueta">${titulo}</div>
        ${numero ? `<div class="numero">#${numero}</div>` : ''}
      </div>
    </div>

    <div class="info-grid">
      ${cliente ? `<div class="label">Cliente</div><div class="valor">${cliente}</div>` : ''}
      ${fecha ? `<div class="label">Fecha</div><div class="valor">${fecha}</div>` : ''}
      ${estado ? `<div class="label">Estado</div><div class="valor" style="text-transform:capitalize">${estado}</div>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th class="right">Cantidad</th>
          <th class="right">Precio unit.</th>
          <th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="right label">TOTAL</td>
          <td class="right valor">$${Number(total).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="footer">Gracias por su preferencia — Frutería Kiosko's</div>
  </body></html>`;
}

function imprimirNota(pedido, detalle) {
  const win = window.open('', '_blank');
  win.document.write(buildNotaHTML({
    titulo: 'Nota',
    numero: pedido.id,
    cliente: pedido.cliente_nombre,
    fecha: pedido.fecha ? String(pedido.fecha).slice(0,10) : '',
    estado: pedido.estado,
    detalle,
    total: pedido.total,
  }));
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

export default function Pedidos() {
  const { usuario } = useAuth();
  const puedeCrear = ['admin', 'tomador'].includes(usuario?.rol);
  const puedeEntregar = ['admin', 'repartidor'].includes(usuario?.rol);
  const esAdmin = usuario?.rol === 'admin';

  const { datos: pedidos, cargando, error, recargar } = useFetch('/pedidos');
  const clientes = useFetch(puedeCrear ? '/clientes' : null);
  // Solo cargamos productos que tienen precio registrado hoy.
  // Si un producto no tiene precio del día, no aparece en el select.
  const preciosHoy = useFetch(puedeCrear ? `/productos/precios?fecha=${hoyISO()}` : null);
  const productosConPrecio = (preciosHoy.datos?.items || []);

  const [clienteId, setClienteId] = useState('');
  const [reng, setReng] = useState([{ productoId: '', cantidad: '' }]);
  const [msg, setMsg] = useState('');

  const addReng = () => setReng([...reng, { productoId: '', cantidad: '' }]);
  const setRenglon = (i, campo, val) => {
    const c = [...reng]; c[i] = { ...c[i], [campo]: val }; setReng(c);
  };

  const crear = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/pedidos', {
        clienteId: Number(clienteId),
        items: reng.filter(r => r.productoId && r.cantidad)
          .map(r => ({ productoId: Number(r.productoId), cantidad: Number(r.cantidad) })),
      });
      setClienteId(''); setReng([{ productoId: '', cantidad: '' }]);
      recargar();
    } catch (err) { setMsg(err.response?.data?.error || 'No se pudo crear el pedido'); }
  };

  const eliminarPedido = async (id) => {
    if (!window.confirm('¿Eliminar este pedido? Se revertirá la deuda del cliente.')) return;
    try { await api.delete(`/pedidos/${id}`); recargar(); }
    catch (err) { setMsg(err.response?.data?.error || 'No se pudo eliminar'); }
  };

  const entregar = async (id) => {
    try { await api.patch(`/pedidos/${id}/estado`, { estado: 'entregado' }); recargar(); }
    catch (err) { setMsg(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-600 text-campo-dark">Pedidos</h1>

      {puedeCrear && (
        <Tarjeta className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-600 text-campo-dark">
            <Plus className="h-5 w-5" /> Nuevo pedido
          </h2>
          <form onSubmit={crear} className="space-y-3">
            <Campo etiqueta="Cliente">
              <Select value={clienteId} onChange={e => setClienteId(e.target.value)} required>
                <option value="">Selecciona...</option>
                {(clientes.datos || []).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Campo>
            {reng.map((r, i) => (
              <div key={i} className="flex gap-2">
                <Select value={r.productoId} onChange={e => setRenglon(i, 'productoId', e.target.value)}>
                  <option value="">Producto...</option>
                  {productosConPrecio.map(p => (
                    <option key={p.productoId} value={p.productoId}>
                      {p.nombre} — {pesos(p.precioVenta)}/kg
                    </option>
                  ))}
                </Select>
                <input type="number" step="0.01" placeholder="Cantidad" value={r.cantidad}
                  onChange={e => setRenglon(i, 'cantidad', e.target.value)}
                  className="w-32 rounded-lg border border-campo/15 px-3 py-2.5 text-sm outline-none focus:border-campo" />
              </div>
            ))}
            <button type="button" onClick={addReng} className="text-sm font-medium text-campo hover:underline">
              + Agregar producto
            </button>
            {productosConPrecio.length === 0 && (
              <p className="text-sm text-tierra">
                No hay productos con precio registrado para hoy. Ve a <strong>Precios del día</strong> primero.
              </p>
            )}
            {msg && <p className="text-sm text-tierra">{msg}</p>}
            <Boton tipo="submit">Registrar pedido</Boton>
          </form>
        </Tarjeta>
      )}

      <Tarjeta className="p-5">
        <h2 className="mb-3 font-display text-lg font-600 text-campo-dark">Pedidos recientes</h2>
        {cargando ? <Cargando /> : error ? <ErrorEstado mensaje={error} onReintentar={recargar} />
          : !pedidos || pedidos.length === 0 ? <Vacio mensaje="Aún no hay pedidos." />
          : (
            <ul className="divide-y divide-campo/8">
              {pedidos.map(p => (
                <FilaPedido
                  key={p.id}
                  pedido={p}
                  puedeEntregar={puedeEntregar}
                  onEntregar={entregar}
                  esAdmin={esAdmin}
                  onEliminar={eliminarPedido}
                />
              ))}
            </ul>
          )}
      </Tarjeta>
    </div>
  );
}

function FilaPedido({ pedido, puedeEntregar, onEntregar, esAdmin, onEliminar }) {
  const [abierto, setAbierto] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDet, setCargandoDet] = useState(false);

  const alternar = async () => {
    const nuevoEstado = !abierto;
    setAbierto(nuevoEstado);
    if (nuevoEstado && !detalle) {
      setCargandoDet(true);
      try {
        const { data } = await api.get(`/pedidos/${pedido.id}`);
        setDetalle(data.detalle || []);
      } catch { setDetalle([]); }
      finally { setCargandoDet(false); }
    }
  };

  const margenTotal = detalle
    ? detalle.reduce((s, d) => s + Number(d.margen_renglon || 0), 0)
    : 0;

  return (
    <li className="py-3">
      <div className="flex items-center justify-between">
        <button onClick={alternar} className="flex items-center gap-2 text-left">
          {abierto
            ? <ChevronDown className="h-4 w-4 text-campo" />
            : <ChevronRight className="h-4 w-4 text-campo/60" />}
          <div>
            <p className="font-medium text-carbon">{pedido.cliente_nombre}</p>
            <p className="text-xs text-carbon/55">
              {fechaCorta(pedido.fecha)} · {pesos(pedido.total)}
              {esAdmin && detalle && (
                <span className="ml-2 text-campo font-medium">· margen {pesos(margenTotal)}</span>
              )}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          {pedido.estado === 'entregado'
            ? <Badge color="campo"><Check className="mr-1 h-3 w-3" />Entregado</Badge>
            : <Badge color="tierra"><Clock className="mr-1 h-3 w-3" />Pendiente</Badge>}
          {puedeEntregar && pedido.estado === 'pendiente' &&
            <Boton variante="secundario" onClick={() => onEntregar(pedido.id)}>Marcar entregado</Boton>}
          {esAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onEliminar(pedido.id); }}
              className="text-carbon/30 hover:text-tierra transition" title="Eliminar pedido"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {abierto && (
        <div className="mt-3 ml-6 rounded-lg bg-campo/5 p-3">
          {cargandoDet ? (
            <p className="text-sm text-carbon/50">Cargando desglose...</p>
          ) : !detalle || detalle.length === 0 ? (
            <p className="text-sm text-carbon/50">Sin desglose disponible.</p>
          ) : (
            <>
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
                  {detalle.map(d => (
                    <tr key={d.id}>
                      <td className="py-1.5 text-carbon">{d.producto_nombre}</td>
                      <td className="py-1.5 text-right text-carbon/70">{Number(d.cantidad)} kg</td>
                      <td className="py-1.5 text-right text-carbon/70">{pesos(d.precio_unit)}</td>
                      <td className="py-1.5 text-right font-medium text-carbon">{pesos(d.subtotal)}</td>
                      {esAdmin && (
                        <td className="py-1.5 text-right font-600 text-campo">
                          {pesos(Number(d.margen_renglon || 0))}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-campo/15">
                    <td colSpan={esAdmin ? 3 : 3} className="pt-2 text-right font-600 text-campo-dark">Total</td>
                    <td className="pt-2 text-right font-700 text-campo">{pesos(pedido.total)}</td>
                    {esAdmin && (
                      <td className="pt-2 text-right font-700 text-campo">{pesos(margenTotal)}</td>
                    )}
                  </tr>
                </tfoot>
              </table>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => imprimirNota(pedido, detalle)}
                  className="flex items-center gap-1.5 rounded-lg border border-campo/20 px-3 py-1.5 text-sm font-medium text-campo hover:bg-campo/10 transition"
                >
                  <Printer className="h-4 w-4" /> Imprimir nota
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
}

FilaPedido.propTypes = {
  pedido: PropTypes.object.isRequired,
  puedeEntregar: PropTypes.bool,
  onEntregar: PropTypes.func,
  esAdmin: PropTypes.bool,
  onEliminar: PropTypes.func,
};
