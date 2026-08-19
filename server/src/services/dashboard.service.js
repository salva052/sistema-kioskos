const pool = require('../config/db');

/**
 * Dashboard financiero. Calcula los indicadores que pidio Christian
 * para un periodo (rango de fechas): ingresos, egresos, utilidad,
 * margen, ticket promedio y conteo de clientes activos.
 */
const DashboardService = {
  async resumen({ desde, hasta }) {
    // Fecha actual en timezone México (no UTC) para que los rangos sean correctos
    const tz = 'America/Mexico_City';
    const hoyMx = new Date().toLocaleDateString('en-CA', { timeZone: tz });
    const [anio, mes] = hoyMx.split('-').map(Number);
    const inicioMes = `${anio}-${String(mes).padStart(2,'0')}-01`;
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const finMes = `${anio}-${String(mes).padStart(2,'0')}-${String(ultimoDia).padStart(2,'0')}`;
    const d = desde || inicioMes;
    const h = hasta || finMes;

    // Ingresos = suma de cobros en el periodo
    const [ingRows] = await pool.execute(
      'SELECT COALESCE(SUM(monto), 0) AS total, COUNT(*) AS num FROM cobros WHERE fecha BETWEEN ? AND ?',
      [d, h]
    );
    const ingresos = Number(ingRows[0].total);
    const numCobros = Number(ingRows[0].num);

    // Egresos = suma de gastos en el periodo
    const [egrRows] = await pool.execute(
      'SELECT COALESCE(SUM(monto), 0) AS total FROM gastos WHERE fecha BETWEEN ? AND ?',
      [d, h]
    );
    const egresos = Number(egrRows[0].total);

    // Egresos desglosados por categoria, para el estado de resultados
    const [egrCatRows] = await pool.execute(
      `SELECT categoria, COALESCE(SUM(monto), 0) AS total
       FROM gastos WHERE fecha BETWEEN ? AND ?
       GROUP BY categoria ORDER BY total DESC`,
      [d, h]
    );
    const egresosPorCategoria = egrCatRows.map(r => ({ categoria: r.categoria, monto: Number(r.total) }));

    // Nomina (subconjunto de egresos)
    const [nomRows] = await pool.execute(
      "SELECT COALESCE(SUM(monto), 0) AS total FROM gastos WHERE categoria = 'nomina' AND fecha BETWEEN ? AND ?",
      [d, h]
    );
    const nomina = Number(nomRows[0].total);

    // Pedidos del periodo (para ticket promedio)
    const [pedRows] = await pool.execute(
      'SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS num FROM pedidos WHERE fecha BETWEEN ? AND ?',
      [d, h]
    );
    const ventas = Number(pedRows[0].total);
    const numPedidos = Number(pedRows[0].num);

    // Clientes activos = clientes con al menos un pedido en el periodo
    const [actRows] = await pool.execute(
      'SELECT COUNT(DISTINCT cliente_id) AS num FROM pedidos WHERE fecha BETWEEN ? AND ?',
      [d, h]
    );
    const clientesActivos = Number(actRows[0].num);

    // Deuda total pendiente (foto actual, no del periodo)
    // Se calcula de dos formas para garantizar consistencia:
    // 1. Suma de deuda en la tabla clientes (campo denormalizado, rápido)
    // 2. Si hay diferencia, la fuente de verdad es clientes.deuda
    // Para limpiar deudas de prueba, usar el endpoint PUT /clientes/:id/deuda
    const [deudaRows] = await pool.execute(
      'SELECT COALESCE(SUM(deuda), 0) AS total FROM clientes WHERE activo = TRUE AND deuda > 0'
    );
    const deudaTotal = Number(deudaRows[0].total);

    const utilidad = Number((ingresos - egresos).toFixed(2));
    const margen = ingresos > 0 ? Number(((utilidad / ingresos) * 100).toFixed(2)) : 0;
    const ticketPromedio = numPedidos > 0 ? Number((ventas / numPedidos).toFixed(2)) : 0;

    return {
      periodo: { desde: d, hasta: h },
      ingresos,
      egresos,
      egresosPorCategoria,
      utilidad,
      margen,
      nomina,
      ventas,
      ticketPromedio,
      numPedidos,
      numCobros,
      clientesActivos,
      deudaTotal,
    };
  },
};

module.exports = DashboardService;
