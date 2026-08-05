import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Inyecta el token en cada peticion
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fruteria_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejo global del 401: limpia sesion y manda al login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fruteria_token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
