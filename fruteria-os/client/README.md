# Frutería OS — Frontend (React)

Interfaz del sistema de gestión para la distribuidora de fruta y verdura.
Stack: React + Vite + React Router + Tailwind + axios + Recharts.

## Instalación

1. `npm install`
2. `cp .env.example .env` y ajustar la URL del backend si hace falta
3. `npm run dev` (desarrollo, en http://localhost:5173)
4. `npm run build` + `npm run preview` (producción)

> El backend debe estar corriendo (ver carpeta `server`). En desarrollo,
> Vite redirige `/api` a http://localhost:3001 automáticamente.

## Los tres escenarios de acceso

- **Usuario NO logueado**: solo ve el login. Cualquier ruta interna lo
  redirige a `/login` (rutas protegidas).
- **Usuario logueado** (repartidor / tomador): ve solo las secciones de su
  rol. El menú lateral se arma según el rol.
- **Admin** (Christian): ve todo, incluido el panel financiero y gastos.

| Sección        | admin | tomador | repartidor |
|----------------|:-----:|:-------:|:----------:|
| Panel (dashboard) | ✓ |   |   |
| Pedidos        | ✓ | ✓ | ✓ |
| Clientes       | ✓ | ✓ |   |
| Precios del día | ✓ | ✓ | ✓ |
| Cobros         | ✓ |   | ✓ |
| Gastos         | ✓ |   |   |

## Cuentas de demostración

En la pantalla de login hay botones que rellenan las credenciales de cada rol.

## Características de React aplicadas

- Componentes funcionales y props con PropTypes
- Estado local (useState) y efectos (useEffect con limpieza)
- Estado global con Context API (useAuth)
- Hooks personalizados: useAuth y useFetch
- React Router: rutas anidadas, rutas protegidas, NavLink, 404
- Lazy loading de las páginas (code splitting)
- Formularios controlados con validación
- Estados de carga, éxito y error en cada vista
- Renderizado condicional (según rol) y de listas
- Consumo de APIs con axios (async/await y promesas)
- Gráficas con Recharts (Dashboard)

## Estructura

```
src/
  api/axios.js            cliente HTTP con token automático
  hooks/
    useAuth.jsx           sesión y rol (Context global)
    useFetch.jsx          hook de carga de datos (loading/éxito/error)
  components/
    RutaProtegida.jsx     protege rutas y verifica rol
    layout/Layout.jsx     menú lateral filtrado por rol
    ui/index.jsx          componentes reutilizables
  pages/                  una página por módulo + 404
  utils/format.js         formato de pesos y fechas
```
