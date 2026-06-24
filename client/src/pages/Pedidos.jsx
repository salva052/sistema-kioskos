import { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Check, Clock, ChevronDown, ChevronRight, Printer } from 'lucide-react';
import api from '../api/axios';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import { Tarjeta, Cargando, ErrorEstado, Vacio, Boton, Campo, Select, Badge } from '../components/ui';
import { pesos, fechaCorta } from '../utils/format';

/**
 * Abre una ventana de impresion con la nota del pedido.
 * NO incluye margenes ni costos — solo lo que el cliente ve.
 */
function imprimirNota(pedido, detalle) {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>Nota #${pedido.id}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 13px; margin: 24px; color: #222; }
      h2 { color: #2D5016; margin: 0 0 2px; font-size: 18px; }
      .sub { color: #888; font-size: 11px; margin: 0 0 14px; }
      .info { margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #f0f7ee; text-align: left; padding: 6px 8px; font-size: 11px; text-transform: uppercase; }
      td { padding: 5px 8px; border-bottom: 1px solid #eee; }
      .right { text-align: right; }
      .total td { font-weight: bold; border-top: 2px solid #2D5016; padding-top: 8px; }
      .footer { margin-top: 24px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
      @media print { body { margin: 10px; } }
    </style>
  </head><body>
    <h2>Sistema Kiosko's</h2>
    <p class="sub">Distribuidora de Fruta y Verdura</p>
    <p class="info"><strong>Nota #${pedido.id}</strong></p>
    <p class="info">Cliente: <strong>${pedido.cliente_nombre}</strong></p>
    <p class="info">Fecha: ${pedido.fecha ? String(pedido.fecha).slice(0,10) : ''}</p>
    <p class="info">Estado: ${pedido.estado}</p>
    <table>
      <thead><tr>
        <th>Producto</th>
        <th class="right">Cantidad</th>
        <th class="right">Precio unit.</th>
        <th class="right">Subtotal</th>
      </tr></thead>
      <tbody>
        ${detalle.map(d => `<tr>
          <td>${d.producto_nombre}</td>
          <td class="right">${Number(d.cantidad)} kg</td>
          <td class="right">$${Number(d.precio_unit).toFixed(2)}</td>
          <td class="right">$${Number(d.subtotal).toFixed(2)}</td>
        </tr>`).join('')}
      </tbody>
      <tfoot><tr class="total">
        <td colspan="3" class="right">TOTAL</td>
        <td class="right">$${Number(pedido.total).toFixed(2)}</td>
      </tr></tfoot>
    </table>
    <p class="footer">Gracias por su preferencia</p>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

export default function Pedidos() {
  const { usuario } = useAuth();
  const puedeCrear = ['admin', 'tomador'].includes(usuario?.rol);
  const puedeEntregar = ['admin', 'repartidor'].includes(usuario?.rol);
  const esAdmin = usuario?.rol === 'admin';

  const { datos: pedidos, cargando, error, recargar } = useFetch('/pedidos');
  const clientes = useFetch(puedeCrear ? '/clientes' : null);
  const productos = useFetch('/productos');

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
                  {(productos.datos || []).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </Select>
                <input type="number" step="0.01" placeholder="Cantidad" value={r.cantidad}
                  onChange={e => setRenglon(i, 'cantidad', e.target.value)}
                  className="w-32 rounded-lg border border-campo/15 px-3 py-2.5 text-sm outline-none focus:border-campo" />
              </div>
            ))}
            <button type="button" onClick={addReng} className="text-sm font-medium text-campo hover:underline">
              + Agregar producto
            </button>
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
                />
              ))}
            </ul>
          )}
      </Tarjeta>
    </div>
  );
}

function FilaPedido({ pedido, puedeEntregar, onEntregar, esAdmin }) {
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
};
