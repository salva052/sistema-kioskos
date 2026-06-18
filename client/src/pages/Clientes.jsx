import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { UserPlus, Phone, MapPin, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import { Tarjeta, Cargando, ErrorEstado, Vacio, Boton, Campo, Input, Badge } from '../components/ui';
import { pesos } from '../utils/format';

export default function Clientes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  // Query params: el termino de busqueda se guarda en la URL (?buscar=...)
  // asi la busqueda es compartible y se conserva al recargar.
  const [searchParams, setSearchParams] = useSearchParams();
  const buscar = searchParams.get('buscar') || '';

  // La lista se pide al backend incluyendo el filtro de busqueda
  const url = buscar ? `/clientes?search=${encodeURIComponent(buscar)}` : '/clientes';
  const { datos: clientes, cargando, error, recargar } = useFetch(url, [buscar]);
  const deudores = useFetch(esAdmin ? '/clientes/deudores' : null);

  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '', deuda: '' });
  const [guardando, setGuardando] = useState(false);
  const [errForm, setErrForm] = useState('');

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onBuscar = (e) => {
    const v = e.target.value;
    if (v) setSearchParams({ buscar: v });
    else setSearchParams({});
  };

  const crear = async (e) => {
    e.preventDefault();
    setErrForm('');
    setGuardando(true);
    try {
      await api.post('/clientes', {
        nombre: form.nombre,
        telefono: form.telefono,
        direccion: form.direccion,
        deuda: Number(form.deuda) || 0,
      });
      setForm({ nombre: '', telefono: '', direccion: '', deuda: '' });
      recargar();
      if (esAdmin) deudores.recargar();
    } catch (err) {
      setErrForm(err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-600 text-campo-dark">Clientes</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alta */}
        <Tarjeta className="p-5 lg:col-span-1 h-fit">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-600 text-campo-dark">
            <UserPlus className="h-5 w-5" /> Nuevo cliente
          </h2>
          <form onSubmit={crear} className="space-y-3">
            <Campo etiqueta="Nombre"><Input name="nombre" value={form.nombre} onChange={cambiar} required /></Campo>
            <Campo etiqueta="Teléfono"><Input name="telefono" value={form.telefono} onChange={cambiar} /></Campo>
            <Campo etiqueta="Dirección"><Input name="direccion" value={form.direccion} onChange={cambiar} /></Campo>
            <Campo etiqueta="Deuda inicial"><Input name="deuda" type="number" step="0.01" value={form.deuda} onChange={cambiar} placeholder="0.00" /></Campo>
            {errForm && <p className="text-sm text-tierra">{errForm}</p>}
            <Boton tipo="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Agregar cliente'}</Boton>
          </form>
        </Tarjeta>

        {/* Lista + deudores */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deudores (solo admin) */}
          {esAdmin && deudores.datos && deudores.datos.length > 0 && (
            <Tarjeta className="p-5">
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-600 text-tierra">
                <AlertTriangle className="h-5 w-5" /> Deudores
              </h2>
              <ul className="divide-y divide-campo/8">
                {deudores.datos.map((c) => {
                  const alto = Number(c.deuda) > 1000;
                  return (
                    <li key={c.id} className="flex items-center justify-between py-2.5">
                      <span className="text-sm font-medium text-carbon">{c.nombre}</span>
                      <span className={`text-sm font-700 ${alto ? 'text-tierra' : 'text-carbon/70'}`}>
                        {pesos(c.deuda)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Tarjeta>
          )}

          {/* Lista general con busqueda (query params) */}
          <Tarjeta className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-display text-lg font-600 text-campo-dark">Todos los clientes</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-carbon/40" />
                <input
                  value={buscar}
                  onChange={onBuscar}
                  placeholder="Buscar por nombre..."
                  className="rounded-lg border border-campo/15 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-campo focus:ring-2 focus:ring-campo/20"
                />
              </div>
            </div>
            {cargando ? <Cargando /> : error ? <ErrorEstado mensaje={error} onReintentar={recargar} />
              : !clientes || clientes.length === 0 ? <Vacio mensaje={buscar ? `Sin resultados para "${buscar}".` : "Aún no hay clientes registrados."} />
              : (
                <ul className="divide-y divide-campo/8">
                  {clientes.map((c) => (
                    <li key={c.id}>
                      <Link to={`/clientes/${c.id}`} className="flex items-center justify-between py-3 hover:bg-campo/5 -mx-2 px-2 rounded-lg transition">
                        <div>
                          <p className="font-medium text-carbon">{c.nombre}</p>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-carbon/55">
                            {c.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefono}</span>}
                            {c.direccion && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.direccion}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {Number(c.deuda) > 0 && <Badge color="tierra">Debe {pesos(c.deuda)}</Badge>}
                          <ChevronRight className="h-4 w-4 text-carbon/30" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}
