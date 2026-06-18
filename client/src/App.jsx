import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import { Cargando } from './components/ui';

// Lazy loading: las paginas se cargan solo cuando se visitan,
// reduciendo el tamano inicial de la app (requisito de la rubrica).
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clientes = lazy(() => import('./pages/Clientes'));
const ClienteDetalle = lazy(() => import('./pages/ClienteDetalle'));
const Pedidos = lazy(() => import('./pages/Pedidos'));
const Precios = lazy(() => import('./pages/Precios'));
const Cobros = lazy(() => import('./pages/Cobros'));
const Gastos = lazy(() => import('./pages/Gastos'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const NoEncontrado = lazy(() => import('./pages/NoEncontrado'));

// Decide la pantalla de inicio segun el rol:
// el admin ve el panel; los demas, los pedidos.
function Inicio() {
  const { usuario } = useAuth();
  if (usuario?.rol === 'admin') return <Dashboard />;
  return <Navigate to="/pedidos" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rutas internas: requieren sesion */}
        <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
          <Route index element={<Inicio />} />
          <Route path="pedidos" element={
            <RutaProtegida roles={['admin', 'tomador', 'repartidor']}><Pedidos /></RutaProtegida>
          } />
          <Route path="clientes" element={
            <RutaProtegida roles={['admin', 'tomador']}><Clientes /></RutaProtegida>
          } />
          <Route path="clientes/:id" element={
            <RutaProtegida roles={['admin', 'tomador']}><ClienteDetalle /></RutaProtegida>
          } />
          <Route path="precios" element={
            <RutaProtegida roles={['admin', 'tomador', 'repartidor']}><Precios /></RutaProtegida>
          } />
          <Route path="cobros" element={
            <RutaProtegida roles={['admin', 'repartidor']}><Cobros /></RutaProtegida>
          } />
          <Route path="gastos" element={
            <RutaProtegida roles={['admin']}><Gastos /></RutaProtegida>
          } />
          <Route path="usuarios" element={
            <RutaProtegida roles={['admin']}><Usuarios /></RutaProtegida>
          } />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </Suspense>
  );
}
