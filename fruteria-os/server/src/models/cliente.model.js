const pool = require('../config/db');

const ClienteModel = {
  async listar({ search, soloActivos = true } = {}) {
    let sql = 'SELECT * FROM clientes WHERE 1=1';
    const params = [];
    if (soloActivos) sql += ' AND activo = TRUE';
    if (search) {
      sql += ' AND nombre LIKE ?';
      params.push(`%${search}%`);
    }
    sql += ' ORDER BY nombre ASC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * Lista de deudores: clientes con deuda > 0, ordenados de mayor
   * a menor deuda (como pidio el cliente Christian).
   */
  async deudores() {
    const [rows] = await pool.execute(
      `SELECT id, nombre, telefono, deuda
       FROM clientes
       WHERE deuda > 0 AND activo = TRUE
       ORDER BY deuda DESC`
    );
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM clientes WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async crear({ nombre, telefono, direccion, ubicacion, deuda }) {
    const [result] = await pool.execute(
      `INSERT INTO clientes (nombre, telefono, direccion, ubicacion, deuda)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, telefono || null, direccion || null, ubicacion || null, deuda || 0]
    );
    return this.buscarPorId(result.insertId);
  },

  async actualizar(id, { nombre, telefono, direccion, ubicacion }) {
    await pool.execute(
      `UPDATE clientes
       SET nombre = ?, telefono = ?, direccion = ?, ubicacion = ?
       WHERE id = ?`,
      [nombre, telefono || null, direccion || null, ubicacion || null, id]
    );
    return this.buscarPorId(id);
  },

  async desactivar(id) {
    await pool.execute('UPDATE clientes SET activo = FALSE WHERE id = ?', [id]);
  },

  /**
   * Ajusta la deuda del cliente sumando un delta (positivo = mas deuda,
   * negativo = abono). Se usa al crear pedidos y registrar cobros.
   */
  async ajustarDeuda(id, delta, conexion = pool) {
    await conexion.execute(
      'UPDATE clientes SET deuda = deuda + ? WHERE id = ?',
      [delta, id]
    );
  },
};

module.exports = ClienteModel;
