import { useState } from 'react';
import { Wallet } from 'lucide-react';
import api from '../api/axios';
import { useFetch } from '../hooks/useFetch';
import { Tarjeta, Cargando, ErrorEstado, Vacio, Boton, Campo, Select, Input, Badge } from '../components/ui';
import { pesos, fechaCorta } from '../utils/format';

export default function Cobros() {
  const { datos: cobros, cargando, error, recargar } = useFetch('/cobros');
  const clientes = useFetch('/clientes');
  const [form, setForm] = useState({ clienteId: '', monto: '', metodoPago: 'efectivo' });
  const [msg, setMsg] = useState('');

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const registrar = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/cobros', {
        clienteId: Number(form.clienteId),
        monto: Number(form.monto),
        metodoPago: form.metodoPago,
      });
      setForm({ clienteId: '', monto: '', metodoPago: 'efectivo' });
      recargar(); clientes.recargar();
    } catch (err) { setMsg(err.response?.data?.error || 'No se pudo registrar'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-600 text-campo-dark">Cobros</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta className="p-5 h-fit">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-600 text-campo-dark">
            <Wallet className="h-5 w-5" /> Registrar cobro
          </h2>
          <form onSubmit={registrar} className="space-y-3">
            <Campo etiqueta="Cliente">
              <Select name="clienteId" value={form.clienteId} onChange={cambiar} required>
                <option value="">Selecciona...</option>
                {(clientes.datos || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}{Number(c.deuda) > 0 ? ` (debe ${pesos(c.deuda)})` : ''}</option>
                ))}
              </Select>
            </Campo>
            <Campo etiqueta="Monto"><Input name="monto" type="number" step="0.01" value={form.monto} onChange={cambiar} required /></Campo>
            <Campo etiqueta="Método de pago">
              <Select name="metodoPago" value={form.metodoPago} onChange={cambiar}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </Select>
            </Campo>
            {msg && <p className="text-sm text-tierra">{msg}</p>}
            <Boton tipo="submit">Registrar cobro</Boton>
          </form>
        </Tarjeta>

        <Tarjeta className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-600 text-campo-dark">Cobros recientes</h2>
          {cargando ? <Cargando /> : error ? <ErrorEstado mensaje={error} onReintentar={recargar} />
            : !cobros || cobros.length === 0 ? <Vacio mensaje="Aún no hay cobros." />
            : (
              <ul className="divide-y divide-campo/8">
                {cobros.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-carbon">{c.cliente_nombre}</p>
                      <p className="text-xs text-carbon/55">{fechaCorta(c.fecha)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-700 text-campo">{pesos(c.monto)}</p>
                      <Badge color="gris">{c.metodo_pago}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </Tarjeta>
      </div>
    </div>
  );
}
