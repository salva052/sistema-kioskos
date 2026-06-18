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
