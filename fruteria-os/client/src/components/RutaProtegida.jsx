import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Cargando } from './ui';

/**
 * Ruta protegida. Verifica dos cosas:
 *  1. Que haya sesion iniciada (si no, redirige al login).
 *  2. Que el rol del usuario este permitido (si no, manda al inicio).
 *
 * Uso:
 *   <RutaProtegida roles={['admin']}>  ...solo admin
 *   <RutaProtegida>                    ...cualquier usuario logueado
 */
export default function RutaProtegida({ children, roles }) {
  const { token, usuario, cargando } = useAuth();

  if (cargando) return <Cargando texto="Verificando sesión..." />;
  if (!token) return <Navigate to="/login" replace />;
  if (roles && usuario && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

RutaProtegida.propTypes = {
  children: PropTypes.node,
  roles: PropTypes.arrayOf(PropTypes.string),
};
