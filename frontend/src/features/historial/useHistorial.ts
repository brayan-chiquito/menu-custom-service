import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPedidoById, fetchPedidosHoy } from '../../shared/api/pedidosApi';
import type { PedidoDetalle, PedidoResumen } from '../../shared/api/types';

type Filtro = 'todos' | 'pendiente' | 'pagado';

type HistorialState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; pedidos: PedidoResumen[] };

type DetalleCache = Record<
  number,
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; detalle: PedidoDetalle }
>;

function parseFiltro(value: string | null): Filtro {
  if (value === 'pendiente' || value === 'pagado' || value === 'todos') {
    return value;
  }
  return 'todos';
}

export function useHistorial() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<HistorialState>({ status: 'loading' });
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [detalles, setDetalles] = useState<DetalleCache>({});
  const filtro = parseFiltro(searchParams.get('filtro'));

  function setFiltro(next: Filtro) {
    if (next === 'todos') {
      setSearchParams({});
    } else {
      setSearchParams({ filtro: next });
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchPedidosHoy()
      .then((pedidos) => {
        if (!cancelled) {
          setState({ status: 'ok', pedidos });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'No se pudo cargar el historial',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtrados = useMemo(() => {
    if (state.status !== 'ok') {
      return [];
    }
    if (filtro === 'todos') {
      return state.pedidos;
    }
    return state.pedidos.filter((pedido) => pedido.estado === filtro);
  }, [state, filtro]);

  const cargarDetalle = useCallback(async (id: number) => {
    setDetalles((prev) => ({ ...prev, [id]: { status: 'loading' } }));
    try {
      const detalle = await fetchPedidoById(id);
      setDetalles((prev) => ({ ...prev, [id]: { status: 'ok', detalle } }));
    } catch (error: unknown) {
      setDetalles((prev) => ({
        ...prev,
        [id]: {
          status: 'error',
          message: error instanceof Error ? error.message : 'No se pudo cargar el detalle',
        },
      }));
    }
  }, []);

  function abrirDetalle(id: number) {
    setDetalleId(id);
    if (detalles[id]?.status !== 'ok') {
      void cargarDetalle(id);
    }
  }

  function cerrarDetalle() {
    setDetalleId(null);
  }

  const pedidoDetalle = useMemo(() => {
    if (detalleId === null || state.status !== 'ok') {
      return null;
    }
    return state.pedidos.find((p) => p.id === detalleId) ?? null;
  }, [detalleId, state]);

  return {
    state,
    filtro,
    setFiltro,
    filtrados,
    detalleId,
    abrirDetalle,
    cerrarDetalle,
    detalles,
    pedidoDetalle,
  };
}
