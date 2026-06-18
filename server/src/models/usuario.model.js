const pool = require('../config/db');

/**
 * Capa de modelo: encapsula TODO el acceso a la tabla usuarios.
 * Ninguna otra capa escribe SQL de usuarios; asi mantenemos
 * alta cohesion y bajo acoplamiento (los servicios no saben SQL).
 */
const UsuarioModel = {
  async buscarPorEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const [rows] = await pool.execute(
      'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async crear({ nombre, email, passwordHash, rol }) {
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, passwordHash, rol]
    );
    return { id: result.insertId, nombre, email, rol };
  },

  async listar() {
    const [rows] = await pool.execute(
      'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios ORDER BY nombre ASC'
    );
    return rows;
  },
};

module.exports = UsuarioModel;
