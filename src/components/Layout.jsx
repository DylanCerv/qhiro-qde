import { Link, Outlet, useLocation } from 'react-router-dom';
import QhiroLogo from './QhiroLogo';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/app', label: 'Planos', icon: 'map', match: (p) => p === '/app' },
  {
    to: '/app/nuevo',
    label: 'Nuevo plano',
    icon: 'add_location_alt',
    match: (p) => p.startsWith('/app/nuevo') || p.startsWith('/app/projects/'),
  },
  {
    to: '/app/configuracion',
    label: 'Configuración base',
    icon: 'tune',
    match: (p) => p === '/app/configuracion' || p === '/app/precios',
  },
  {
    to: '/app/referencia',
    label: 'Referencia rápida',
    icon: 'menu_book',
    match: (p) => p === '/app/referencia',
  },
];

export default function Layout() {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const initials = (profile?.displayName ?? profile?.email ?? 'Q')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          <Link to="/app">
            <QhiroLogo variant="full" wordmark="Qhiro" size={34} />
          </Link>
          <span className="app-sidebar__product">Deployment Engine</span>
        </div>

        <nav className="app-nav" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`app-nav__link${item.match(location.pathname) ? ' is-active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <div className="app-user">
            <div className="app-user__avatar">{initials}</div>
            <div>
              <div className="app-user__name">{profile?.displayName ?? 'Admin'}</div>
              <div className="app-user__role">Ingeniería · Admin</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button type="button" className="btn btn-ghost" onClick={logout}>
            <span className="material-symbols-outlined">logout</span>
            Salir
          </button>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
