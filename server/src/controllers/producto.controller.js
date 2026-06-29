const { ProductoService, PrecioService } = require('../services/producto.service');

const ProductoController = {
  async listar(req, res, next) {
    try { res.json(await ProductoService.listar()); } catch (e) { next(e); }
  },
  async crear(req, res, next) {
    try { res.status(201).json(await ProductoService.crear(req.body)); } catch (e) { next(e); }
  },
  async actualizar(req, res, next) {
    try { res.json(await ProductoService.actualizar(req.params.id, req.body)); } catch (e) { next(e); }
  },
  async eliminar(req, res, next) {
    try { res.json(await ProductoService.eliminar(req.params.id)); } catch (e) { next(e); }
  },

  // Precios diarios
  async listaDelDia(req, res, next) {
    try {
      const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);
      res.json(await PrecioService.listaDelDia(fecha));
    } catch (e) { next(e); }
  },
  async guardarLista(req, res, next) {
    try {
      const fecha = req.body.fecha || new Date().toISOString().slice(0, 10);
      res.json(await PrecioService.guardarLista(fecha, req.body.items));
    } catch (e) { next(e); }
  },

  async eliminarPrecio(req, res, next) {
    try {
      const productoId = req.params.productoId;
      const fecha = req.query.fecha; // opcional
      res.json(await PrecioService.eliminarPrecio(productoId, fecha));
    } catch (e) { next(e); }
  },
};

module.exports = ProductoController;
