import { TrendingUp, TrendingDown, Wallet, Users, Receipt, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { useFetch } from '../hooks/useFetch';
import { Tarjeta, Cargando, ErrorEstado } from '../components/ui';
import { pesos } from '../utils/format';

function Kpi({ icono: Icono, etiqueta, valor, tono = 'campo' }) {
  const tonos = {
    campo: 'text-campo-dark bg-campo/10',
    tierra: 'text-tierra bg-tierra/10',
  };
  return (
    <Tarjeta className="p-5">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${tonos[tono]}`}>
        <Icono className="h-5 w-5" />
      </div>
      <p className="text-sm text-carbon/55">{etiqueta}</p>
      <p className="mt-0.5 font-display text-2xl font-600 text-carbon">{valor}</p>
    </Tarjeta>
  );
}

export default function Dashboard() {
  const { datos, cargando, error, recargar } = useFetch('/dashboard');

  if (cargando) return <Cargando texto="Cargando el panel..." />;
  if (error) return <ErrorEstado mensaje={error} onReintentar={recargar} />;

  const d = datos || {};
  const barras = [
    { nombre: 'Ingresos', valor: d.ingresos || 0, color: '#4A7C2F' },
    { nombre: 'Egresos', valor: d.egresos || 0, color: '#A6612C' },
    { nombre: 'Utilidad', valor: d.utilidad || 0, color: '#6B9A4D' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-600 text-campo-dark">Panel del negocio</h1>
        <p className="text-sm text-carbon/55">Resumen del mes en curso</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icono={TrendingUp} etiqueta="Ingresos" valor={pesos(d.ingresos)} />
        <Kpi icono={TrendingDown} etiqueta="Egresos" valor={pesos(d.egresos)} tono="tierra" />
        <Kpi icono={Wallet} etiqueta="Utilidad" valor={pesos(d.utilidad)} />
        <Kpi icono={Receipt} etiqueta="Margen" valor={`${d.margen || 0}%`} />
        <Kpi icono={Package} etiqueta="Ticket promedio" valor={pesos(d.ticketPromedio)} />
        <Kpi icono={Users} etiqueta="Clientes activos" valor={d.clientesActivos || 0} />
        <Kpi icono={Wallet} etiqueta="Nómina" valor={pesos(d.nomina)} tono="tierra" />
        <Kpi icono={TrendingDown} etiqueta="Deuda por cobrar" valor={pesos(d.deudaTotal)} tono="tierra" />
      </div>

      <Tarjeta className="p-5">
        <h2 className="mb-4 font-display text-lg font-600 text-campo-dark">Ingresos vs egresos</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barras}>
              <XAxis dataKey="nombre" tick={{ fontSize: 13, fill: '#2A2A28' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} width={70}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                {barras.map((b, i) => <Cell key={i} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Tarjeta>
    </div>
  );
}
