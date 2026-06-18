const PedidoService = require('../services/pedido.service');

const PedidoController = {
  async listar(req, res, next) {
    try {
      res.json(await PedidoService.listar({ estado: req.query.estado, fecha: req.query.fecha }));
    } catch (e) { next(e); }
  },
  async obtener(req, res, next) {
    try { res.json(await PedidoService.obtener(req.params.id)); } catch (e) { next(e); }
  },
  async crear(req, res, next) {
    try {
      const pedido = await PedidoService.crear(req.body, req.user.id);
      res.status(201).json(pedido);
    } catch (e) { next(e); }
  },
  async cambiarEstado(req, res, next) {
    try {
      res.json(await PedidoService.cambiarEstado(req.params.id, req.body.estado));
    } catch (e) { next(e); }
  },
};

module.exports = PedidoController;
