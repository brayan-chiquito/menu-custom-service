import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import {
  fetchCatalogoNombres,
  type CatalogoNombre,
} from '../../shared/api/catalogoApi';

type Recurso = 'bases' | 'salsas' | 'proteinas';

const META: Record<
  Recurso,
  { titulo: string; singular: string; nuevoLabel: string }
> = {
  bases: { titulo: 'Bases', singular: 'base', nuevoLabel: '+ Nueva base' },
  salsas: { titulo: 'Salsas', singular: 'salsa', nuevoLabel: '+ Nueva salsa' },
  proteinas: {
    titulo: 'Proteínas',
    singular: 'proteína',
    nuevoLabel: '+ Nueva proteína',
  },
};

type Props = {
  recurso: Recurso;
};

export function NombresListPage({ recurso }: Props) {
  const meta = META[recurso];
  const [items, setItems] = useState<CatalogoNombre[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchCatalogoNombres(recurso)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setStatus('ok');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(
          err instanceof ApiError ? err.message : `No se pudo cargar ${meta.titulo.toLowerCase()}`,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [recurso, meta.titulo]);

  return (
    <main className="page">
      <header className="page-header">
        <h1>{meta.titulo}</h1>
        <Link to="/ajustes" className="link-action">
          ← Ajustes
        </Link>
      </header>

      <Link to={`/ajustes/${recurso}/nuevo`} className="btn btn-primary btn-block">
        {meta.nuevoLabel}
      </Link>

      {status === 'loading' ? <p>Cargando…</p> : null}
      {status === 'error' ? <p className="error">{message}</p> : null}

      {status === 'ok' && items.length === 0 ? (
        <p className="muted">Sin {meta.titulo.toLowerCase()}</p>
      ) : null}

      {status === 'ok' ? (
        <ul className="stack">
          {items.map((item) => (
            <li key={item.id} className="line-card">
              <div className="line-card-footer">
                <h2>{item.nombre}</h2>
                <Link to={`/ajustes/${recurso}/${item.id}`} className="link-action">
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
