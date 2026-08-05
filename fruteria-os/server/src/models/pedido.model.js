const pool = require('../config/db');

const PedidoModel = {
  async listar({ estado, fecha } = {}) {
    let sql = `
      SELECT ped.*, c.nombre AS cliente_nombre
      FROM pedidos ped
      JOIN clientes c ON c.id = ped.cliente_id
      WHERE 1=1`;
    const params = [];
    if (estado) { sql += ' AND ped.estado = ?'; params.push(estado); }
    if (fecha)  { sql += ' AND ped.fecha = ?';  params.push(fecha); }
    sql += ' ORDER BY ped.fecha DESC, ped.id DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.execute(
      `SELECT ped.*, c.nombre AS cliente_nombre
       FROM pedidos ped JOIN clientes c ON c.id = ped.cliente_id
       WHERE ped.id = ? LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;
    const fechaPedido = rows[0].fecha instanceof Date
      ? rows[0].fecha.toISOString().slice(0, 10)
      : String(rows[0].fecha).slice(0, 10);
    const [detalle] = await pool.execute(
      `SELECT d.*,
              pr.nombre AS producto_nombre,
              COALESCE(p.costo, 0)                               AS costo_unit,
              COALESCE((d.precio_unit - p.costo) * d.cantidad, 0) AS margen_renglon
       FROM detalle_pedido d
       JOIN productos pr ON pr.id = d.producto_id
       LEFT JOIN precios_diarios p
              ON p.producto_id = d.producto_id AND p.fecha = ?
       WHERE d.pedido_id = ?`,
      [fechaPedido, id]
    );
    return { ...rows[0], detalle };
  },

  /**
   * Crea un pedido con sus renglones y suma el total a la deuda del
   * cliente, todo dentro de una transaccion (o se hace todo, o nada).
   */
  async crearConDetalle({ clienteId, usuarioId, fecha, estado, renglones, total }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [resPedido] = await conn.execute(
        `INSERT INTO pedidos (cliente_id, usuario_id, estado, total, fecha)
         VALUES (?, ?, ?, ?, ?)`,
        [clienteId, usuarioId || null, estado, total, fecha]
      );
      const pedidoId = resPedido.insertId;

      for (const r of renglones) {
        await conn.execute(
          `INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unit, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [pedidoId, r.productoId, r.cantidad, r.precioUnit, r.subtotal]
        );
      }

      // El pedido aumenta la deuda del cliente
      await conn.execute(
        'UPDATE clientes SET deuda = deuda + ? WHERE id = ?',
        [total, clienteId]
      );

      await conn.commit();
      return pedidoId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async cambiarEstado(id, estado) {
    await pool.execute('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
  },

  async eliminar(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[ped]] = await conn.execute('SELECT cliente_id, total FROM pedidos WHERE id = ?', [id]);
      if (ped) {
        await conn.execute('UPDATE clientes SET deuda = deuda - ? WHERE id = ?', [ped.total, ped.cliente_id]);
      }
      await conn.execute('DELETE FROM pedidos WHERE id = ?', [id]);
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  },
};

module.exports = PedidoModel;
