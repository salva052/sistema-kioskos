const CobroService = require('../services/cobro.service');

const CobroController = {
  async listar(req, res, next) {
    try { res.json(await CobroService.listar({ clienteId: req.query.clienteId })); } catch (e) { next(e); }
  },
  async crear(req, res, next) {
    try { res.status(201).json(await CobroService.crear(req.body)); } catch (e) { next(e); }
  },
};

module.exports = CobroController;
