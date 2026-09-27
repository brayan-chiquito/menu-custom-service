import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import {
  fetchCatalogoProductos,
  type CatalogoProducto,
} from '../../shared/api/catalogoApi';

function money(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

function categoriaLabel(categoria: string): string {
  return categoria === 'bebidas' ? 'Bebidas' : 'Platos';
}

export function ProductosListPage() {
  const [items, setItems] = useState<CatalogoProducto[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchCatalogoProductos()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setStatus('ok');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof ApiError ? err.message : 'No se pudo cargar productos');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Productos</h1>
        <Link to="/ajustes" className="link-action">
          ← Ajustes
        </Link>
      </header>

      <Link to="/ajustes/productos/nuevo" className="btn btn-primary btn-block">
        + Nuevo producto
      </Link>

      {status === 'loading' ? <p>Cargando…</p> : null}
      {status === 'error' ? <p className="error">{message}</p> : null}

      {status === 'ok' && items.length === 0 ? (
        <p className="muted">Sin productos</p>
      ) : null}

      {status === 'ok' ? (
        <ul className="stack">
          {items.map((p) => (
            <li key={p.id} className="line-card">
              <div className="line-card-footer">
                <div>
                  <h2>{p.nombre}</h2>
                  <p className="muted">
                    {money(p.precio)} · {categoriaLabel(p.categoria)} ·{' '}
                    {p.disponible ? 'Disponible' : 'No disponible'}
                    {p.requiere_proteina ? ' · Con proteína' : ''}
                  </p>
                </div>
                <Link to={`/ajustes/productos/${p.id}`} className="link-action">
                  Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
