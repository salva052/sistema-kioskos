const { ProductoModel, PrecioModel } = require('../models/producto.model');
const pool = require('../config/db');

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

  async crear(datos) {
    datos.nombre = sanitizar(datos.nombre);
    if (!datos.nombre || datos.nombre.trim() === '') {
      const e = new Error('El nombre del producto es requerido');
      e.status = 400;
      throw e;
    }
    const nombreLimpio = datos.nombre.trim();

    // Evitar duplicados: si ya existe (activo o no), no se crea uno nuevo.
    const existente = await ProductoModel.buscarPorNombre(nombreLimpio);
    if (existente) {
      if (existente.activo) {
        const e = new Error(`Ya existe una fruta llamada "${nombreLimpio}"`);
        e.status = 409;
        throw e;
      }
      // Estaba inactivo (se habia "quitado" antes) -> se reactiva en vez
      // de crear una fila nueva. Esto es lo que evita la acumulacion
      // de duplicados que causo el problema original.
      return ProductoModel.reactivar(existente.id);
    }

    return ProductoModel.crear({ ...datos, nombre: nombreLimpio });
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

  /**
   * Asegura que exista el producto especial "Envío" en el catalogo.
   * Se usa para poder cobrar el envio de un pedido igual que un
   * producto (aparece en el desglose y en la nota impresa), pero
   * con precio LIBRE: se captura al crear el pedido, no viene del
   * catalogo de Precios del dia, porque el costo de envio cambia
   * segun la distancia/ubicacion de cada cliente.
   */
  async asegurarProductoEnvio() {
    const existente = await ProductoModel.buscarPorNombre('Envío');
    if (existente) {
      if (!existente.activo) return ProductoModel.reactivar(existente.id);
      return existente;
    }
    return ProductoModel.crear({ nombre: 'Envío', precioFijo: true, esEnvio: true });
  },

  /**
   * Info que necesita el formulario de "Nuevo pedido" para poder
   * ofrecer el apartado de envio: el id del producto especial, y
   * opcionalmente un monto sugerido si el admin ya registro un
   * precio de envio "por defecto" en Precios del dia.
   */
  async obtenerInfoEnvio(fecha) {
    const envio = await this.asegurarProductoEnvio();
    const fechaConsulta = fecha || new Date().toISOString().slice(0, 10);
    const sugerido = await PrecioModel.precioVigente(envio.id, fechaConsulta);
    return {
      productoId: envio.id,
      nombre: envio.nombre,
      precioSugerido: sugerido != null ? Number(sugerido) : null,
    };
  },
};

const PrecioService = {
  /**
   * Devuelve la lista de precios de una fecha con su margen.
   * Para cada producto ACTIVO, usa el precio de hoy si existe, o el
   * mas reciente anterior (heredado). Esto evita que agregar UN
   * producto hoy haga desaparecer todos los demas que tienen precios
   * de dias anteriores.
   */
  async listaDelDia(fecha) {
    // 1. Precios registrados para HOY
    const preciosHoy = await PrecioModel.porFecha(fecha);
    const idsConPrecioHoy = new Set(preciosHoy.map((p) => p.producto_id));

    // 2. Para los productos SIN precio hoy, buscar el mas reciente anterior.
    //    Un solo query eficiente: para cada producto activo no-envio que
    //    no tiene precio hoy, trae el precio de la fecha mas reciente.
    const [prevRows] = await pool.execute(
      `SELECT pd.producto_id,
              pr.nombre,
              pr.precio_fijo,
              pd.costo,
              pd.precio_venta,
              pd.fecha
       FROM precios_diarios pd
       JOIN productos pr ON pr.id = pd.producto_id
       WHERE pr.activo = TRUE
         AND COALESCE(pr.es_envio, 0) = 0
         AND pd.fecha < ?
         AND pd.fecha = (
           SELECT MAX(pd2.fecha)
           FROM precios_diarios pd2
           WHERE pd2.producto_id = pd.producto_id
             AND pd2.fecha < ?
         )
       ORDER BY pr.nombre ASC`,
      [fecha, fecha]
    );

    // 3. Quedarnos solo con los que NO tienen precio hoy (evitar duplicados)
    const preciosPrevios = prevRows
      .filter((r) => !idsConPrecioHoy.has(r.producto_id))
      .map((p) => ({ ...p, heredado: true }));

    // 4. Combinar: hoy + heredados, ordenado alfabéticamente
    const todosPreciosBrutos = [
      ...preciosHoy.map((p) => ({ ...p, heredado: false })),
      ...preciosPrevios,
    ].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const items = todosPreciosBrutos.map((p) => ({
      productoId: p.producto_id,
      nombre:     p.nombre,
      precioFijo: !!p.precio_fijo,
      costo:      Number(p.costo),
      precioVenta: Number(p.precio_venta),
      margen:     calcularMargen(p.costo, p.precio_venta),
      sugerido:   precioSugerido(p.costo),
      heredado:   !!p.heredado,
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
      // Verificar que el producto exista y esté activo antes de guardar
      const [prod] = await pool.execute(
        'SELECT id FROM productos WHERE id = ? AND activo = TRUE LIMIT 1',
        [it.productoId]
      );
      if (!prod[0]) continue; // ignorar productos inactivos o inexistentes
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
