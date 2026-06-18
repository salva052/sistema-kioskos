const AuthService = require('../services/auth.service');
const UsuarioModel = require('../models/usuario.model');

/**
 * Capa de controlador: orquesta la peticion HTTP.
 * Llama al servicio y traduce el resultado (o el error) a una
 * respuesta HTTP con el codigo adecuado.
 */
const AuthController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const resultado = await AuthService.login(email, password);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  },

  async registrar(req, res, next) {
    try {
      const usuario = await AuthService.registrar(req.body);
      res.status(201).json(usuario);
    } catch (err) {
      next(err);
    }
  },

  async perfil(req, res, next) {
    try {
      const usuario = await UsuarioModel.buscarPorId(req.user.id);
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(usuario);
    } catch (err) {
      next(err);
    }
  },

  async listar(req, res, next) {
    try {
      const usuarios = await UsuarioModel.listar();
      res.json(usuarios);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
