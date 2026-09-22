import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { downloadBalanceExport, fetchBalance } from '../../shared/api/pedidosApi';
import type { BalanceVentas, PeriodoBalance } from '../../shared/api/types';
import {
  mensajeErrorUsuario,
  type ErrorAlertContent,
} from '../../shared/errors/mensajeErrorUsuario';
import { esBalanceVacio, nombreArchivoBalanceExport } from './balance.format';

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
  const [exportando, setExportando] = useState(false);
  const [actionAlert, setActionAlert] = useState<ErrorAlertContent | null>(null);
  const [loadAlertDismissed, setLoadAlertDismissed] = useState(false);

  function setPeriodo(next: PeriodoBalance) {
    setLoadAlertDismissed(false);
    setActionAlert(null);
    if (next === 'hoy') {
      setSearchParams({});
    } else {
      setSearchParams({ periodo: next });
    }
  }

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    setActionAlert(null);
    fetchBalance(periodo)
      .then((balance) => {
        if (!cancelled) {
          setState({ status: 'ok', balance });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const alert = mensajeErrorUsuario(error, 'No se pudo cargar el balance');
          setState({ status: 'error', message: alert.message });
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
    return esBalanceVacio(state.balance);
  }, [state]);

  async function exportarExcel() {
    if (state.status !== 'ok') {
      return;
    }
    setExportando(true);
    setActionAlert(null);
    try {
      await downloadBalanceExport(periodo, nombreArchivoBalanceExport(state.balance));
    } catch (error: unknown) {
      setActionAlert(mensajeErrorUsuario(error, 'No se pudo exportar el balance'));
    } finally {
      setExportando(false);
    }
  }

  return {
    state,
    periodo,
    setPeriodo,
    vacio,
    exportarExcel,
    exportando,
    actionAlert,
    clearActionAlert: () => setActionAlert(null),
    loadAlertDismissed,
    dismissLoadAlert: () => setLoadAlertDismissed(true),
  };
}
