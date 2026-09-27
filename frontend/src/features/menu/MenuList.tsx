import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../shared/api/authApi';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { useAuthStore } from '../auth/authStore';
import { AgregarProductoModal } from './AgregarProductoModal';
import { useMenu } from './useMenu';

export function MenuList() {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const clear = useAuthStore((s) => s.clear);
  const {
    state,
    selected,
    openProducto,
    closeProducto,
    addItem,
    cantidadItems,
    total,
    reintentar,
  } = useMenu();

  async function salir() {
    try {
      await logout();
    } catch {
      // limpiar igual si el token ya no vale
    }
    clear();
    navigate('/login', { replace: true });
  }

  if (state.status === 'loading') {
    return (
      <main className="page">
        <p>Cargando menú…</p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="page">
        <header className="page-header">
          <h1>Platanópolis</h1>
        </header>
        <AlertError
          title={state.title}
          message={state.message}
          onClose={() => reintentar()}
        />
        <Button onClick={() => reintentar()}>Reintentar</Button>
      </main>
    );
  }

  const { menu } = state;

  return (
    <main className="page">
      <header className="page-header">
        <h1>Platanópolis</h1>
        <nav className="header-nav">
          <Link to="/ajustes" className="btn-gear" aria-label="Ajustes">
            ⚙
          </Link>
          <Link to="/cocina" className="link-action">
            Cocina
          </Link>
          <Link to="/historial" className="link-action">
            Historial
          </Link>
        </nav>
      </header>

      {usuario ? (
        <div className="session-chip">
          <span>{usuario.nombre}</span>
          <button type="button" className="link-action session-logout" onClick={() => void salir()}>
            Salir
          </button>
        </div>
      ) : null}

      <section className="product-grid">
        {menu.productos.map((producto) => (
          <article key={producto.id} className="product-card">
            <h2>{producto.nombre}</h2>
            <p className="muted">{producto.descripcion}</p>
            <div className="product-card-footer">
              <strong>${producto.precio.toLocaleString('es-CO')}</strong>
              <Button
                aria-label={`Agregar ${producto.nombre}`}
                onClick={() => openProducto(producto)}
                className="btn-icon"
              >
                +
              </Button>
            </div>
          </article>
        ))}
      </section>

      <footer className="cart-bar">
        <div>
          <p className="muted">{cantidadItems === 0 ? 'Sin ítems aún' : `${cantidadItems} ítems`}</p>
          <strong>${total.toLocaleString('es-CO')}</strong>
        </div>
        <Button disabled={cantidadItems === 0} onClick={() => navigate('/resumen')}>
          Ver pedido
        </Button>
      </footer>

      {selected ? (
        <AgregarProductoModal
          open
          producto={selected}
          bases={menu.bases}
          salsas={menu.salsas}
          proteinas={menu.proteinas}
          onClose={closeProducto}
          onAdd={(payload) => {
            addItem({
              producto_id: selected.id,
              nombre: selected.nombre,
              precio_unitario: selected.precio,
              ...payload,
            });
          }}
        />
      ) : null}
    </main>
  );
}
