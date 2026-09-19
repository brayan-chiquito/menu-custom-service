import { Link } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { formatearLineaDetalle } from './historial.format';
import { useHistorial } from './useHistorial';

function formatHora(createdAt: string): string {
  const date = new Date(createdAt.includes('T') ? createdAt : createdAt.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export function HistorialPedidos() {
  const {
    state,
    filtro,
    setFiltro,
    filtrados,
    detalleId,
    abrirDetalle,
    cerrarDetalle,
    detalles,
    pedidoDetalle,
  } = useHistorial();

  const detalleState = detalleId !== null ? detalles[detalleId] : undefined;
  const sheetTitle = pedidoDetalle
    ? `${pedidoDetalle.nombre_cliente} · #${pedidoDetalle.id}`
    : 'Detalle';

  return (
    <main className="page page-historial">
      <div className="historial-top">
        <header className="page-header">
          <h1>Hoy</h1>
          <div className="header-nav">
            <Link to="/balance" className="link-action">
              Balance
            </Link>
            <Link to="/" className="link-action">
              ← Menú
            </Link>
          </div>
        </header>

        <div className="chip-row filters">
          {(
            [
              ['todos', 'Todos'],
              ['pendiente', 'Pendientes'],
              ['pagado', 'Pagados'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip ${filtro === value ? 'chip-active' : ''}`}
              onClick={() => setFiltro(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="historial-scroll">
        {state.status === 'loading' ? <p>Cargando…</p> : null}
        {state.status === 'error' ? <p className="error">{state.message}</p> : null}

        {state.status === 'ok' && filtrados.length === 0 ? (
          <div className="empty-state">
            <p>
              {state.pedidos.length === 0
                ? 'No hay pedidos hoy'
                : 'No hay pedidos con este filtro'}
            </p>
            <p className="muted">
              {state.pedidos.length === 0
                ? 'Los pedidos guardados o pagados aparecerán aquí'
                : 'Prueba con Todos o cambia el filtro'}
            </p>
            <Link to="/">
              <Button>Ir al menú</Button>
            </Link>
          </div>
        ) : null}

        <section className="stack">
          {filtrados.map((pedido) => (
            <article key={pedido.id} className="hist-card hist-card-stack">
              <div className="hist-card-main">
                <div>
                  <h2>{pedido.nombre_cliente}</h2>
                  <p className="muted">
                    #{pedido.id} · {formatHora(pedido.created_at)}
                  </p>
                </div>
                <div className="hist-right">
                  <strong>${pedido.total.toLocaleString('es-CO')}</strong>
                  <span className={`badge badge-${pedido.estado}`}>
                    {pedido.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>

              <div className="hist-acciones">
                <Button
                  variant="secondary"
                  className="btn-block"
                  onClick={() => abrirDetalle(pedido.id)}
                >
                  Detalles
                </Button>
                {pedido.estado === 'pendiente' ? (
                  <Link to={`/cobro/${pedido.id}`} className="btn-block-link">
                    <Button className="btn-block">Cobrar</Button>
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </div>

      <Modal open={detalleId !== null} title={sheetTitle} onClose={cerrarDetalle}>
        {pedidoDetalle ? (
          <p className="muted">
            {formatHora(pedidoDetalle.created_at)} ·{' '}
            {pedidoDetalle.estado === 'pagado' ? 'Pagado' : 'Pendiente'} · $
            {pedidoDetalle.total.toLocaleString('es-CO')}
          </p>
        ) : null}

        {detalleState?.status === 'loading' ? <p className="muted">Cargando…</p> : null}
        {detalleState?.status === 'error' ? <p className="error">{detalleState.message}</p> : null}

        {detalleState?.status === 'ok' ? (
          <div className="hist-detalle hist-detalle-sheet">
            {detalleState.detalle.lineas.map((linea, index) => (
              <div key={`${detalleId}-${index}`} className="hist-linea">
                <div className="hist-linea-row">
                  <strong>
                    {linea.cantidad}× {linea.producto_nombre}
                  </strong>
                  <span>${linea.subtotal.toLocaleString('es-CO')}</span>
                </div>
                <p className="muted">{formatearLineaDetalle(linea)}</p>
              </div>
            ))}
            {pedidoDetalle?.estado === 'pagado' ? (
              <p className="hist-pago-info">
                Pagado: ${(detalleState.detalle.monto_pagado ?? 0).toLocaleString('es-CO')}
                {detalleState.detalle.vuelto != null
                  ? ` · Vuelto: $${detalleState.detalle.vuelto.toLocaleString('es-CO')}`
                  : ''}
              </p>
            ) : null}
            {pedidoDetalle?.estado === 'pendiente' ? (
              <Link to={`/cobro/${pedidoDetalle.id}`} className="btn-block-link">
                <Button className="btn-block">Cobrar ahora</Button>
              </Link>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </main>
  );
}
