import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, RefreshCw } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { Tarjeta, Cargando, ErrorEstado, Vacio, Badge } from '../components/ui';
import { pesos, fechaCorta } from '../utils/format';

export default function ClienteDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  const { datos: cliente, cargando, error, recargar } = useFetch(`/clientes/${id}`);
  const cobros = useFetch(`/cobros?clienteId=${id}`);

  const resetearDeuda = async () => {
    if (!window.confirm(`¿Poner la deuda de ${cliente.nombre} en $0? Úsalo solo para limpiar datos de prueba.`)) return;
    try {
      await api.put(`/clientes/${id}/deuda/reset`);
      recargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo resetear la deuda');
    }
  };

  if (cargando) return <Cargando texto="Cargando cliente..." />;
  if (error) return <ErrorEstado mensaje={error} onReintentar={recargar} />;
  if (!cliente) return <Vacio mensaje="Cliente no encontrado." />;

  const alto = Number(cliente.deuda) > 1000;

  return (
    <div className="space-y-6">
      <Link to="/clientes" className="inline-flex items-center gap-1.5 text-sm font-medium text-campo hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>

      <Tarjeta className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-600 text-campo-dark">{cliente.nombre}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-carbon/60">
              {cliente.telefono && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{cliente.telefono}</span>}
              {cliente.direccion && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{cliente.direccion}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-carbon/55">Deuda actual</p>
            <p className={`font-display text-2xl font-700 ${alto ? 'text-tierra' : 'text-campo'}`}>{pesos(cliente.deuda)}</p>
            {alto && <Badge color="tierra">Deuda alta</Badge>}
            {esAdmin && Number(cliente.deuda) > 0 && (
              <button
                onClick={resetearDeuda}
                className="mt-2 flex items-center gap-1 text-xs text-carbon/40 hover:text-tierra transition"
                title="Resetear deuda a $0 (solo para datos de prueba)"
              >
                <RefreshCw className="h-3 w-3" /> Resetear deuda
              </button>
            )}
          </div>
        </div>
      </Tarjeta>

      <Tarjeta className="p-5">
        <h2 className="mb-3 font-display text-lg font-600 text-campo-dark">Historial de cobros</h2>
        {cobros.cargando ? <Cargando /> :
          !cobros.datos || cobros.datos.length === 0 ? <Vacio mensaje="Este cliente no tiene cobros registrados." />
          : (
            <ul className="divide-y divide-campo/8">
              {cobros.datos.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-carbon/70">{fechaCorta(c.fecha)}</span>
                  <div className="flex items-center gap-3">
                    <Badge color="gris">{c.metodo_pago}</Badge>
                    <span className="font-600 text-campo">{pesos(c.monto)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </Tarjeta>
    </div>
  );
}
