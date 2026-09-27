import { Link } from 'react-router-dom';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { useWhatsapp } from './useWhatsapp';

export function WhatsappPage() {
  const {
    state,
    nuevoNumero,
    setNuevoNumero,
    busy,
    actionError,
    clearActionError,
    agregarDestino,
    quitarDestino,
    reintentar,
  } = useWhatsapp();

  return (
    <main className="page">
      <header className="page-header">
        <h1>WhatsApp</h1>
        <Link to="/ajustes" className="link-action">
          ← Ajustes
        </Link>
      </header>

      {actionError ? (
        <AlertError title="Error" message={actionError} onClose={clearActionError} />
      ) : null}

      {state.status === 'loading' ? <p>Cargando…</p> : null}

      {state.status === 'error' ? (
        <>
          <AlertError title="Error" message={state.message} onClose={reintentar} />
          <Button onClick={reintentar}>Reintentar</Button>
        </>
      ) : null}

      {state.status === 'ok' ? (
        <section className="stack">
          <p>
            <span
              className={state.estado.activa ? 'wa-status-ok' : 'wa-status-bad'}
            >
              {state.estado.activa ? 'Activa' : 'No activa'}
            </span>
          </p>

          {!state.estado.activa && state.estado.qr ? (
            <div className="qr-box">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(state.estado.qr)}`}
                alt="QR"
                width={200}
                height={200}
              />
            </div>
          ) : null}

          <h2 className="section-title">Destinos</h2>

          {state.destinos.length === 0 ? (
            <p className="muted">Sin números</p>
          ) : (
            <ul className="stack">
              {state.destinos.map((d) => (
                <li key={d.id} className="line-card">
                  <div className="line-card-footer">
                    <strong>{d.numero}</strong>
                    <Button
                      variant="ghost"
                      className="link-danger"
                      disabled={busy}
                      onClick={() => void quitarDestino(d.id)}
                    >
                      Quitar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Input
            label="Nuevo número"
            name="numero"
            inputMode="numeric"
            placeholder="573001112233"
            value={nuevoNumero}
            onChange={(e) => setNuevoNumero(e.target.value)}
          />
          <Button
            disabled={busy || nuevoNumero.trim() === ''}
            onClick={() => void agregarDestino()}
          >
            Agregar
          </Button>
        </section>
      ) : null}
    </main>
  );
}
