import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../api/axios';

const AuthContext = createContext(null);

/**
 * Proveedor de autenticacion: maneja el estado global del usuario
 * (token y rol) usando Context API. Cualquier componente accede a el
 * con el hook useAuth().
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar, recupera la sesion guardada si existe
  useEffect(() => {
    const guardado = localStorage.getItem('fruteria_token');
    if (guardado) {
      api.defaults.headers.common['Authorization'] = `Bearer ${guardado}`;
      api.get('/auth/me')
        .then(({ data }) => { setToken(guardado); setUsuario(data); })
        .catch(() => {
          localStorage.removeItem('fruteria_token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('fruteria_token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setToken(data.token);
    setUsuario(data.usuario);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('fruteria_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ token, usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = { children: PropTypes.node };

export function useAuth() {
  return useContext(AuthContext);
}
