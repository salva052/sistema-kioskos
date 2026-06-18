const ClienteService = require('../services/cliente.service');

const ClienteController = {
  async listar(req, res, next) {
    try {
      const clientes = await ClienteService.listar({ search: req.query.search });
      res.json(clientes);
    } catch (err) { next(err); }
  },

  async deudores(req, res, next) {
    try {
      res.json(await ClienteService.deudores());
    } catch (err) { next(err); }
  },

  async obtener(req, res, next) {
    try {
      res.json(await ClienteService.obtener(req.params.id));
    } catch (err) { next(err); }
  },

  async crear(req, res, next) {
    try {
      const cliente = await ClienteService.crear(req.body);
      res.status(201).json(cliente);
    } catch (err) { next(err); }
  },

  async actualizar(req, res, next) {
    try {
      res.json(await ClienteService.actualizar(req.params.id, req.body));
    } catch (err) { next(err); }
  },

  async eliminar(req, res, next) {
    try {
      res.json(await ClienteService.eliminar(req.params.id));
    } catch (err) { next(err); }
  },
};

module.exports = ClienteController;
