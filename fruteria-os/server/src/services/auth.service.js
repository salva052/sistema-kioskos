const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_inseguro_cambiar';
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'production' ? 12 : 10;
const ROLES_VALIDOS = ['admin', 'repartidor', 'tomador'];

/**
 * Capa de servicio: contiene la logica de negocio de autenticacion.
 * No conoce Express (req/res); solo recibe datos y devuelve resultados
 * o lanza errores. Esto permite probarla de forma aislada.
 */
const { sanitizar, esEmailValido } = require('../utils/sanitizar');

const AuthService = {
  async login(email, password) {
    if (!email || !password) {
      const e = new Error('Email y contrasena son requeridos');
      e.status = 400; throw e;
    }
    const emailLimpio = String(email).toLowerCase().trim();
    if (!esEmailValido(emailLimpio)) {
      const e = new Error('Credenciales invalidas');
      e.status = 401; throw e;
    }
    const usuario = await UsuarioModel.buscarPorEmail(emailLimpio);
    if (!usuario || !usuario.activo) {
      const e = new Error('Credenciales invalidas');
      e.status = 401; throw e;
    }
    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      const e = new Error('Credenciales invalidas');
      e.status = 401; throw e;
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
      e.status = 400; throw e;
    }
    const emailLimpio = String(email).toLowerCase().trim();
    if (!esEmailValido(emailLimpio)) {
      const e = new Error('Email invalido'); e.status = 400; throw e;
    }
    if (rol && !ROLES_VALIDOS.includes(rol)) {
      const e = new Error('Rol invalido'); e.status = 400; throw e;
    }
    const nombreLimpio = sanitizar(nombre);
    if (!nombreLimpio) {
      const e = new Error('Nombre invalido'); e.status = 400; throw e;
    }
    const existente = await UsuarioModel.buscarPorEmail(emailLimpio);
    if (existente) {
      const e = new Error('Ya existe un usuario con ese email');
      e.status = 409; throw e;
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return UsuarioModel.crear({
      nombre: nombreLimpio,
      email: emailLimpio,
      passwordHash,
      rol: rol || 'tomador',
    });
  },
};

module.exports = AuthService;
