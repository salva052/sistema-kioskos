const { ProductoModel, PrecioModel } = require('../models/producto.model');

// Margen objetivo sobre el precio de venta (30%).
// El precio sugerido se obtiene dividiendo el costo entre (1 - 0.30) = 0.70,
// de modo que la ganancia sea el 30% del precio de venta.
const MARGEN_OBJETIVO = 0.30;

/**
 * Precio de venta sugerido a partir del costo, para lograr el margen objetivo.
 * sugerido = costo / (1 - margen)   ->   costo / 0.70
 * Ej: costo 100 -> 142.86 (de los cuales el 30% es ganancia).
 */
function precioSugerido(costo) {
  const c = Number(costo);
  if (!c || c <= 0) return 0;
  return Number((c / (1 - MARGEN_OBJETIVO)).toFixed(2));
}

/**
 * Calcula el porcentaje de ganancia (margen) sobre el costo.
 * margen % = (precioVenta - costo) / costo * 100
 * Si el costo es 0, devuelve 0 para evitar division entre cero.
 */
function calcularMargen(costo, precioVenta) {
  const c = Number(costo);
  const v = Number(precioVenta);
  if (!c || c <= 0) return 0;
  return Number((((v - c) / c) * 100).toFixed(2));
}

const { sanitizar } = require('../utils/sanitizar');

const ProductoService = {
  listar() {
    return ProductoModel.listar();
  },

  crear(datos) {
    if (!datos.nombre || datos.nombre.trim() === '') {
      const e = new Error('El nombre del producto es requerido');
      e.status = 400;
      throw e;
    }
    return ProductoModel.crear(datos);
  },

  async actualizar(id, datos) {
    const prod = await ProductoModel.buscarPorId(id);
    if (!prod) { const e = new Error('Producto no encontrado'); e.status = 404; throw e; }
    if (!datos.nombre || datos.nombre.trim() === '') {
      const e = new Error('El nombre del producto es requerido');
      e.status = 400;
      throw e;
    }
    return ProductoModel.actualizar(id, datos);
  },

  async eliminar(id) {
    const prod = await ProductoModel.buscarPorId(id);
    if (!prod) { const e = new Error('Producto no encontrado'); e.status = 404; throw e; }
    await ProductoModel.desactivar(id);
    return { ok: true };
  },
};

const PrecioService = {
  /**
   * Devuelve la lista de precios de una fecha con su margen.
   * Si esa fecha aun no tiene precios, los "arrastra" del dia
   * anterior (como pidio Christian: no recapturar todo a diario).
   * Tambien incluye el margen general (promedio ponderado simple).
   */
  async listaDelDia(fecha) {
    let precios = await PrecioModel.porFecha(fecha);

    if (precios.length === 0) {
      const fechaPrevia = await PrecioModel.fechaMasRecienteAntesDe(fecha);
      if (fechaPrevia) {
        precios = (await PrecioModel.porFecha(fechaPrevia)).map((p) => ({
          ...p,
          precio_id: null,       // aun no existe para la fecha solicitada
          fecha,
          heredado: true,        // marca que viene del dia anterior
        }));
      }
    }

    const items = precios.map((p) => ({
      productoId: p.producto_id,
      nombre: p.nombre,
      precioFijo: !!p.precio_fijo,
      costo: Number(p.costo),
      precioVenta: Number(p.precio_venta),
      margen: calcularMargen(p.costo, p.precio_venta),
      sugerido: precioSugerido(p.costo),
      heredado: !!p.heredado,
    }));

    // Margen general: sobre la suma de costos y ventas
    const totalCosto = items.reduce((s, i) => s + i.costo, 0);
    const totalVenta = items.reduce((s, i) => s + i.precioVenta, 0);
    const margenGeneral = calcularMargen(totalCosto, totalVenta);

    return { fecha, items, margenGeneral, totalCosto, totalVenta };
  },

  /**
   * Guarda la lista de precios de un dia.
   * Valida que los productos con precio_fijo no tengan margen alterado
   * (el precio de venta debe respetarse para esos productos).
   */
  async guardarLista(fecha, items) {
    if (!Array.isArray(items) || items.length === 0) {
      const e = new Error('Debe enviar al menos un precio');
      e.status = 400;
      throw e;
    }
    for (const it of items) {
      if (it.costo < 0 || it.precioVenta < 0) {
        const e = new Error('Los precios no pueden ser negativos');
        e.status = 400;
        throw e;
      }
      await PrecioModel.guardar({
        productoId: it.productoId,
        costo: it.costo,
        precioVenta: it.precioVenta,
        fecha,
      });
    }
    return this.listaDelDia(fecha);
  },

  /**
   * Elimina el precio de un producto para una fecha específica.
   * Si no se pasa fecha, elimina todos los precios del producto.
   */
  async eliminarPrecio(productoId, fecha) {
    if (fecha) {
      await pool.execute(
        'DELETE FROM precios_diarios WHERE producto_id = ? AND fecha = ?',
        [productoId, fecha]
      );
    } else {
      await pool.execute(
        'DELETE FROM precios_diarios WHERE producto_id = ?',
        [productoId]
      );
    }
    return { ok: true };
  },
};

module.exports = { ProductoService, PrecioService, calcularMargen, precioSugerido };
