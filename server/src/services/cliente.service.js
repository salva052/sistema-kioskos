const ClienteModel = require('../models/cliente.model');

const ClienteService = {
  listar(opts) {
    return ClienteModel.listar(opts);
  },

  deudores() {
    return ClienteModel.deudores();
  },

  async obtener(id) {
    const cliente = await ClienteModel.buscarPorId(id);
    if (!cliente) {
      const e = new Error('Cliente no encontrado');
      e.status = 404;
      throw e;
    }
    return cliente;
  },

  crear(datos) {
    if (!datos.nombre || datos.nombre.trim() === '') {
      const e = new Error('El nombre del cliente es requerido');
      e.status = 400;
      throw e;
    }
    if (datos.deuda && Number(datos.deuda) < 0) {
      const e = new Error('La deuda no puede ser negativa');
      e.status = 400;
      throw e;
    }
    return ClienteModel.crear(datos);
  },

  async actualizar(id, datos) {
    await this.obtener(id); // valida que exista
    if (!datos.nombre || datos.nombre.trim() === '') {
      const e = new Error('El nombre del cliente es requerido');
      e.status = 400;
      throw e;
    }
    return ClienteModel.actualizar(id, datos);
  },

  async eliminar(id) {
    await this.obtener(id);
    await ClienteModel.desactivar(id);
    return { ok: true };
  },
};

module.exports = ClienteService;
