import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchBalance } from '../../shared/api/pedidosApi';
import type { BalanceVentas, PeriodoBalance } from '../../shared/api/types';

type BalanceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; balance: BalanceVentas };

function parsePeriodo(value: string | null): PeriodoBalance {
  if (value === 'hoy' || value === 'semana' || value === 'mes') {
    return value;
  }
  return 'hoy';
}

export function useBalance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const periodo = parsePeriodo(searchParams.get('periodo'));
  const [state, setState] = useState<BalanceState>({ status: 'loading' });

  function setPeriodo(next: PeriodoBalance) {
    if (next === 'hoy') {
      setSearchParams({});
    } else {
      setSearchParams({ periodo: next });
    }
  }

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchBalance(periodo)
      .then((balance) => {
        if (!cancelled) {
          setState({ status: 'ok', balance });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'No se pudo cargar el balance',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [periodo]);

  const vacio = useMemo(() => {
    if (state.status !== 'ok') {
      return false;
    }
    const b = state.balance;
    return b.pedidos_pagados === 0 && b.pedidos_pendientes === 0;
  }, [state]);

  return { state, periodo, setPeriodo, vacio };
}
