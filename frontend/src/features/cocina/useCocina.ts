import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cocinaStreamUrl,
  fetchCocinaCola,
  fetchCocinaStreamTicket,
  prepararPedido,
} from '../../shared/api/cocinaApi';
import type { CocinaPedido } from '../../shared/api/authTypes';
import { mensajeErrorUsuario } from '../../shared/errors/mensajeErrorUsuario';
import { useAuthStore } from '../auth/authStore';

type CocinaState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; pedidos: CocinaPedido[] };

export function useCocina() {
  const usuarioId = useAuthStore((s) => s.usuario?.id);
  const [state, setState] = useState<CocinaState>({ status: 'loading' });
  const [marcandoId, setMarcandoId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const pedidos = await fetchCocinaCola();
      setState({ status: 'ok', pedidos });
    } catch (err: unknown) {
      setState({
        status: 'error',
        message: mensajeErrorUsuario(err, 'No se pudo cargar la cocina').message,
      });
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!usuarioId) return;

    let es: EventSource | null = null;
    let cancelled = false;
    let renewTimer: ReturnType<typeof setTimeout> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const clearTimers = () => {
      if (renewTimer) {
        clearTimeout(renewTimer);
        renewTimer = null;
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    async function connect() {
      if (cancelled) return;
      clearTimers();
      try {
        const { ticket, expiresIn } = await fetchCocinaStreamTicket();
        if (cancelled) return;
        es?.close();
        es = new EventSource(cocinaStreamUrl(ticket));
        es.onmessage = () => {
          void cargar();
        };
        es.onerror = () => {
          // Ticket inválido / backend reiniciado: cerrar y pedir ticket nuevo.
          es?.close();
          es = null;
          if (cancelled) return;
          retryTimer = setTimeout(() => {
            void connect();
          }, 3_000);
        };
        // Renovar ticket antes de que caduque (EventSource reusa la URL)
        const renewMs = Math.max(15_000, (expiresIn - 20) * 1000);
        renewTimer = setTimeout(() => {
          void connect();
        }, renewMs);
      } catch {
        if (cancelled) return;
        retryTimer = setTimeout(() => {
          void connect();
        }, 5_000);
      }
    }

    void connect();

    return () => {
      cancelled = true;
      clearTimers();
      es?.close();
    };
  }, [usuarioId, cargar]);

  const marcandoRef = useRef(false);

  async function marcarListo(id: number) {
    if (marcandoRef.current) return;
    marcandoRef.current = true;
    setMarcandoId(id);
    setActionError(null);
    try {
      await prepararPedido(id);
      await cargar();
    } catch (err: unknown) {
      setActionError(mensajeErrorUsuario(err, 'No se pudo marcar listo').message);
    } finally {
      marcandoRef.current = false;
      setMarcandoId(null);
    }
  }

  return {
    state,
    marcandoId,
    actionError,
    clearActionError: () => setActionError(null),
    marcarListo,
    reintentar: () => {
      setState({ status: 'loading' });
      void cargar();
    },
  };
}
