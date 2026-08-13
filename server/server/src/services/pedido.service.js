const PedidoModel = require('../models/pedido.model');
const ClienteModel = require('../models/cliente.model');
const { ProductoModel, PrecioModel } = require('../models/producto.model');

const ESTADOS = ['pendiente', 'entregado'];

const PedidoService = {
  listar(opts) {
    return PedidoModel.listar(opts);
  },

  async obtener(id) {
    const pedido = await PedidoModel.buscarPorId(id);
    if (!pedido) { const e = new Error('Pedido no encontrado'); e.status = 404; throw e; }
    // Calcular margen total del pedido sumando renglones
    const margenTotal = (pedido.detalle || []).reduce(
      (s, d) => s + Number(d.margen_renglon || 0), 0
    );
    return { ...pedido, margenTotal: Number(margenTotal.toFixed(2)) };
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
      if (!it.productoId) {
        const e = new Error('Cada renglon necesita un producto');
        e.status = 400; throw e;
      }
      const producto = await ProductoModel.buscarPorId(it.productoId);
      if (!producto || !producto.activo) {
        const e = new Error('Uno de los productos ya no esta disponible');
        e.status = 400; throw e;
      }

      let cantidad, precioUnit;

      // Detectar el producto de Envio de dos formas:
      // 1. Por la columna es_envio = TRUE (cuando la migracion ya corrio)
      // 2. Por nombre como fallback (cuando la columna aun no existe en BD)
      //    Esto hace que el feature funcione ANTES de que se aplique la
      //    migracion de ALTER TABLE, sin romper nada.
      const esEnvio = producto.es_envio ||
        producto.nombre?.toLowerCase().replace(/[íi]/g, 'i').trim() === 'envio';

      if (esEnvio) {
        // El envio tiene precio LIBRE: se captura al armar el pedido
        // (varia segun la distancia/ubicacion del cliente), no se
        // toma del catalogo de Precios del dia como los demas productos.
        const monto = Number(it.precioManual);
        if (!monto || monto <= 0) {
          const e = new Error('El monto del envío debe ser mayor a 0');
          e.status = 400; throw e;
        }
        cantidad = 1;
        precioUnit = monto;
      } else {
        if (!it.cantidad || Number(it.cantidad) <= 0) {
          const e = new Error('Cada renglon necesita cantidad valida');
          e.status = 400; throw e;
        }
        cantidad = Number(it.cantidad);
        // El precio SIEMPRE se toma del servidor, nunca de lo que
        // mande el navegador, para que nadie pueda alterar precios.
        precioUnit = await PrecioModel.precioVigente(it.productoId, fechaPedido);
        if (precioUnit == null) {
          const e = new Error(`No hay precio registrado para el producto ${it.productoId}`);
          e.status = 400; throw e;
        }
      }

      const subtotal = Number((Number(precioUnit) * cantidad).toFixed(2));
      total += subtotal;
      renglones.push({ productoId: it.productoId, cantidad, precioUnit, subtotal });
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

  async eliminar(id) {
    await this.obtener(id);
    await PedidoModel.eliminar(id);
    return { ok: true };
  },
};

module.exports = PedidoService;
