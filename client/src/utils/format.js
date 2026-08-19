// Formatea un numero como pesos mexicanos
export function pesos(n) {
  const v = Number(n || 0);
  return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

// Formatea una fecha ISO a algo legible.
// IMPORTANTE: new Date('YYYY-MM-DD') interpreta como UTC medianoche.
// En México (UTC-6) eso aparece como el día anterior (18:00 del día previo).
// La solución es construir la fecha con los componentes numéricos directamente
// usando el constructor local: new Date(anio, mes, dia).
export function fechaCorta(iso) {
  if (!iso) return '';
  const str = String(iso).slice(0, 10);
  const [anio, mes, dia] = str.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// Fecha de hoy en formato YYYY-MM-DD usando la hora LOCAL del navegador,
// no UTC. Evita que a partir de las 6pm México la fecha sea "mañana" en UTC.
export function hoyISO() {
  return new Date().toLocaleDateString('en-CA'); // en-CA siempre da YYYY-MM-DD
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
