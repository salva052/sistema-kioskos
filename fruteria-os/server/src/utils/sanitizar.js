/**
 * Utilidades de sanitización de inputs.
 * Previene ataques XSS y entradas maliciosas antes de guardar en la BD.
 * Se aplica en los servicios, no en los modelos, para mantener la separación
 * de responsabilidades.
 */

/**
 * Limpia un string: quita espacios sobrantes y elimina caracteres
 * HTML especiales que podrían usarse en ataques XSS.
 * Ejemplo: sanitizar('<script>alert(1)</script>') → '&lt;script&gt;alert(1)&lt;/script&gt;'
 */
function sanitizar(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza todos los campos string de un objeto.
 * Útil para limpiar req.body de una vez.
 * Ejemplo: sanitizarObj({ nombre: '<b>Juan</b>', rol: 'admin' })
 *          → { nombre: '&lt;b&gt;Juan&lt;/b&gt;', rol: 'admin' }
 */
function sanitizarObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const limpio = {};
  for (const [k, v] of Object.entries(obj)) {
    limpio[k] = typeof v === 'string' ? sanitizar(v) : v;
  }
  return limpio;
}

/**
 * Valida que un valor sea un número válido y mayor a cero.
 * Previene entradas como NaN, Infinity o strings numéricos maliciosos.
 */
function esNumeroPositivo(val) {
  const n = Number(val);
  return !isNaN(n) && isFinite(n) && n > 0;
}

/**
 * Valida formato de email básico.
 */
function esEmailValido(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

module.exports = { sanitizar, sanitizarObj, esNumeroPositivo, esEmailValido };
