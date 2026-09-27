import { Link } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';

const CATALOGO = [
  { to: '/ajustes/productos', label: 'Productos' },
  { to: '/ajustes/toppings', label: 'Toppings' },
  { to: '/ajustes/bases', label: 'Bases' },
  { to: '/ajustes/salsas', label: 'Salsas' },
  { to: '/ajustes/proteinas', label: 'Proteínas' },
] as const;

export function AjustesHub() {
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === 'admin';

  return (
    <main className="page">
      <header className="page-header">
        <h1>Ajustes</h1>
        <Link to="/" className="link-action">
          ← Menú
        </Link>
      </header>

      {usuario ? (
        <p className="muted">
          {usuario.nombre} · {usuario.rol}
        </p>
      ) : null}

      <nav className="stack ajustes-hub">
        {esAdmin ? (
          <>
            <Link to="/usuarios" className="ajustes-row">
              <span>Usuarios</span>
              <span className="ajustes-row-arrow" aria-hidden>
                ›
              </span>
            </Link>
            <Link to="/seguimiento" className="ajustes-row">
              <span>Seguimiento</span>
              <span className="ajustes-row-arrow" aria-hidden>
                ›
              </span>
            </Link>
          </>
        ) : null}

        {CATALOGO.map((s) => (
          <Link key={s.to} to={s.to} className="ajustes-row">
            <span>{s.label}</span>
            <span className="ajustes-row-arrow" aria-hidden>
              ›
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
