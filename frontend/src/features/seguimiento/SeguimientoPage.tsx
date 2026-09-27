import { Link } from 'react-router-dom';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { formatearFilaAuditoria } from './seguimiento.format';
import { useSeguimiento } from './useSeguimiento';

export function SeguimientoPage() {
  const { state, reintentar } = useSeguimiento();

  return (
    <main className="page">
      <header className="page-header">
        <h1>Seguimiento</h1>
        <Link to="/ajustes" className="link-action">
          ← Ajustes
        </Link>
      </header>

      {state.status === 'loading' ? <p>Cargando…</p> : null}

      {state.status === 'error' ? (
        <>
          <AlertError title="Error" message={state.message} onClose={reintentar} />
          <Button onClick={reintentar}>Reintentar</Button>
        </>
      ) : null}

      {state.status === 'ok' && state.items.length === 0 ? (
        <p className="muted">Sin registros</p>
      ) : null}

      {state.status === 'ok' ? (
        <ul className="stack">
          {state.items.map((item) => {
            const row = formatearFilaAuditoria(item);
            return (
              <li key={item.id} className="line-card">
                <h2>{row.quien}</h2>
                <p>{row.que}</p>
                <p className="muted">{row.cuando}</p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </main>
  );
}
