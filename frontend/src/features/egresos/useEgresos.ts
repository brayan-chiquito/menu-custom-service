import { useEffect, useMemo, useState } from 'react';
import { crearEgreso, fetchEgresos } from '../../shared/api/egresosApi';
import { calcularTotalEgreso } from './egresos.calc';
import type { Egreso, PeriodoBalance } from '../../shared/api/types';
import {
  mensajeErrorUsuario,
  type ErrorAlertContent,
} from '../../shared/errors/mensajeErrorUsuario';

type EgresosState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; egresos: Egreso[] };

export function useEgresos() {
  const [periodo, setPeriodoState] = useState<PeriodoBalance>('hoy');
  const [state, setState] = useState<EgresosState>({ status: 'loading' });
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [guardando, setGuardando] = useState(false);
  const [formAlert, setFormAlert] = useState<ErrorAlertContent | null>(null);
  const [loadAlertDismissed, setLoadAlertDismissed] = useState(false);

  function setPeriodo(next: PeriodoBalance) {
    setLoadAlertDismissed(false);
    setPeriodoState(next);
  }

  function reload(nextPeriodo: PeriodoBalance = periodo) {
    setState({ status: 'loading' });
    fetchEgresos(nextPeriodo)
      .then((egresos) => setState({ status: 'ok', egresos }))
      .catch((error: unknown) => {
        const alert = mensajeErrorUsuario(error, 'No se pudieron cargar egresos');
        setState({ status: 'error', message: alert.message });
      });
  }

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchEgresos(periodo)
      .then((egresos) => {
        if (!cancelled) {
          setState({ status: 'ok', egresos });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const alert = mensajeErrorUsuario(error, 'No se pudieron cargar egresos');
          setState({ status: 'error', message: alert.message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [periodo]);

  const precioNum = Number(precio.replace(/\D/g, '')) || 0;
  const cantidadNum = Number(cantidad.replace(/\D/g, '')) || 0;
  const totalPreview = calcularTotalEgreso(precioNum, cantidadNum);
  const puedeGuardar =
    nombre.trim() !== '' && precioNum >= 0 && cantidadNum > 0 && !guardando;

  async function guardar() {
    if (!puedeGuardar) {
      return;
    }
    setGuardando(true);
    setFormAlert(null);
    try {
      await crearEgreso({
        nombre: nombre.trim(),
        precio: precioNum,
        cantidad: cantidadNum,
      });
      setNombre('');
      setPrecio('');
      setCantidad('1');
      reload('hoy');
      setPeriodoState('hoy');
    } catch (error: unknown) {
      setFormAlert(mensajeErrorUsuario(error, 'No se pudo registrar el egreso'));
    } finally {
      setGuardando(false);
    }
  }

  const vacio = useMemo(
    () => state.status === 'ok' && state.egresos.length === 0,
    [state],
  );

  return {
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
    clearFormAlert: () => setFormAlert(null),
    loadAlertDismissed,
    dismissLoadAlert: () => setLoadAlertDismissed(true),
  };
}
