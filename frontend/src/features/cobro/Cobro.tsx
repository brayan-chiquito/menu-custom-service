import { Link } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { useCobro } from './useCobro';

export function Cobro() {
  const {
    total,
    montoRecibido,
    setMontoRecibido,
    resumenVuelto,
    puedeConfirmar,
    phase,
    copiado,
    confirmarPago,
    copiarPedido,
    nuevoPedido,
    vacio,
    modoPendiente,
    contexto,
    backTo,
    backLabel,
  } = useCobro();

  if (phase.status === 'loading') {
    return (
      <main className="page cobro-page">
        <p>Cargando pedido…</p>
      </main>
    );
  }

  if (vacio) {
    return (
      <main className="page">
        <div className="empty-state">
          <p>No hay pedido para cobrar.</p>
          <Link to="/">
            <Button>Ir al menú</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (phase.status === 'done') {
    return (
      <main className="page cobro-page">
        <h1 className="cobro-title">Pedido pagado</h1>
        <div className={`banner ${phase.notificacion.enviada ? 'banner-ok' : 'banner-error'}`}>
          <strong>
            {phase.notificacion.enviada ? 'WhatsApp: enviado' : 'WhatsApp: no enviado'}
          </strong>
          {!phase.notificacion.enviada ? (
            <p>El pedido sigue pagado. Copia el mensaje y envíalo a mano.</p>
          ) : null}
        </div>
        {!phase.notificacion.enviada ? (
          <Button variant="secondary" onClick={() => void copiarPedido()}>
            {copiado ? 'Copiado' : 'Copiar pedido'}
          </Button>
        ) : null}
        <Button onClick={nuevoPedido}>Nuevo pedido</Button>
      </main>
    );
  }

  return (
    <main className="page cobro-page">
      <header className="page-header">
        <h1>Cobro</h1>
        <Link to={backTo} className="link-action">
          {backLabel}
        </Link>
      </header>

      {contexto ? <p className="muted">{contexto}</p> : null}

      <p className="muted">Total a cobrar</p>
      <p className="cobro-total">${total.toLocaleString('es-CO')}</p>

      <Input
        label="Monto recibido"
        inputMode="numeric"
        value={montoRecibido}
        onChange={(event) => setMontoRecibido(event.target.value)}
        placeholder="0"
      />

      <p className="muted vuelto-label">Vuelto</p>
      <div className="vuelto-box">
        <strong>{resumenVuelto}</strong>
      </div>

      {phase.status === 'error' ? <p className="error">{phase.message}</p> : null}

      <Button disabled={!puedeConfirmar} onClick={() => void confirmarPago()}>
        {phase.status === 'submitting' ? 'Confirmando…' : 'Confirmar pago'}
      </Button>
    </main>
  );
}
