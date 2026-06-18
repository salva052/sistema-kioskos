import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { Tarjeta, Cargando, ErrorEstado, Boton, Badge, Campo, Input } from '../components/ui';
import { pesos, hoyISO } from '../utils/format';

function sugeridoDesde(costo) {
  const c = Number(costo);
  if (!c || c <= 0) return 0;
  return Number((c / 0.7).toFixed(2));
}

export default function Precios() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [fecha] = useState(hoyISO());
  const [items, setItems] = useState([]);
  const [margenGeneral, setMargenGeneral] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [nuevaFruta, setNuevaFruta] = useState('');
  const [nuevoCosto, setNuevoCosto] = useState('');
  const [msg, setMsg] = useState('');

  const cargar = async () => {
    setCargando(true); setError('');
    try {
      const { data } = await api.get(`/productos/precios?fecha=${fecha}`);
      setItems(data.items || []);
      setMargenGeneral(data.margenGeneral || 0);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cargar precios');
    } finally { setCargando(false); }
  };
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [fecha]);

  const editarCosto = (i, valor) => {
    const copia = [...items];
    const costo = Number(valor);
    copia[i] = { ...copia[i], costo };
    copia[i].sugerido = sugeridoDesde(costo);
    if (!copia[i].precioVenta) copia[i].precioVenta = copia[i].sugerido;
    const v = copia[i].precioVenta;
    copia[i].margen = costo > 0 ? Number((((v - costo) / costo) * 100).toFixed(2)) : 0;
    setItems(copia);
  };

  const editarVenta = (i, valor) => {
    const copia = [...items];
    const v = Number(valor);
    copia[i] = { ...copia[i], precioVenta: v };
    const c = copia[i].costo;
    copia[i].margen = c > 0 ? Number((((v - c) / c) * 100).toFixed(2)) : 0;
    setItems(copia);
  };

  const usarSugerido = (i) => {
    const copia = [...items];
    copia[i].precioVenta = copia[i].sugerido;
    const c = copia[i].costo;
    copia[i].margen = c > 0 ? Number((((copia[i].sugerido - c) / c) * 100).toFixed(2)) : 0;
    setItems(copia);
  };

  const guardar = async () => {
    setGuardando(true); setMsg('');
    try {
      const { data } = await api.post('/productos/precios', {
        fecha,
        items: items.map((i) => ({ productoId: i.productoId, costo: i.costo, precioVenta: i.precioVenta })),
      });
      setItems(data.items); setMargenGeneral(data.margenGeneral);
      setMsg('Precios guardados');
    } catch (e) {
      setMsg(e.response?.data?.error || 'No se pudo guardar');
    } finally { setGuardando(false); }
  };

  const agregarFruta = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/productos', { nombre: nuevaFruta });
      if (Number(nuevoCosto) > 0) {
        const { data: prods } = await api.get('/productos');
        const creada = prods.find((p) => p.nombre === nuevaFruta);
        if (creada) {
          await api.post('/productos/precios', {
            fecha,
            items: [{ productoId: creada.id, costo: Number(nuevoCosto), precioVenta: sugeridoDesde(nuevoCosto) }],
          });
        }
      }
      setNuevaFruta(''); setNuevoCosto('');
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo agregar la fruta');
    }
  };

  const quitarFruta = async (productoId, nombre) => {
    if (!window.confirm(`¿Quitar "${nombre}" del catálogo?`)) return;
    try {
      await api.delete(`/productos/${productoId}`);
      cargar();
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo quitar');
    }
  };

  if (cargando) return <Cargando texto="Cargando precios del día..." />;
  if (error) return <ErrorEstado mensaje={error} onReintentar={cargar} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-600 text-campo-dark">Precios del día</h1>
          <p className="text-sm text-carbon/55">
            Margen general: <span className="font-semibold text-campo">{margenGeneral}%</span>
          </p>
        </div>
        {esAdmin && (
          <Boton onClick={guardar} disabled={guardando}>
            <Save className="h-4 w-4" />{guardando ? 'Guardando...' : 'Guardar precios'}
          </Boton>
        )}
      </div>

      {esAdmin && (
        <Tarjeta className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-600 text-campo-dark">
            <Plus className="h-5 w-5" /> Agregar fruta
          </h2>
          <form onSubmit={agregarFruta} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <Campo etiqueta="Nombre de la fruta">
                <Input value={nuevaFruta} onChange={(e) => setNuevaFruta(e.target.value)} placeholder="Ej. Sandía" required />
              </Campo>
            </div>
            <div className="w-40">
              <Campo etiqueta="Costo por kilo">
                <Input type="number" step="0.01" value={nuevoCosto} onChange={(e) => setNuevoCosto(e.target.value)} placeholder="0.00" />
              </Campo>
            </div>
            {Number(nuevoCosto) > 0 && (
              <div className="pb-2.5 text-sm text-carbon/70">
                Sugerido: <span className="font-semibold text-campo">{pesos(sugeridoDesde(nuevoCosto))}</span>
              </div>
            )}
            <div className="pb-0.5">
              <Boton tipo="submit" variante="secundario">Agregar</Boton>
            </div>
          </form>
          {msg && <p className="mt-3 text-sm text-campo">{msg}</p>}
        </Tarjeta>
      )}

      <Tarjeta className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-campo/8 text-left text-xs uppercase tracking-wide text-campo-dark">
            <tr>
              <th className="px-4 py-3 font-600">Fruta</th>
              <th className="px-4 py-3 font-600">Costo por kilo</th>
              <th className="px-4 py-3 font-600">Precio sugerido</th>
              <th className="px-4 py-3 font-600">Precio de venta</th>
              <th className="px-4 py-3 font-600">Ganancia</th>
              {esAdmin && <th className="px-4 py-3 font-600"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-campo/8">
            {items.length === 0 ? (
              <tr><td colSpan={esAdmin ? 6 : 5} className="px-4 py-10 text-center text-campo/50">
                Aún no hay frutas. Agrega la primera arriba.
              </td></tr>
            ) : items.map((it, i) => (
              <tr key={it.productoId}>
                <td className="px-4 py-2.5">
                  <span className="font-medium text-carbon">{it.nombre}</span>
                  {it.precioFijo && <span className="ml-2"><Badge color="gris">fijo</Badge></span>}
                  {it.heredado && <span className="ml-2"><Badge color="campo">de ayer</Badge></span>}
                </td>
                <td className="px-4 py-2.5">
                  {esAdmin ? (
                    <input type="number" step="0.01" value={it.costo}
                      onChange={(e) => editarCosto(i, e.target.value)}
                      className="w-24 rounded-lg border border-campo/15 px-2 py-1.5 outline-none focus:border-campo" />
                  ) : pesos(it.costo)}
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-campo font-medium">{pesos(it.sugerido)}</span>
                </td>
                <td className="px-4 py-2.5">
                  {esAdmin ? (
                    <div className="flex items-center gap-1.5">
                      <input type="number" step="0.01" value={it.precioVenta}
                        onChange={(e) => editarVenta(i, e.target.value)}
                        className="w-24 rounded-lg border border-campo/15 px-2 py-1.5 outline-none focus:border-campo" />
                      <button onClick={() => usarSugerido(i)} title="Usar precio sugerido"
                        className="text-campo/60 hover:text-campo">
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </div>
                  ) : pesos(it.precioVenta)}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`font-600 ${it.margen < 10 ? 'text-tierra' : 'text-campo'}`}>{it.margen}%</span>
                </td>
                {esAdmin && (
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => quitarFruta(it.productoId, it.nombre)}
                      className="text-carbon/40 hover:text-tierra" title="Quitar fruta">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Tarjeta>

      <p className="text-xs text-carbon/50">
        El precio sugerido se calcula dividiendo el costo entre 0.7, para dejar un 30% de ganancia sobre la venta.
        Puedes ajustar el precio de venta a mano si lo necesitas.
      </p>
    </div>
  );
}
