const GastoModel = require('../models/gasto.model');

const CATEGORIAS = ['gasolina', 'nomina', 'publicidad', 'mantenimiento', 'otro'];

const GastoService = {
  listar(opts) { return GastoModel.listar(opts); },

  crear({ categoria, descripcion, monto, fecha }, usuarioId) {
    if (!monto || Number(monto) <= 0) {
      const e = new Error('El monto debe ser mayor a cero'); e.status = 400; throw e;
    }
    if (categoria && !CATEGORIAS.includes(categoria)) {
      const e = new Error('Categoria invalida'); e.status = 400; throw e;
    }
    return GastoModel.crear({
      usuarioId,
      categoria: categoria || 'otro',
      descripcion,
      monto: Number(monto),
      fecha: fecha || new Date().toISOString().slice(0, 10),
    });
  },

  async eliminar(id) {
    await GastoModel.eliminar(id);
    return { ok: true };
  },
};

module.exports = GastoService;
