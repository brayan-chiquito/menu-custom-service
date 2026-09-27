import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import {
  fetchCatalogoAdiciones,
  type CatalogoAdicion,
} from '../../shared/api/catalogoApi';

function money(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

export function ToppingsListPage() {
  const [items, setItems] = useState<CatalogoAdicion[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchCatalogoAdiciones()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setStatus('ok');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof ApiError ? err.message : 'No se pudo cargar toppings');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Toppings</h1>
        <Link to="/ajustes" className="link-action">
          ← Ajustes
        </Link>
      </header>

      <Link to="/ajustes/toppings/nuevo" className="btn btn-primary btn-block">
        + Nuevo topping
      </Link>

      {status === 'loading' ? <p>Cargando…</p> : null}
      {status === 'error' ? <p className="error">{message}</p> : null}

      {status === 'ok' && items.length === 0 ? (
        <p className="muted">Sin toppings</p>
      ) : null}

      {status === 'ok' ? (
        <ul className="stack">
          {items.map((t) => (
            <li key={t.id} className="line-card">
              <div className="line-card-footer">
                <div>
                  <h2>{t.nombre}</h2>
                  <p className="muted">{money(t.precio)}</p>
                </div>
                <Link to={`/ajustes/toppings/${t.id}`} className="link-action">
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
