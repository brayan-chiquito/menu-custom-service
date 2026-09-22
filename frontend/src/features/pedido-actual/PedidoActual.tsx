import { Link } from 'react-router-dom';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { usePedidoActual } from './usePedidoActual';

export function PedidoActual() {
  const {
    items,
    nombreCliente,
    indicacionesActivas,
    indicaciones,
    total,
    setCantidad,
    setNombreCliente,
    setIndicacionesActivas,
    setIndicaciones,
    lineTotal,
    vacio,
    guardarSinPagar,
    guardando,
    errorAlert,
    clearErrorAlert,
  } = usePedidoActual();

  if (vacio) {
    return (
      <main className="page">
        <header className="page-header">
          <h1>Resumen</h1>
          <Link to="/" className="link-action">
            ← Menú
          </Link>
        </header>
        <div className="empty-state">
          <p>Aún no hay productos.</p>
          <Link to="/">
            <Button>Volver al menú</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Resumen</h1>
        <Link to="/" className="link-action">
          ← Menú
        </Link>
      </header>

      {errorAlert ? (
        <AlertError
          title={errorAlert.title}
          message={errorAlert.message}
          onClose={clearErrorAlert}
        />
      ) : null}

      <section className="stack">
        {items.map((item) => (
          <article key={item.key} className="line-card">
            <h2>{item.nombre}</h2>
            <p className="muted">
              {[
                item.base_nombre,
                item.salsa_nombres.length > 0 ? item.salsa_nombres.join(', ') : null,
                item.proteina_nombre,
                item.adiciones.length > 0
                  ? item.adiciones.map((a: { nombre: string }) => a.nombre).join(', ')
                  : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Sin extras'}
            </p>
            <div className="line-card-footer">
              <div className="qty">
                <Button
                  variant="secondary"
                  className="btn-icon"
                  onClick={() => setCantidad(item.key, item.cantidad - 1)}
                  aria-label="Quitar uno"
                >
                  −
                </Button>
                <span>{item.cantidad}</span>
                <Button
                  className="btn-icon"
                  onClick={() => setCantidad(item.key, item.cantidad + 1)}
                  aria-label="Agregar uno"
                >
                  +
                </Button>
              </div>
              <strong>${lineTotal(item).toLocaleString('es-CO')}</strong>
            </div>
          </article>
        ))}

        <Input
          label="Nombre del cliente (opcional)"
          placeholder="Sin nombre"
          value={nombreCliente}
          onChange={(event) => setNombreCliente(event.target.value)}
        />

        <label className="check-row check-row-start">
          <input
            type="checkbox"
            checked={indicacionesActivas}
            onChange={(e) => setIndicacionesActivas(e.target.checked)}
          />
          <span className="check-box" aria-hidden />
          <span>Indicaciones especiales</span>
        </label>
        <p className="muted">
          Actívalo si el cliente pide algo especial (ej. sin un ingrediente). Se envía en el
          WhatsApp del pedido.
        </p>
        {indicacionesActivas ? (
          <label className="field">
            <span className="field-label">Indicaciones</span>
            <textarea
              className="field-input field-textarea"
              rows={3}
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              placeholder="Ej. Sin chicharrón, agregar maíz…"
            />
          </label>
        ) : null}
      </section>

      <footer className="page-footer">
        <div className="total-row">
          <span>Total</span>
          <strong>${total.toLocaleString('es-CO')}</strong>
        </div>
        <Link to="/cobro">
          <Button disabled={guardando}>Ir a cobrar</Button>
        </Link>
        <Button
          variant="secondary"
          disabled={guardando}
          onClick={() => void guardarSinPagar()}
        >
          {guardando ? 'Guardando…' : 'Guardar sin pagar'}
        </Button>
      </footer>
    </main>
  );
}
