const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

const JWT_SECRET = process.env.JWT_SECRET || 'fruteria_secret_cambia_esto';
const ROLES_VALIDOS = ['admin', 'repartidor', 'tomador'];

/**
 * Capa de servicio: contiene la logica de negocio de autenticacion.
 * No conoce Express (req/res); solo recibe datos y devuelve resultados
 * o lanza errores. Esto permite probarla de forma aislada.
 */
const AuthService = {
  async login(email, password) {
    if (!email || !password) {
      const e = new Error('Email y contrasena son requeridos');
      e.status = 400;
      throw e;
    }
    const usuario = await UsuarioModel.buscarPorEmail(email.toLowerCase());
    if (!usuario || !usuario.activo) {
      const e = new Error('Credenciales invalidas');
      e.status = 401;
      throw e;
    }
    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      const e = new Error('Credenciales invalidas');
      e.status = 401;
      throw e;
    }
    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return {
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    };
  },

  async registrar({ nombre, email, password, rol }) {
    if (!nombre || !email || !password) {
      const e = new Error('Nombre, email y contrasena son requeridos');
      e.status = 400;
      throw e;
    }
    if (rol && !ROLES_VALIDOS.includes(rol)) {
      const e = new Error('Rol invalido');
      e.status = 400;
      throw e;
    }
    const existente = await UsuarioModel.buscarPorEmail(email.toLowerCase());
    if (existente) {
      const e = new Error('Ya existe un usuario con ese email');
      e.status = 409;
      throw e;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return UsuarioModel.crear({
      nombre,
      email: email.toLowerCase(),
      passwordHash,
      rol: rol || 'tomador',
    });
  },
};

module.exports = AuthService;
