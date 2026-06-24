import { useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingCart, Wallet, Receipt,
  Tag, LogOut, Menu, X, UserCog, Calculator,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui';

// Cada entrada declara que roles pueden verla.
// Asi el menu refleja los tres escenarios de acceso.
const NAV = [
  { a: '/', icono: LayoutDashboard, texto: 'Panel', roles: ['admin'] },
  { a: '/pedidos', icono: ShoppingCart, texto: 'Pedidos', roles: ['admin', 'tomador', 'repartidor'] },
  { a: '/cotizaciones', icono: Calculator, texto: 'Cotizaciones', roles: ['admin', 'tomador'] },
  { a: '/clientes', icono: Users, texto: 'Clientes', roles: ['admin', 'tomador'] },
  { a: '/precios', icono: Tag, texto: 'Precios del día', roles: ['admin', 'tomador', 'repartidor'] },
  { a: '/cobros', icono: Wallet, texto: 'Cobros', roles: ['admin', 'repartidor'] },
  { a: '/gastos', icono: Receipt, texto: 'Gastos', roles: ['admin'] },
  { a: '/usuarios', icono: UserCog, texto: 'Usuarios', roles: ['admin'] },
];

const NOMBRE_ROL = { admin: 'Administrador', repartidor: 'Repartidor', tomador: 'Pedidos' };

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const salir = () => { logout(); navigate('/login'); };
  const visibles = NAV.filter((n) => n.roles.includes(usuario?.rol));

  return (
    <div className="flex min-h-screen bg-crema">
      {/* Sidebar */}
      <aside
        className={`surcos-dark fixed inset-y-0 left-0 z-30 w-64 transform bg-campo-dark text-white transition-transform lg:static lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 p-1.5">
            <img src="/logo.png" alt="Sistema Kiosko's" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-display text-lg font-600 leading-tight">Sistema Kiosko's</p>
            <p className="text-[11px] text-white/50 -mt-0.5">Distribuidora</p>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {visibles.map(({ a, icono: Icono, texto }) => (
            <NavLink
              key={a}
              to={a}
              end={a === '/'}
              onClick={() => setAbierto(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icono className="h-[18px] w-[18px]" />
              {texto}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="mb-3 px-1">
            <p className="text-sm font-semibold">{usuario?.nombre}</p>
            <Badge color="campo">{NOMBRE_ROL[usuario?.rol] || usuario?.rol}</Badge>
          </div>
          <button
            onClick={salir}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {abierto && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setAbierto(false)} />
      )}

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-campo/10 bg-crema/90 backdrop-blur px-4 py-3 lg:hidden">
          <button onClick={() => setAbierto(true)} className="text-campo-dark">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-display font-600 text-campo-dark">Sistema Kiosko's</span>
        </header>

        <main className="p-5 sm:p-7 max-w-6xl mx-auto fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

Layout.propTypes = { children: PropTypes.node };
