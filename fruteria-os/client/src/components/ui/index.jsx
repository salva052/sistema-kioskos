import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Loader2, Inbox, AlertCircle } from 'lucide-react';

/** Boton con variantes */
export function Boton({ children, variante = 'primario', tipo = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-campo/40 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantes = {
    primario: 'bg-campo text-white hover:bg-campo-dark',
    secundario: 'bg-campo/10 text-campo-dark hover:bg-campo/20',
    peligro: 'bg-tierra text-white hover:opacity-90',
    fantasma: 'text-campo-dark hover:bg-campo/10',
  };
  return (
    <button type={tipo} className={`${base} ${variantes[variante]}`} {...props}>
      {children}
    </button>
  );
}
Boton.propTypes = {
  children: PropTypes.node,
  variante: PropTypes.oneOf(['primario', 'secundario', 'peligro', 'fantasma']),
  tipo: PropTypes.string,
};

/** Tarjeta contenedora */
export function Tarjeta({ children, className = '' }) {
  return (
    <div className={`rounded-xl bg-hueso shadow-tarjeta border border-campo/5 ${className}`}>
      {children}
    </div>
  );
}
Tarjeta.propTypes = { children: PropTypes.node, className: PropTypes.string };

/** Campo de formulario con etiqueta */
export function Campo({ etiqueta, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-carbon/80">{etiqueta}</span>
      {children}
    </label>
  );
}
Campo.propTypes = { etiqueta: PropTypes.string, children: PropTypes.node };

/** Input de texto estilizado (acepta ref para formularios no controlados) */
export const Input = forwardRef(function Input(props, ref) {
  return (
    <input
      ref={ref}
      className="w-full rounded-lg border border-campo/15 bg-white px-3.5 py-2.5 text-sm text-carbon outline-none transition focus:border-campo focus:ring-2 focus:ring-campo/20"
      {...props}
    />
  );
});

/** Select estilizado (acepta ref para formularios no controlados) */
export const Select = forwardRef(function Select({ children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className="w-full rounded-lg border border-campo/15 bg-white px-3.5 py-2.5 text-sm text-carbon outline-none transition focus:border-campo focus:ring-2 focus:ring-campo/20"
      {...props}
    >
      {children}
    </select>
  );
});
Select.propTypes = { children: PropTypes.node };

/** Estado de carga */
export function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-campo/70">
      <Loader2 className="h-7 w-7 animate-spin" />
      <p className="text-sm">{texto}</p>
    </div>
  );
}
Cargando.propTypes = { texto: PropTypes.string };

/** Estado de error */
export function ErrorEstado({ mensaje, onReintentar }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-tierra" />
      <p className="text-sm text-carbon/70">{mensaje}</p>
      {onReintentar && <Boton variante="secundario" onClick={onReintentar}>Reintentar</Boton>}
    </div>
  );
}
ErrorEstado.propTypes = { mensaje: PropTypes.string, onReintentar: PropTypes.func };

/** Estado vacio */
export function Vacio({ mensaje = 'Aún no hay nada por aquí.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-campo/50">
      <Inbox className="h-8 w-8" />
      <p className="text-sm">{mensaje}</p>
    </div>
  );
}
Vacio.propTypes = { mensaje: PropTypes.string };

/** Etiqueta de rol o estado (badge) */
export function Badge({ children, color = 'campo' }) {
  const colores = {
    campo: 'bg-campo/12 text-campo-dark',
    tierra: 'bg-tierra/12 text-tierra',
    gris: 'bg-carbon/8 text-carbon/70',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colores[color]}`}>
      {children}
    </span>
  );
}
Badge.propTypes = { children: PropTypes.node, color: PropTypes.oneOf(['campo', 'tierra', 'gris']) };
