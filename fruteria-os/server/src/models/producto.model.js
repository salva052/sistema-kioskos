const pool = require('../config/db');

const ProductoModel = {
  async listar({ soloActivos = true } = {}) {
    let sql = 'SELECT * FROM productos';
    if (soloActivos) sql += ' WHERE activo = TRUE';
    sql += ' ORDER BY nombre ASC';
    const [rows] = await pool.execute(sql);
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.execute('SELECT * FROM productos WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async crear({ nombre, precioFijo }) {
    const [result] = await pool.execute(
      'INSERT INTO productos (nombre, precio_fijo) VALUES (?, ?)',
      [nombre, precioFijo ? 1 : 0]
    );
    return this.buscarPorId(result.insertId);
  },

  async actualizar(id, { nombre, precioFijo }) {
    await pool.execute(
      'UPDATE productos SET nombre = ?, precio_fijo = ? WHERE id = ?',
      [nombre, precioFijo ? 1 : 0, id]
    );
    return this.buscarPorId(id);
  },

  async desactivar(id) {
    await pool.execute('UPDATE productos SET activo = FALSE WHERE id = ?', [id]);
  },
};

const PrecioModel = {
  /**
   * Precios de una fecha dada, con datos del producto y margen calculado.
   */
  async porFecha(fecha) {
    const [rows] = await pool.execute(
      `SELECT p.id            AS precio_id,
              pr.id           AS producto_id,
              pr.nombre,
              pr.precio_fijo,
              p.costo,
              p.precio_venta,
              p.fecha
       FROM precios_diarios p
       JOIN productos pr ON pr.id = p.producto_id
       WHERE p.fecha = ?
       ORDER BY pr.nombre ASC`,
      [fecha]
    );
    return rows;
  },

  async fechaMasRecienteAntesDe(fecha) {
    const [rows] = await pool.execute(
      'SELECT MAX(fecha) AS f FROM precios_diarios WHERE fecha < ?',
      [fecha]
    );
    return rows[0]?.f || null;
  },

  /**
   * Inserta o actualiza el precio de un producto en una fecha (upsert).
   */
  async guardar({ productoId, costo, precioVenta, fecha }) {
    await pool.execute(
      `INSERT INTO precios_diarios (producto_id, costo, precio_venta, fecha)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE costo = VALUES(costo), precio_venta = VALUES(precio_venta)`,
      [productoId, costo, precioVenta, fecha]
    );
  },

  /**
   * Precio de venta vigente de un producto en una fecha (para los pedidos).
   */
  async precioVigente(productoId, fecha) {
    const [rows] = await pool.execute(
      `SELECT precio_venta FROM precios_diarios
       WHERE producto_id = ? AND fecha <= ?
       ORDER BY fecha DESC LIMIT 1`,
      [productoId, fecha]
    );
    return rows[0]?.precio_venta ?? null;
  },
};

module.exports = { ProductoModel, PrecioModel };
