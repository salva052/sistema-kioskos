import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * Hook personalizado que encapsula una peticion GET a la API
 * y maneja los tres estados: cargando, exito (datos) y error.
 * Devuelve tambien una funcion recargar() para volver a pedir.
 *
 * Uso: const { datos, cargando, error, recargar } = useFetch('/clientes');
 */
export function useFetch(url, dependencias = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const pedir = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await api.get(url);
      setDatos(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los datos');
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      setError(null);
      try {
        const { data } = await api.get(url);
        if (activo) setDatos(data);
      } catch (err) {
        if (activo) setError(err.response?.data?.error || 'Error al cargar los datos');
      } finally {
        if (activo) setCargando(false);
      }
    })();
    // Limpieza: evita actualizar estado si el componente se desmonto
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...dependencias]);

  return { datos, cargando, error, recargar: pedir };
}
