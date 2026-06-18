import { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Check, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import { Tarjeta, Cargando, ErrorEstado, Vacio, Boton, Campo, Select, Badge } from '../components/ui';
import { pesos, fechaCorta } from '../utils/format';

export default function Pedidos() {
  const { usuario } = useAuth();
  const puedeCrear = ['admin', 'tomador'].includes(usuario?.rol);
  const puedeEntregar = ['admin', 'repartidor'].includes(usuario?.rol);

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
        items: reng.filter((r) => r.productoId && r.cantidad)
          .map((r) => ({ productoId: Number(r.productoId), cantidad: Number(r.cantidad) })),
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
              <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
                <option value="">Selecciona...</option>
                {(clientes.datos || []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Campo>
            {reng.map((r, i) => (
              <div key={i} className="flex gap-2">
                <Select value={r.productoId} onChange={(e) => setRenglon(i, 'productoId', e.target.value)}>
                  <option value="">Producto...</option>
                  {(productos.datos || []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </Select>
                <input type="number" step="0.01" placeholder="Cantidad" value={r.cantidad}
                  onChange={(e) => setRenglon(i, 'cantidad', e.target.value)}
                  className="w-32 rounded-lg border border-campo/15 px-3 py-2.5 text-sm outline-none focus:border-campo" />
              </div>
            ))}
            <button type="button" onClick={addReng} className="text-sm font-medium text-campo hover:underline">+ Agregar producto</button>
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
              {pedidos.map((p) => (
                <FilaPedido
                  key={p.id}
                  pedido={p}
                  puedeEntregar={puedeEntregar}
                  onEntregar={entregar}
                />
              ))}
            </ul>
          )}
      </Tarjeta>
    </div>
  );
}

// Fila de pedido expandible: al hacer clic muestra el desglose
// (que producto, cuanta cantidad y a que precio se le cobro al cliente).
function FilaPedido({ pedido, puedeEntregar, onEntregar }) {
  const [abierto, setAbierto] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDet, setCargandoDet] = useState(false);

  const alternar = async () => {
    const nuevoEstado = !abierto;
    setAbierto(nuevoEstado);
    // Carga el detalle solo la primera vez que se abre
    if (nuevoEstado && !detalle) {
      setCargandoDet(true);
      try {
        const { data } = await api.get(`/pedidos/${pedido.id}`);
        setDetalle(data.detalle || []);
      } catch {
        setDetalle([]);
      } finally {
        setCargandoDet(false);
      }
    }
  };

  return (
    <li className="py-3">
      <div className="flex items-center justify-between">
        <button onClick={alternar} className="flex items-center gap-2 text-left">
          {abierto ? <ChevronDown className="h-4 w-4 text-campo" /> : <ChevronRight className="h-4 w-4 text-campo/60" />}
          <div>
            <p className="font-medium text-carbon">{pedido.cliente_nombre}</p>
            <p className="text-xs text-carbon/55">{fechaCorta(pedido.fecha)} · {pesos(pedido.total)}</p>
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

      {/* Desglose del pedido */}
      {abierto && (
        <div className="mt-3 ml-6 rounded-lg bg-campo/5 p-3">
          {cargandoDet ? (
            <p className="text-sm text-carbon/50">Cargando desglose...</p>
          ) : !detalle || detalle.length === 0 ? (
            <p className="text-sm text-carbon/50">Sin desglose disponible.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-campo-dark/70">
                <tr>
                  <th className="pb-2 font-600">Producto</th>
                  <th className="pb-2 font-600 text-right">Cantidad</th>
                  <th className="pb-2 font-600 text-right">Precio</th>
                  <th className="pb-2 font-600 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campo/8">
                {detalle.map((d) => (
                  <tr key={d.id}>
                    <td className="py-1.5 text-carbon">{d.producto_nombre}</td>
                    <td className="py-1.5 text-right text-carbon/70">{Number(d.cantidad)} kg</td>
                    <td className="py-1.5 text-right text-carbon/70">{pesos(d.precio_unit)}</td>
                    <td className="py-1.5 text-right font-medium text-carbon">{pesos(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-campo/15">
                  <td colSpan={3} className="pt-2 text-right font-600 text-campo-dark">Total</td>
                  <td className="pt-2 text-right font-700 text-campo">{pesos(pedido.total)}</td>
                </tr>
              </tfoot>
            </table>
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
};
