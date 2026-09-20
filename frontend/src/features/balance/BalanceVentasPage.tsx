import { Link } from 'react-router-dom';
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
  const { state, periodo, setPeriodo, vacio } = useBalance();

  return (
    <main className="page page-balance">
      <header className="page-header">
        <h1>Balance</h1>
        <Link to="/historial" className="link-action">
          ← Historial
        </Link>
      </header>

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
      {state.status === 'error' ? <p className="error">{state.message}</p> : null}

      {state.status === 'ok' && vacio ? (
        <div className="empty-state">
          <p>Sin ventas en este periodo</p>
          <p className="muted">Cuando cobres pedidos, el total aparecerá aquí</p>
          <Link to="/">
            <Button>Ir al menú</Button>
          </Link>
        </div>
      ) : null}

      {state.status === 'ok' && !vacio ? (
        <section className="balance-stack">
          <article className="balance-hero">
            <span className="balance-label">Cobrado</span>
            <strong className="balance-hero-amount">{money(state.balance.cobrado)}</strong>
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
    </main>
  );
}
