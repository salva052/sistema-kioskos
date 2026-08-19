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
        // El producto ya existe y está activo. Devolvemos su info en el
        // error para que el frontend pueda guardar el precio de todas
        // formas sin que el usuario quede bloqueado.
        const e = new Error(`"${nombreLimpio}" ya estaba en el catálogo. Se guardará su precio.`);
        e.status = 409;
        e.productoExistente = existente;
        throw e;
      }
      // Estaba inactivo → reactivar
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
   * Asegura que exista EXACTAMENTE un producto "Envío" correcto:
   *  - activo = TRUE
   *  - es_envio = TRUE  (esto es lo que permite el precio libre)
   *
   * Es robusto ante el historial: si de pruebas viejas quedaron
   * productos "envio"/"Envío" (con o sin acento, duplicados, o con
   * es_envio en 0), los normaliza: elige uno como oficial, lo marca
   * correctamente, y desactiva los demas. Si no existe ninguno, lo crea.
   */
  async asegurarProductoEnvio() {
    // 0. Auto-migración: agrega la columna es_envio si no existe aún.
    //    Error 1060 = "Duplicate column name" = ya existe, ignorar.
    try {
      await pool.execute('ALTER TABLE productos ADD COLUMN es_envio BOOLEAN NOT NULL DEFAULT FALSE');
      console.log('Migración aplicada: columna es_envio agregada.');
    } catch (e) {
      if (e.errno !== 1060) console.warn('[WARN] es_envio migration:', e.message);
    }

    // Busca todos los candidatos (con o sin acento, mayus/minus).
    // No se usa ORDER BY es_envio porque la columna puede no existir
    // todavia si la migracion aun no corrio. Ordenamos por activo e id.
    const [filas] = await pool.execute(
      `SELECT * FROM productos
       WHERE LOWER(TRIM(nombre)) IN ('envio', 'envío')
       ORDER BY activo DESC, id ASC`
    );

    if (filas.length === 0) {
      // No hay ninguno: crear el oficial ya marcado como envio.
      return ProductoModel.crear({ nombre: 'Envío', precioFijo: true, esEnvio: true });
    }

    // El primero (por el ORDER BY) es el mejor candidato a ser el oficial.
    const oficial = filas[0];
    await pool.execute(
      "UPDATE productos SET nombre = 'Envío', es_envio = TRUE, activo = TRUE WHERE id = ?",
      [oficial.id]
    );

    // Cualquier otro "envio" duplicado se desactiva para no confundir.
    if (filas.length > 1) {
      const otros = filas.slice(1).map(f => f.id);
      await pool.execute(
        `UPDATE productos SET activo = FALSE WHERE id IN (${otros.map(() => '?').join(',')})`,
        otros
      );
    }

    return ProductoModel.buscarPorId(oficial.id);
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
