import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Sparkles, Printer, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { Tarjeta, Cargando, ErrorEstado, Boton, Badge, Campo, Input } from '../components/ui';
import { pesos, hoyISO } from '../utils/format';

function sugeridoDesde(costo) {
  const c = Number(costo);
  if (!c || c <= 0) return 0;
  return Number((c / 0.7).toFixed(2));
}

// Margen sobre venta (igual que el backend)
function calcMargen(costo, venta) {
  const c = Number(costo); const v = Number(venta);
  if (!v || v <= 0) return 0;
  return Number((((v - c) / v) * 100).toFixed(2));
}

function imprimirPrecios(items, fecha) {
  if (!items || items.length === 0) return;
  const filas = items.map(it => `
    <tr>
      <td>${it.nombre}</td>
      <td class="right"><strong>$${Number(it.precioVenta).toFixed(2)}</strong></td>
    </tr>`).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/><title>Precios del día</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1a1a1a; padding: 24px 28px; }
      .header { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: 2px solid #2D5016; margin-bottom: 16px; }
      .logo { width: 52px; height: 52px; object-fit: contain; }
      .marca h1 { font-size: 18px; font-weight: bold; color: #2D5016; }
      .marca p { font-size: 11px; color: #888; margin-top: 2px; }
      .titulo { margin-left: auto; text-align: right; }
      .titulo .etq { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: .5px; }
      .titulo .fch { font-size: 14px; font-weight: bold; color: #2D5016; text-transform: capitalize; }
      .sub { font-size: 11px; color: #888; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      thead tr { background: #f0f7ee; }
      th { padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #2D5016; border-bottom: 1px solid #c8e6c9; }
      td { padding: 7px 12px; border-bottom: 1px solid #f0f0f0; }
      .right { text-align: right; }
      tr:nth-child(even) { background: #fafff8; }
      .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; }
      @media print { body { padding: 10px 14px; } @page { margin: 0.5cm; } }
    </style>
  </head><body>
    <div class="header">
      <img class="logo" src="/logo.png" alt="Logo" />
      <div class="marca"><h1>Frutería Kiosko's</h1><p>Distribuidora de Fruta y Verdura</p></div>
      <div class="titulo">
        <div class="etq">Lista de precios</div>
        <div class="fch">${new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
    </div>
    <p class="sub">Precios por kilogramo</p>
    <table>
      <thead><tr><th>Producto</th><th class="right">Precio por kg</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <div class="footer">Frutería Kiosko's — Precios sujetos a cambio sin previo aviso</div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
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
  const [msg, setMsg] = useState({ texto: '', tipo: 'ok' }); // tipo: 'ok' | 'error' | 'warn'
  const [agregando, setAgregando] = useState(false);

  const setMensaje = (texto, tipo = 'ok') => setMsg({ texto, tipo });

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

  // ── Validaciones al editar ──────────────────────────────────────────────────
  const editarCosto = (i, valor) => {
    const copia = [...items];
    const costo = Number(valor);
    if (costo < 0) return; // no permitir negativos
    const precioVenta = copia[i].precioVenta || sugeridoDesde(costo);
    copia[i] = { ...copia[i], costo, sugerido: sugeridoDesde(costo), precioVenta, margen: calcMargen(costo, precioVenta) };
    setItems(copia);
  };

  const editarVenta = (i, valor) => {
    const copia = [...items];
    const v = Number(valor);
    if (v < 0) return; // no permitir negativos
    copia[i] = { ...copia[i], precioVenta: v, margen: calcMargen(copia[i].costo, v) };
    setItems(copia);
  };

  const usarSugerido = (i) => {
    const copia = [...items];
    const s = copia[i].sugerido || sugeridoDesde(copia[i].costo);
    copia[i] = { ...copia[i], precioVenta: s, margen: calcMargen(copia[i].costo, s) };
    setItems(copia);
  };

  // ── Validar antes de guardar ────────────────────────────────────────────────
  const validarItems = () => {
    const sinPrecio  = items.filter(i => !i.precioVenta || Number(i.precioVenta) <= 0);
    const sinCosto   = items.filter(i => !i.costo || Number(i.costo) <= 0);
    const enPerdida  = items.filter(i => Number(i.precioVenta) > 0 && Number(i.precioVenta) < Number(i.costo));
    const margenBajo = items.filter(i => i.margen > 0 && i.margen < 5);

    if (sinPrecio.length) {
      return { ok: false, msg: `${sinPrecio.map(i => i.nombre).join(', ')} no tienen precio de venta.` };
    }
    if (sinCosto.length) {
      return { ok: false, msg: `${sinCosto.map(i => i.nombre).join(', ')} no tienen costo.` };
    }
    if (enPerdida.length) {
      return { ok: false, msg: `⚠️ ${enPerdida.map(i => i.nombre).join(', ')}: el precio de venta es menor al costo. Revisa los valores.` };
    }
    if (margenBajo.length) {
      // Solo advertir, no bloquear
      return { ok: true, advertencia: `Margen muy bajo en: ${margenBajo.map(i => `${i.nombre} (${i.margen}%)`).join(', ')}.` };
    }
    return { ok: true };
  };

  const guardar = async () => {
    setMensaje('');
    const val = validarItems();
    if (!val.ok) { setMensaje(val.msg, 'error'); return; }
    if (val.advertencia) {
      const continuar = window.confirm(`${val.advertencia}\n\n¿Guardar de todas formas?`);
      if (!continuar) return;
    }
    setGuardando(true);
    try {
      const { data } = await api.post('/productos/precios', {
        fecha,
        items: items.map((i) => ({ productoId: i.productoId, costo: i.costo, precioVenta: i.precioVenta })),
      });
      setItems(data.items || []); setMargenGeneral(data.margenGeneral || 0);
      setMensaje('Precios guardados correctamente.', 'ok');
    } catch (e) {
      setMensaje(e.response?.data?.error || 'No se pudo guardar.', 'error');
    } finally { setGuardando(false); }
  };

  // ── Validar antes de agregar fruta ─────────────────────────────────────────
  const agregarFruta = async (e) => {
    e.preventDefault(); setMensaje('');
    const nombre = nuevaFruta.trim();

    // Validaciones locales antes de llamar al backend
    if (!nombre) { setMensaje('Escribe el nombre de la fruta.', 'error'); return; }
    if (nombre.length < 2) { setMensaje('El nombre debe tener al menos 2 caracteres.', 'error'); return; }
    if (nombre.length > 100) { setMensaje('El nombre es demasiado largo (máx. 100 caracteres).', 'error'); return; }
    if (nuevoCosto !== '' && Number(nuevoCosto) < 0) { setMensaje('El costo no puede ser negativo.', 'error'); return; }

    if (agregando) return;
    setAgregando(true);
    try {
      const { data: creada } = await api.post('/productos', { nombre });
      if (Number(nuevoCosto) > 0 && creada?.id) {
        await api.post('/productos/precios', {
          fecha,
          items: [{ productoId: creada.id, costo: Number(nuevoCosto), precioVenta: sugeridoDesde(nuevoCosto) }],
        });
      }
      setNuevaFruta(''); setNuevoCosto('');
      setMensaje(`"${nombre}" agregada correctamente.`, 'ok');
      cargar();
    } catch (err) {
      const status = err.response?.status;
      const body   = err.response?.data;

      if (status === 409 && body?.productoExistente?.id) {
        // Producto ya existe — guardar precio si se proporcionó costo
        if (Number(nuevoCosto) > 0) {
          try {
            await api.post('/productos/precios', {
              fecha,
              items: [{ productoId: body.productoExistente.id, costo: Number(nuevoCosto), precioVenta: sugeridoDesde(nuevoCosto) }],
            });
            setNuevaFruta(''); setNuevoCosto('');
            setMensaje(`Precio actualizado para "${body.productoExistente.nombre}".`, 'ok');
            cargar();
          } catch {
            setMensaje(`"${nombre}" ya existe. No se pudo actualizar el precio.`, 'error');
          }
        } else {
          setMensaje(`"${nombre}" ya está en el catálogo. Si quieres actualizar su precio, escribe el costo.`, 'warn');
        }
        return;
      }
      setMensaje(body?.error || 'No se pudo agregar la fruta.', 'error');
    } finally { setAgregando(false); }
  };

  const quitarFruta = async (productoId, nombre) => {
    if (!window.confirm(`¿Quitar "${nombre}" del catálogo?\n\nEsto la elimina de todos los precios registrados. Los pedidos existentes no se afectan.`)) return;
    try { await api.delete(`/productos/${productoId}`); cargar(); }
    catch (err) { setMensaje(err.response?.data?.error || 'No se pudo quitar.', 'error'); }
  };

  const quitarPrecioHoy = async (productoId, nombre) => {
    if (!window.confirm(`¿Quitar el precio de "${nombre}" para hoy?\n\nLa fruta seguirá en el catálogo pero no aparecerá en pedidos del día.`)) return;
    try { await api.delete(`/productos/precios/${productoId}?fecha=${fecha}`); cargar(); }
    catch (err) { setMensaje(err.response?.data?.error || 'No se pudo quitar el precio.', 'error'); }
  };

  if (cargando) return <Cargando texto="Cargando precios del día..." />;
  if (error) return <ErrorEstado mensaje={error} onReintentar={cargar} />;

  const colorMsg = msg.tipo === 'error' ? 'text-tierra' : msg.tipo === 'warn' ? 'text-amber-600' : 'text-campo';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-600 text-campo-dark">Precios del día</h1>
          <p className="text-sm text-carbon/55">
            Margen general: <span className={`font-semibold ${margenGeneral < 10 ? 'text-tierra' : 'text-campo'}`}>{margenGeneral}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => imprimirPrecios(items, fecha)}
            disabled={!items || items.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-campo/20 px-3 py-2 text-sm font-medium text-campo hover:bg-campo/10 transition disabled:opacity-40"
          >
            <Printer className="h-4 w-4" /> Imprimir lista
          </button>
          {esAdmin && (
            <Boton onClick={guardar} disabled={guardando || items.length === 0}>
              <Save className="h-4 w-4" />{guardando ? 'Guardando...' : 'Guardar precios'}
            </Boton>
          )}
        </div>
      </div>

      {esAdmin && (
        <Tarjeta className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-600 text-campo-dark">
            <Plus className="h-5 w-5" /> Agregar fruta
          </h2>
          <form onSubmit={agregarFruta} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <Campo etiqueta="Nombre de la fruta">
                <Input
                  value={nuevaFruta}
                  onChange={(e) => setNuevaFruta(e.target.value)}
                  placeholder="Ej. Sandía"
                  maxLength={100}
                  required
                />
              </Campo>
            </div>
            <div className="w-40">
              <Campo etiqueta="Costo por kilo">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="99999"
                  value={nuevoCosto}
                  onChange={(e) => setNuevoCosto(e.target.value)}
                  placeholder="0.00"
                />
              </Campo>
            </div>
            {Number(nuevoCosto) > 0 && (
              <div className="pb-2.5 text-sm text-carbon/70">
                Sugerido: <span className="font-semibold text-campo">{pesos(sugeridoDesde(nuevoCosto))}</span>
              </div>
            )}
            <div className="pb-0.5">
              <Boton tipo="submit" variante="secundario" disabled={agregando || !nuevaFruta.trim()}>
                {agregando ? 'Agregando...' : 'Agregar'}
              </Boton>
            </div>
          </form>
          {msg.texto && (
            <p className={`mt-3 flex items-center gap-1.5 text-sm ${colorMsg}`}>
              {msg.tipo !== 'ok' && <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
              {msg.texto}
            </p>
          )}
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
                Aún no hay frutas con precio para hoy. Agrega la primera arriba.
              </td></tr>
            ) : items.map((it, i) => {
              const enPerdida = Number(it.precioVenta) > 0 && Number(it.precioVenta) < Number(it.costo);
              const sinPrecio = !it.precioVenta || Number(it.precioVenta) <= 0;
              return (
                <tr key={it.productoId} className={enPerdida ? 'bg-tierra/5' : ''}>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-carbon">{it.nombre}</span>
                    {it.precioFijo && <span className="ml-2"><Badge color="gris">fijo</Badge></span>}
                    {it.heredado && <span className="ml-2"><Badge color="campo">de ayer</Badge></span>}
                    {enPerdida && <span className="ml-2"><Badge color="tierra">precio bajo costo</Badge></span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {esAdmin ? (
                      <input
                        type="number" step="0.01" min="0" max="99999"
                        value={it.costo}
                        onChange={(e) => editarCosto(i, e.target.value)}
                        className="w-24 rounded-lg border border-campo/15 px-2 py-1.5 outline-none focus:border-campo"
                      />
                    ) : pesos(it.costo)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-campo font-medium">{pesos(it.sugerido || sugeridoDesde(it.costo))}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {esAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number" step="0.01" min="0" max="99999"
                          value={it.precioVenta}
                          onChange={(e) => editarVenta(i, e.target.value)}
                          className={`w-24 rounded-lg border px-2 py-1.5 outline-none focus:border-campo ${sinPrecio || enPerdida ? 'border-tierra/50 bg-tierra/5' : 'border-campo/15'}`}
                        />
                        <button onClick={() => usarSugerido(i)} title="Usar precio sugerido" className="text-campo/60 hover:text-campo">
                          <Sparkles className="h-4 w-4" />
                        </button>
                      </div>
                    ) : pesos(it.precioVenta)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`font-600 ${it.margen < 0 ? 'text-tierra font-700' : it.margen < 10 ? 'text-tierra' : 'text-campo'}`}>
                      {it.margen}%
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => quitarPrecioHoy(it.productoId, it.nombre)}
                          className="text-xs text-carbon/40 hover:text-tierra transition"
                          title="Quitar precio de hoy (la fruta sigue en catálogo)">
                          quitar precio
                        </button>
                        <button onClick={() => quitarFruta(it.productoId, it.nombre)}
                          className="text-carbon/40 hover:text-tierra" title="Quitar fruta del catálogo">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Tarjeta>

      <p className="text-xs text-carbon/50">
        El precio sugerido se calcula dividiendo el costo entre 0.7, para dejar un 30% de ganancia sobre la venta.
        Las filas en rojo tienen precio de venta menor al costo.
      </p>
    </div>
  );
}
