import { Link } from 'react-router-dom';

const SECCIONES = [
  { to: '/ajustes/productos', label: 'Productos' },
  { to: '/ajustes/toppings', label: 'Toppings' },
  { to: '/ajustes/bases', label: 'Bases' },
  { to: '/ajustes/salsas', label: 'Salsas' },
  { to: '/ajustes/proteinas', label: 'Proteínas' },
] as const;

export function AjustesHub() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Ajustes</h1>
        <Link to="/" className="link-action">
          ← Menú
        </Link>
      </header>

      <p className="muted">Administra el catálogo del menú</p>

      <nav className="stack ajustes-hub">
        {SECCIONES.map((s) => (
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
