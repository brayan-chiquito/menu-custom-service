import { Link } from 'react-router-dom';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { useCocina } from './useCocina';

function formatearExtras(extras: string[]): string {
  return extras.filter(Boolean).join(' · ');
}

export function CocinaPage() {
  const { state, marcandoId, actionError, clearActionError, marcarListo, reintentar } =
    useCocina();

  return (
    <main className="page">
      <header className="page-header">
        <h1>Cocina</h1>
        <Link to="/" className="link-action">
          ← Menú
        </Link>
      </header>

      {actionError ? (
        <AlertError title="Error" message={actionError} onClose={clearActionError} />
      ) : null}

      {state.status === 'loading' ? <p>Cargando…</p> : null}

      {state.status === 'error' ? (
        <>
          <AlertError title="No se pudo cargar" message={state.message} onClose={reintentar} />
          <Button onClick={reintentar}>Reintentar</Button>
        </>
      ) : null}

      {state.status === 'ok' && state.pedidos.length === 0 ? (
        <p className="muted">Sin órdenes pendientes</p>
      ) : null}

      {state.status === 'ok' ? (
        <section className="stack">
          {state.pedidos.map((pedido) => (
            <article key={pedido.id} className="cocina-card">
              <div className="cocina-card-head">
                <div>
                  <h2>
                    {pedido.nombre_cliente || 'Sin nombre'}{' '}
                    <span className="muted">#{pedido.id}</span>
                  </h2>
                  <span
                    className={
                      pedido.estado === 'pagado' ? 'badge badge-pagado' : 'badge badge-pendiente'
                    }
                  >
                    {pedido.estado === 'pagado' ? 'Pagado' : 'Por cobrar'}
                  </span>
                </div>
                <Button
                  className="cocina-listo-btn"
                  disabled={marcandoId === pedido.id}
                  onClick={() => void marcarListo(pedido.id)}
                >
                  {marcandoId === pedido.id ? '…' : 'Listo'}
                </Button>
              </div>

              <ul className="cocina-items">
                {pedido.items.map((item, idx) => (
                  <li key={`${pedido.id}-${idx}`}>
                    <strong>
                      {item.cantidad}× {item.producto_nombre}
                    </strong>
                    {item.extras.length > 0 ? (
                      <p className="muted">{formatearExtras(item.extras)}</p>
                    ) : null}
                    {item.indicaciones ? (
                      <p className="muted">Ítem: {item.indicaciones}</p>
                    ) : null}
                  </li>
                ))}
              </ul>

              {pedido.indicaciones ? (
                <p className="muted">Indicaciones: {pedido.indicaciones}</p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
