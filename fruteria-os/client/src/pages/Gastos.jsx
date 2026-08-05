import { useState } from 'react';
import { Receipt, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useFetch } from '../hooks/useFetch';
import { Tarjeta, Cargando, ErrorEstado, Vacio, Boton, Campo, Select, Input, Badge } from '../components/ui';
import { pesos, fechaCorta } from '../utils/format';

const CATS = ['gasolina', 'nomina', 'publicidad', 'mantenimiento', 'otro'];

export default function Gastos() {
  const { datos: gastos, cargando, error, recargar } = useFetch('/gastos');
  const [form, setForm] = useState({ categoria: 'gasolina', descripcion: '', monto: '' });
  const [msg, setMsg] = useState('');

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const registrar = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/gastos', { ...form, monto: Number(form.monto) });
      setForm({ categoria: 'gasolina', descripcion: '', monto: '' });
      recargar();
    } catch (err) { setMsg(err.response?.data?.error || 'No se pudo registrar'); }
  };

  const borrar = async (id) => {
    try { await api.delete(`/gastos/${id}`); recargar(); } catch (err) { setMsg('Error al borrar'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-600 text-campo-dark">Gastos</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta className="p-5 h-fit">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-600 text-campo-dark">
            <Receipt className="h-5 w-5" /> Registrar gasto
          </h2>
          <form onSubmit={registrar} className="space-y-3">
            <Campo etiqueta="Categoría">
              <Select name="categoria" value={form.categoria} onChange={cambiar}>
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Campo>
            <Campo etiqueta="Descripción"><Input name="descripcion" value={form.descripcion} onChange={cambiar} /></Campo>
            <Campo etiqueta="Monto"><Input name="monto" type="number" step="0.01" value={form.monto} onChange={cambiar} required /></Campo>
            {msg && <p className="text-sm text-tierra">{msg}</p>}
            <Boton tipo="submit">Registrar gasto</Boton>
          </form>
        </Tarjeta>

        <Tarjeta className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-600 text-campo-dark">Gastos recientes</h2>
          {cargando ? <Cargando /> : error ? <ErrorEstado mensaje={error} onReintentar={recargar} />
            : !gastos || gastos.length === 0 ? <Vacio mensaje="Aún no hay gastos." />
            : (
              <ul className="divide-y divide-campo/8">
                {gastos.map((g) => (
                  <li key={g.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge color="gris">{g.categoria}</Badge>
                        {g.descripcion && <span className="text-sm text-carbon">{g.descripcion}</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-carbon/55">{fechaCorta(g.fecha)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-700 text-tierra">{pesos(g.monto)}</span>
                      <button onClick={() => borrar(g.id)} className="text-carbon/40 hover:text-tierra"><Trash2 className="h-4 w-4" /></button>
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
