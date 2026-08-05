const CobroModel = require('../models/cobro.model');
const ClienteModel = require('../models/cliente.model');

const METODOS = ['efectivo', 'transferencia'];

const CobroService = {
  listar(opts) {
    return CobroModel.listar(opts);
  },

  async crear({ clienteId, pedidoId, monto, metodoPago, fecha }) {
    if (!clienteId) { const e = new Error('El cliente es requerido'); e.status = 400; throw e; }
    if (!monto || Number(monto) <= 0) {
      const e = new Error('El monto debe ser mayor a cero'); e.status = 400; throw e;
    }
    if (metodoPago && !METODOS.includes(metodoPago)) {
      const e = new Error('Metodo de pago invalido'); e.status = 400; throw e;
    }
    const cliente = await ClienteModel.buscarPorId(clienteId);
    if (!cliente) { const e = new Error('Cliente no encontrado'); e.status = 404; throw e; }

    const id = await CobroModel.crearYAbonar({
      clienteId,
      pedidoId,
      monto: Number(monto),
      metodoPago: metodoPago || 'efectivo',
      fecha: fecha || new Date().toISOString().slice(0, 10),
    });
    return { id, clienteId, monto: Number(monto), metodoPago: metodoPago || 'efectivo' };
  },
};

module.exports = CobroService;
