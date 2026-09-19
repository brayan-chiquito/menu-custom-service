import { Link } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { usePedidoActual } from './usePedidoActual';

export function PedidoActual() {
  const {
    items,
    nombreCliente,
    total,
    setCantidad,
    setNombreCliente,
    lineTotal,
    vacio,
    guardarSinPagar,
    guardando,
    errorGuardar,
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
      </section>

      <footer className="page-footer">
        <div className="total-row">
          <span>Total</span>
          <strong>${total.toLocaleString('es-CO')}</strong>
        </div>
        {errorGuardar ? <p className="error">{errorGuardar}</p> : null}
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
