// Formatea un numero como pesos mexicanos
export function pesos(n) {
  const v = Number(n || 0);
  return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

// Formatea una fecha ISO a algo legible
export function fechaCorta(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Fecha de hoy en formato YYYY-MM-DD
export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const iso = (d) => d.toISOString().slice(0, 10);

/**
 * Calcula el rango {desde, hasta} para un periodo dado, tomando como
 * referencia una fecha (por defecto hoy). Se usa en el Panel y en
 * Reportes para filtrar por Día, Mes o Año.
 */
export function rangoPeriodo(tipo, fechaRef = new Date()) {
  const ref = typeof fechaRef === 'string' ? new Date(fechaRef + 'T00:00:00') : fechaRef;
  if (tipo === 'dia') {
    const d = iso(ref);
    return { desde: d, hasta: d };
  }
  if (tipo === 'anio') {
    return {
      desde: iso(new Date(ref.getFullYear(), 0, 1)),
      hasta: iso(new Date(ref.getFullYear(), 11, 31)),
    };
  }
  // mes (default)
  return {
    desde: iso(new Date(ref.getFullYear(), ref.getMonth(), 1)),
    hasta: iso(new Date(ref.getFullYear(), ref.getMonth() + 1, 0)),
  };
}

/** Etiqueta legible del periodo, para mostrar en pantalla e imprimir. */
export function etiquetaPeriodo(tipo, fechaRef = new Date()) {
  const ref = typeof fechaRef === 'string' ? new Date(fechaRef + 'T00:00:00') : fechaRef;
  if (tipo === 'dia') return ref.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  if (tipo === 'anio') return `Año ${ref.getFullYear()}`;
  return ref.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}
