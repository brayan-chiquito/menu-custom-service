import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { Modal } from '../../shared/components/Modal';
import { eliminarPedido, restaurarPedido } from '../../shared/api/pedidosApi';
import {
  mensajeErrorUsuario,
  type ErrorAlertContent,
} from '../../shared/errors/mensajeErrorUsuario';
import { formatearLineaDetalle, formatearMetaHistorial, formatHoraBogota } from './historial.format';
import { useHistorial } from './useHistorial';

export function HistorialPedidos() {
  const navigate = useNavigate();
  const {
    state,
    filtro,
    setFiltro,
    pedidos,
    hasMore,
    cargarMas,
    cargandoMas,
    detalleId,
    abrirDetalle,
    cerrarDetalle,
    detalles,
    pedidoDetalle,
    quitarPedidoLocal,
  } = useHistorial();

  const detalleState = detalleId !== null ? detalles[detalleId] : undefined;
  const sheetTitle = pedidoDetalle
    ? `${pedidoDetalle.nombre_cliente} · #${pedidoDetalle.id}`
    : 'Detalle';
  const esEliminados = filtro === 'eliminados';

  const [eliminando, setEliminando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [accionAlert, setAccionAlert] = useState<ErrorAlertContent | null>(null);
  const [listaAlertDismissed, setListaAlertDismissed] = useState(false);

  async function onEliminar() {
    if (detalleId === null) return;
    setEliminando(true);
    setAccionAlert(null);
    try {
      await eliminarPedido(detalleId);
      quitarPedidoLocal(detalleId);
      setConfirmEliminar(false);
      cerrarDetalle();
    } catch (err: unknown) {
      setAccionAlert(mensajeErrorUsuario(err, 'No se pudo eliminar el pedido'));
    } finally {
      setEliminando(false);
    }
  }

  async function onRestaurar() {
    if (detalleId === null) return;
    setRestaurando(true);
    setAccionAlert(null);
    try {
      await restaurarPedido(detalleId);
      quitarPedidoLocal(detalleId);
      cerrarDetalle();
    } catch (err: unknown) {
      setAccionAlert(mensajeErrorUsuario(err, 'No se pudo restaurar el pedido'));
    } finally {
      setRestaurando(false);
    }
  }

  const showListaAlert = state.status === 'error' && !listaAlertDismissed;

  return (
    <main className="page page-historial">
      <div className="historial-top">
        <header className="page-header">
          <h1>Historial</h1>
          <div className="header-nav">
            <Link to="/balance" className="link-action">
              Balance
            </Link>
            <Link to="/" className="link-action">
              ← Menú
            </Link>
          </div>
        </header>

        {showListaAlert ? (
          <AlertError
            title="No se pudo cargar el historial"
            message={state.message}
            onClose={() => setListaAlertDismissed(true)}
          />
        ) : null}

        <div className="chip-row filters">
          {(
            [
              ['todos', 'Todos'],
              ['pendiente', 'Pendientes'],
              ['pagado', 'Pagados'],
              ['eliminados', 'Eliminados'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip ${filtro === value ? 'chip-active' : ''}`}
              onClick={() => {
                setListaAlertDismissed(false);
                setFiltro(value);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="historial-scroll">
        {state.status === 'loading' ? <p>Cargando…</p> : null}

        {state.status === 'ok' && pedidos.length === 0 ? (
          <div className="empty-state">
            <p>No hay pedidos</p>
            <p className="muted">
              {filtro === 'eliminados'
                ? 'Aquí aparecen los pedidos eliminados que se pueden restaurar'
                : filtro === 'todos'
                  ? 'Los pedidos guardados o pagados aparecerán aquí'
                  : 'Prueba con Todos o cambia el filtro'}
            </p>
            {filtro !== 'eliminados' ? (
              <Link to="/">
                <Button>Ir al menú</Button>
              </Link>
            ) : null}
          </div>
        ) : null}

        <section className="stack">
          {pedidos.map((pedido) => (
            <article key={pedido.id} className="hist-card hist-card-stack">
              <div className="hist-card-main">
                <div>
                  <h2>{pedido.nombre_cliente}</h2>
                  <p className="muted">{formatearMetaHistorial(pedido.id, pedido.created_at)}</p>
                </div>
                <div className="hist-right">
                  <strong>${pedido.total.toLocaleString('es-CO')}</strong>
                  <div className="hist-badges">
                    <span className={`badge badge-${pedido.estado}`}>
                      {pedido.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </span>
                    {pedido.estado === 'pagado' ? (
                      <span
                        className={`badge ${pedido.es_transferencia ? 'badge-transfer' : 'badge-efectivo'}`}
                      >
                        {pedido.es_transferencia ? 'Transfer' : 'Efectivo'}
                      </span>
                    ) : null}
                  </div>
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
                {!esEliminados && pedido.estado === 'pendiente' ? (
                  <Link to={`/cobro/${pedido.id}`} className="btn-block-link">
                    <Button className="btn-block">Cobrar</Button>
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        {state.status === 'ok' && hasMore ? (
          <div className="hist-cargar-mas">
            <Button variant="secondary" disabled={cargandoMas} onClick={() => void cargarMas()}>
              {cargandoMas ? 'Cargando…' : 'Cargar más'}
            </Button>
          </div>
        ) : null}
      </div>

      <Modal
        open={detalleId !== null && !confirmEliminar}
        title={sheetTitle}
        onClose={() => {
          setAccionAlert(null);
          cerrarDetalle();
        }}
      >
        {pedidoDetalle ? (
          <p className="muted">
            {formatHoraBogota(pedidoDetalle.created_at)} ·{' '}
            {pedidoDetalle.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
            {pedidoDetalle.estado === 'pagado'
              ? ` · ${pedidoDetalle.es_transferencia ? 'Transfer' : 'Efectivo'}`
              : ''}{' '}
            · ${pedidoDetalle.total.toLocaleString('es-CO')}
          </p>
        ) : null}

        {detalleState?.status === 'loading' ? <p className="muted">Cargando…</p> : null}
        {detalleState?.status === 'error' ? (
          <AlertError
            title="No se pudo cargar el detalle"
            message={detalleState.message}
            onClose={() => cerrarDetalle()}
          />
        ) : null}

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
            {pedidoDetalle?.indicaciones ? (
              <p className="hist-indicaciones">
                <strong>Indicaciones:</strong> {pedidoDetalle.indicaciones}
              </p>
            ) : null}
            {pedidoDetalle?.estado === 'pagado' ? (
              <p className="hist-pago-info">
                Pagado: ${(detalleState.detalle.monto_pagado ?? 0).toLocaleString('es-CO')}
                {detalleState.detalle.vuelto != null
                  ? ` · Vuelto: $${detalleState.detalle.vuelto.toLocaleString('es-CO')}`
                  : ''}
                {` · ${detalleState.detalle.es_transferencia ? 'Transfer' : 'Efectivo'}`}
              </p>
            ) : null}
            {accionAlert ? (
              <AlertError
                title={accionAlert.title}
                message={accionAlert.message}
                onClose={() => setAccionAlert(null)}
              />
            ) : null}
            {esEliminados ? (
              <div className="hist-acciones">
                <Button
                  className="btn-block"
                  disabled={restaurando}
                  onClick={() => void onRestaurar()}
                >
                  {restaurando ? 'Restaurando…' : 'Restaurar'}
                </Button>
              </div>
            ) : (
              <>
                <div className="hist-acciones">
                  <Button
                    className="btn-block"
                    onClick={() => {
                      if (detalleId !== null) {
                        navigate(`/historial/${detalleId}/editar`);
                      }
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    className="btn-block btn-danger-outline"
                    onClick={() => setConfirmEliminar(true)}
                  >
                    Eliminar
                  </Button>
                </div>
                {pedidoDetalle?.estado === 'pendiente' ? (
                  <Link to={`/cobro/${pedidoDetalle.id}`} className="btn-block-link">
                    <Button className="btn-block">Cobrar ahora</Button>
                  </Link>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={confirmEliminar && detalleId !== null}
        title="¿Eliminar pedido?"
        onClose={() => {
          if (!eliminando) setConfirmEliminar(false);
        }}
      >
        <p className="muted">
          {pedidoDetalle
            ? `${pedidoDetalle.nombre_cliente} · $${pedidoDetalle.total.toLocaleString('es-CO')}. `
            : ''}
          Dejará de verse en el historial y el balance. Podrás recuperarlo desde Eliminados.
        </p>
        {accionAlert ? (
          <AlertError
            title={accionAlert.title}
            message={accionAlert.message}
            onClose={() => setAccionAlert(null)}
          />
        ) : null}
        <div className="hist-acciones">
          <Button
            variant="secondary"
            className="btn-block"
            disabled={eliminando}
            onClick={() => setConfirmEliminar(false)}
          >
            Cancelar
          </Button>
          <Button
            className="btn-block btn-danger"
            disabled={eliminando}
            onClick={() => void onEliminar()}
          >
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </main>
  );
}
