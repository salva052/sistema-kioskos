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

  /**
   * Busca un producto por nombre sin importar mayusculas/espacios,
   * sin importar si esta activo o no. Se usa para evitar duplicados.
   */
  async buscarPorNombre(nombre) {
    const [rows] = await pool.execute(
      'SELECT * FROM productos WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) LIMIT 1',
      [nombre]
    );
    return rows[0] || null;
  },

  async reactivar(id) {
    await pool.execute('UPDATE productos SET activo = TRUE WHERE id = ?', [id]);
    return this.buscarPorId(id);
  },

  async crear({ nombre, precioFijo, esEnvio }) {
    const [result] = await pool.execute(
      'INSERT INTO productos (nombre, precio_fijo, es_envio) VALUES (?, ?, ?)',
      [nombre, precioFijo ? 1 : 0, esEnvio ? 1 : 0]
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
         AND pr.activo = TRUE
         AND COALESCE(pr.es_envio, 0) = 0
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
   * Solo devuelve precio si el producto existe y esta ACTIVO —
   * asi un pedido nunca puede incluir productos desactivados,
   * aunque el request salte el frontend y mande IDs directos.
   */
  async precioVigente(productoId, fecha) {
    const [rows] = await pool.execute(
      `SELECT p.precio_venta
       FROM precios_diarios p
       JOIN productos pr ON pr.id = p.producto_id AND pr.activo = TRUE
       WHERE p.producto_id = ? AND p.fecha <= ?
       ORDER BY p.fecha DESC LIMIT 1`,
      [productoId, fecha]
    );
    return rows[0]?.precio_venta ?? null;
  },
};

module.exports = { ProductoModel, PrecioModel };
