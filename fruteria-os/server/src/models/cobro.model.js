const pool = require('../config/db');

const CobroModel = {
  async listar({ clienteId } = {}) {
    let sql = `SELECT co.*, c.nombre AS cliente_nombre
               FROM cobros co JOIN clientes c ON c.id = co.cliente_id
               WHERE 1=1`;
    const params = [];
    if (clienteId) { sql += ' AND co.cliente_id = ?'; params.push(clienteId); }
    sql += ' ORDER BY co.fecha DESC, co.id DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * Registra el cobro y abona (resta) a la deuda del cliente,
   * dentro de una transaccion.
   */
  async crearYAbonar({ clienteId, pedidoId, monto, metodoPago, fecha }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [res] = await conn.execute(
        `INSERT INTO cobros (cliente_id, pedido_id, monto, metodo_pago, fecha)
         VALUES (?, ?, ?, ?, ?)`,
        [clienteId, pedidoId || null, monto, metodoPago, fecha]
      );
      await conn.execute(
        'UPDATE clientes SET deuda = deuda - ? WHERE id = ?',
        [monto, clienteId]
      );
      await conn.commit();
      return res.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = CobroModel;
