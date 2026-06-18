const PedidoModel = require('../models/pedido.model');
const ClienteModel = require('../models/cliente.model');
const { PrecioModel } = require('../models/producto.model');

const ESTADOS = ['pendiente', 'entregado'];

const PedidoService = {
  listar(opts) {
    return PedidoModel.listar(opts);
  },

  async obtener(id) {
    const pedido = await PedidoModel.buscarPorId(id);
    if (!pedido) { const e = new Error('Pedido no encontrado'); e.status = 404; throw e; }
    return pedido;
  },

  /**
   * Crea un pedido. Recibe cliente y una lista de renglones
   * { productoId, cantidad }. El precio unitario se toma del precio
   * vigente del producto en la fecha, y se calculan subtotales y total
   * en el backend (no se confia en el total que mande el cliente).
   */
  async crear({ clienteId, fecha, items }, usuarioId) {
    if (!clienteId) { const e = new Error('El cliente es requerido'); e.status = 400; throw e; }
    if (!Array.isArray(items) || items.length === 0) {
      const e = new Error('El pedido debe tener al menos un producto'); e.status = 400; throw e;
    }
    const cliente = await ClienteModel.buscarPorId(clienteId);
    if (!cliente) { const e = new Error('Cliente no encontrado'); e.status = 404; throw e; }

    const fechaPedido = fecha || new Date().toISOString().slice(0, 10);
    const renglones = [];
    let total = 0;

    for (const it of items) {
      if (!it.productoId || !it.cantidad || Number(it.cantidad) <= 0) {
        const e = new Error('Cada renglon necesita producto y cantidad valida');
        e.status = 400; throw e;
      }
      const precioUnit = await PrecioModel.precioVigente(it.productoId, fechaPedido);
      if (precioUnit == null) {
        const e = new Error(`No hay precio registrado para el producto ${it.productoId}`);
        e.status = 400; throw e;
      }
      const subtotal = Number((Number(precioUnit) * Number(it.cantidad)).toFixed(2));
      total += subtotal;
      renglones.push({ productoId: it.productoId, cantidad: it.cantidad, precioUnit, subtotal });
    }
    total = Number(total.toFixed(2));

    const pedidoId = await PedidoModel.crearConDetalle({
      clienteId, usuarioId, fecha: fechaPedido, estado: 'pendiente', renglones, total,
    });
    return PedidoModel.buscarPorId(pedidoId);
  },

  async cambiarEstado(id, estado) {
    if (!ESTADOS.includes(estado)) {
      const e = new Error('Estado invalido'); e.status = 400; throw e;
    }
    await this.obtener(id);
    await PedidoModel.cambiarEstado(id, estado);
    return PedidoModel.buscarPorId(id);
  },
};

module.exports = PedidoService;
