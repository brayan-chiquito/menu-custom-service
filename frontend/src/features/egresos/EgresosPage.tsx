import { Link } from 'react-router-dom';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { useEgresos } from './useEgresos';
import type { PeriodoBalance } from '../../shared/api/types';

const PERIODOS: Array<[PeriodoBalance, string]> = [
  ['hoy', 'Hoy'],
  ['semana', 'Semana'],
  ['mes', 'Mes'],
];

function money(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

export function EgresosPage() {
  const {
    periodo,
    setPeriodo,
    state,
    vacio,
    nombre,
    setNombre,
    precio,
    setPrecio,
    cantidad,
    setCantidad,
    totalPreview,
    puedeGuardar,
    guardar,
    guardando,
    formAlert,
    clearFormAlert,
    loadAlertDismissed,
    dismissLoadAlert,
  } = useEgresos();

  return (
    <main className="page">
      <header className="page-header">
        <h1>Egresos</h1>
        <Link to="/balance" className="link-action">
          ← Balance
        </Link>
      </header>

      {formAlert ? (
        <AlertError
          title={formAlert.title}
          message={formAlert.message}
          onClose={clearFormAlert}
        />
      ) : null}

      {state.status === 'error' && !loadAlertDismissed ? (
        <AlertError
          title="No se pudieron cargar egresos"
          message={state.message}
          onClose={dismissLoadAlert}
        />
      ) : null}

      <section className="stack egreso-form">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Plátano"
        />
        <div className="egreso-form-row">
          <Input
            label="Precio unitario"
            inputMode="numeric"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="0"
          />
          <Input
            label="Cantidad"
            inputMode="numeric"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="1"
          />
        </div>
        <p className="muted">
          Total: <strong>{money(totalPreview)}</strong>
        </p>
        <Button disabled={!puedeGuardar} onClick={() => void guardar()}>
          {guardando ? 'Guardando…' : 'Registrar egreso'}
        </Button>
      </section>

      <div className="chip-row filters">
        {PERIODOS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`chip ${periodo === value ? 'chip-active' : ''}`}
            onClick={() => setPeriodo(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {state.status === 'loading' ? <p>Cargando…</p> : null}

      {state.status === 'ok' && vacio ? (
        <p className="muted">Sin egresos en este periodo</p>
      ) : null}

      {state.status === 'ok' && !vacio ? (
        <ul className="stack egreso-list">
          {state.egresos.map((e) => (
            <li key={e.id} className="line-card">
              <div className="line-card-footer">
                <div>
                  <h2>{e.nombre}</h2>
                  <p className="muted">
                    {money(e.precio)} × {e.cantidad}
                  </p>
                </div>
                <strong>{money(e.total)}</strong>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
