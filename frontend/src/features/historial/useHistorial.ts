import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPedidoById, fetchPedidos } from '../../shared/api/pedidosApi';
import type { PedidoDetalle, PedidoResumen } from '../../shared/api/types';
import { mensajeErrorUsuario } from '../../shared/errors/mensajeErrorUsuario';

type Filtro = 'todos' | 'pendiente' | 'pagado' | 'eliminados';

type HistorialState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; pedidos: PedidoResumen[]; hasMore: boolean; total: number };

type DetalleCache = Record<
  number,
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; detalle: PedidoDetalle }
>;

const PAGE_SIZE = 10;

function parseFiltro(value: string | null): Filtro {
  if (value === 'pendiente' || value === 'pagado' || value === 'todos' || value === 'eliminados') {
    return value;
  }
  return 'todos';
}

export function useHistorial() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<HistorialState>({ status: 'loading' });
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [detalles, setDetalles] = useState<DetalleCache>({});
  const [cargandoMas, setCargandoMas] = useState(false);
  const filtro = parseFiltro(searchParams.get('filtro'));

  function setFiltro(next: Filtro) {
    if (next === 'todos') {
      setSearchParams({});
    } else {
      setSearchParams({ filtro: next });
    }
  }

  const estadoApi = filtro === 'todos' || filtro === 'eliminados' ? undefined : filtro;
  const eliminadosApi = filtro === 'eliminados';

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchPedidos({
      limit: PAGE_SIZE,
      offset: 0,
      estado: estadoApi,
      eliminados: eliminadosApi,
    })
      .then((res) => {
        if (!cancelled) {
          setState({
            status: 'ok',
            pedidos: res.items,
            hasMore: res.has_more,
            total: res.total,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: mensajeErrorUsuario(error, 'No se pudo cargar el historial').message,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [estadoApi, eliminadosApi]);

  async function cargarMas() {
    if (state.status !== 'ok' || !state.hasMore || cargandoMas) {
      return;
    }
    setCargandoMas(true);
    try {
      const res = await fetchPedidos({
        limit: PAGE_SIZE,
        offset: state.pedidos.length,
        estado: estadoApi,
        eliminados: eliminadosApi,
      });
      setState({
        status: 'ok',
        pedidos: [...state.pedidos, ...res.items],
        hasMore: res.has_more,
        total: res.total,
      });
    } catch (error: unknown) {
      setState({
        status: 'error',
        message: mensajeErrorUsuario(error, 'No se pudo cargar más pedidos').message,
      });
    } finally {
      setCargandoMas(false);
    }
  }

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
          message: mensajeErrorUsuario(error, 'No se pudo cargar el detalle').message,
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

  function quitarPedidoLocal(id: number) {
    setState((prev) => {
      if (prev.status !== 'ok') return prev;
      return {
        ...prev,
        pedidos: prev.pedidos.filter((p) => p.id !== id),
        total: Math.max(0, prev.total - 1),
      };
    });
    setDetalles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  const pedidoDetalle = useMemo(() => {
    if (detalleId === null) {
      return null;
    }
    const cached = detalles[detalleId];
    if (cached?.status === 'ok') {
      return cached.detalle;
    }
    if (state.status === 'ok') {
      return state.pedidos.find((p) => p.id === detalleId) ?? null;
    }
    return null;
  }, [detalleId, state, detalles]);

  return {
    state,
    filtro,
    setFiltro,
    pedidos: state.status === 'ok' ? state.pedidos : [],
    hasMore: state.status === 'ok' ? state.hasMore : false,
    cargarMas,
    cargandoMas,
    detalleId,
    abrirDetalle,
    cerrarDetalle,
    detalles,
    pedidoDetalle,
    quitarPedidoLocal,
  };
}
