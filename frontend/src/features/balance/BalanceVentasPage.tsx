import { Link } from 'react-router-dom';
import { AlertError } from '../../shared/components/AlertError';
import { Button } from '../../shared/components/Button';
import { formatearRangoBalance } from './balance.format';
import { useBalance } from './useBalance';
import type { PeriodoBalance } from '../../shared/api/types';

const PERIODOS: Array<[PeriodoBalance, string]> = [
  ['hoy', 'Hoy'],
  ['semana', 'Semana'],
  ['mes', 'Mes'],
];

function money(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

export function BalanceVentasPage() {
  const {
    state,
    periodo,
    setPeriodo,
    vacio,
    exportarExcel,
    exportando,
    actionAlert,
    clearActionAlert,
    loadAlertDismissed,
    dismissLoadAlert,
  } = useBalance();

  return (
    <main className="page page-balance">
      <div className="balance-main">
        <header className="page-header">
          <h1>Balance</h1>
          <div className="header-nav">
            <Link to="/egresos" className="link-action">
              Egresos
            </Link>
            <Link to="/historial" className="link-action">
              ← Historial
            </Link>
          </div>
        </header>

        {state.status === 'error' && !loadAlertDismissed ? (
          <AlertError
            title="No se pudo cargar el balance"
            message={state.message}
            onClose={dismissLoadAlert}
          />
        ) : null}

        {actionAlert ? (
          <AlertError
            title={actionAlert.title}
            message={actionAlert.message}
            onClose={clearActionAlert}
          />
        ) : null}

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

        {state.status === 'ok' ? (
          <p className="muted balance-rango">{formatearRangoBalance(state.balance)}</p>
        ) : (
          <p className="muted balance-rango">&nbsp;</p>
        )}

        {state.status === 'loading' ? <p>Cargando…</p> : null}

        {state.status === 'ok' && vacio ? (
          <div className="empty-state">
            <p>Sin movimientos en este periodo</p>
            <p className="muted">Cuando cobres pedidos o registres egresos, aparecerán aquí</p>
            <Link to="/">
              <Button>Ir al menú</Button>
            </Link>
          </div>
        ) : null}

        {state.status === 'ok' && !vacio ? (
          <section className="balance-stack">
            <article className="balance-hero">
              <span className="balance-label">Ventas (cobrado)</span>
              <strong className="balance-hero-amount">{money(state.balance.cobrado)}</strong>
            </article>

            <div className="balance-metrics">
              <article className="balance-card">
                <span className="balance-label">Efectivo</span>
                <strong>{money(state.balance.cobrado_efectivo)}</strong>
                <span className="muted">
                  {state.balance.pedidos_efectivo}{' '}
                  {state.balance.pedidos_efectivo === 1 ? 'pedido' : 'pedidos'}
                </span>
              </article>
              <article className="balance-card">
                <span className="balance-label">Transferencia</span>
                <strong>{money(state.balance.cobrado_transferencia)}</strong>
                <span className="muted">
                  {state.balance.pedidos_transferencia}{' '}
                  {state.balance.pedidos_transferencia === 1 ? 'pedido' : 'pedidos'}
                </span>
              </article>
            </div>

            <article className="balance-card">
              <span className="balance-label">Gastos</span>
              <strong>{money(state.balance.gastos)}</strong>
            </article>

            <article className="balance-hero balance-ganancia">
              <span className="balance-label">Ganancia</span>
              <strong className="balance-hero-amount">{money(state.balance.ganancia)}</strong>
            </article>

            <div className="balance-metrics">
              <article className="balance-card">
                <span className="balance-label">Pedidos pagados</span>
                <strong>{state.balance.pedidos_pagados}</strong>
              </article>
              <article className="balance-card">
                <span className="balance-label">Ticket promedio</span>
                <strong>{money(state.balance.ticket_promedio)}</strong>
              </article>
            </div>

            {state.balance.pendiente > 0 ? (
              <article className="balance-pendiente">
                <span className="balance-label">Pendiente por cobrar</span>
                <strong>
                  {money(state.balance.pendiente)} · {state.balance.pedidos_pendientes}{' '}
                  {state.balance.pedidos_pendientes === 1 ? 'pedido' : 'pedidos'}
                </strong>
              </article>
            ) : (
              <p className="muted">Sin pendientes</p>
            )}
          </section>
        ) : null}
      </div>

      <footer className="balance-export-footer">
        <Button
          disabled={state.status !== 'ok' || exportando}
          onClick={() => void exportarExcel()}
        >
          {exportando ? 'Exportando…' : 'Exportar Excel'}
        </Button>
        <p className="muted balance-export-hint">
          Exporta el periodo seleccionado (Hoy, Semana o Mes) con filtros listos
        </p>
      </footer>
    </main>
  );
}
