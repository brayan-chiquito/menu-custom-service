import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { useCobro } from './useCobro';

const REDIRECT_SECONDS = 4;

export function Cobro() {
  const {
    total,
    montoRecibido,
    setMontoRecibido,
    esTransferencia,
    setTransferencia,
    resumenVuelto,
    puedeConfirmar,
    phase,
    confirmarPago,
    nuevoPedido,
    clearErrorAlert,
    vacio,
    contexto,
    backTo,
    backLabel,
  } = useCobro();

  const [segundosRestantes, setSegundosRestantes] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (phase.status !== 'done') {
      setSegundosRestantes(REDIRECT_SECONDS);
      return;
    }

    setSegundosRestantes(REDIRECT_SECONDS);
    const interval = window.setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timer = window.setTimeout(() => {
      nuevoPedido();
    }, REDIRECT_SECONDS * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [phase.status, nuevoPedido]);

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
      <main className="page cobro-page cobro-done">
        <h1 className="cobro-title">Pedido pagado</h1>
        <Button onClick={nuevoPedido}>Nuevo pedido</Button>
        <div className="cobro-success" aria-hidden>
          <div className="cobro-success-circle">
            <span className="cobro-success-check">✓</span>
          </div>
          <p className="muted cobro-success-hint">
            Volviendo al menú en {segundosRestantes}s…
          </p>
        </div>
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

      {phase.status === 'error' ? (
        <AlertError
          title={phase.alert.title}
          message={phase.alert.message}
          onClose={clearErrorAlert}
        />
      ) : null}

      <div className="cobro-focus">
        {contexto ? <p className="muted">{contexto}</p> : null}

        <p className="muted">Total a cobrar</p>
        <p className="cobro-total">${total.toLocaleString('es-CO')}</p>

        <Input
          label="Monto recibido"
          inputMode="numeric"
          value={esTransferencia ? String(total) : montoRecibido}
          onChange={(event) => setMontoRecibido(event.target.value)}
          placeholder="0"
          disabled={esTransferencia}
          readOnly={esTransferencia}
        />

        <label className="check-row">
          <input
            type="checkbox"
            checked={esTransferencia}
            onChange={(event) => setTransferencia(event.target.checked)}
          />
          <span className="check-box" aria-hidden />
          <span>Transferencia</span>
        </label>

        <p className="muted vuelto-label">Vuelto</p>
        <div className="vuelto-box">
          <strong>{resumenVuelto}</strong>
        </div>

        <Button disabled={!puedeConfirmar} onClick={() => void confirmarPago()}>
          {phase.status === 'submitting' ? 'Confirmando…' : 'Confirmar pago'}
        </Button>
      </div>
    </main>
  );
}
