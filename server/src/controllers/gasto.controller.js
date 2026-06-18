const GastoService = require('../services/gasto.service');

const GastoController = {
  async listar(req, res, next) {
    try { res.json(await GastoService.listar(req.query)); } catch (e) { next(e); }
  },
  async crear(req, res, next) {
    try { res.status(201).json(await GastoService.crear(req.body, req.user.id)); } catch (e) { next(e); }
  },
  async eliminar(req, res, next) {
    try { res.json(await GastoService.eliminar(req.params.id)); } catch (e) { next(e); }
  },
};

module.exports = GastoController;
