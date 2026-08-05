const pool = require('../config/db');

const GastoModel = {
  async listar({ categoria, desde, hasta } = {}) {
    let sql = 'SELECT * FROM gastos WHERE 1=1';
    const params = [];
    if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
    if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
    if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
    sql += ' ORDER BY fecha DESC, id DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async crear({ usuarioId, categoria, descripcion, monto, fecha }) {
    const [res] = await pool.execute(
      'INSERT INTO gastos (usuario_id, categoria, descripcion, monto, fecha) VALUES (?, ?, ?, ?, ?)',
      [usuarioId || null, categoria, descripcion || null, monto, fecha]
    );
    return { id: res.insertId, categoria, monto, fecha };
  },

  async eliminar(id) {
    await pool.execute('DELETE FROM gastos WHERE id = ?', [id]);
  },
};

module.exports = GastoModel;
