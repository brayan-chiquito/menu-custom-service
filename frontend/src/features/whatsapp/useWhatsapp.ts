import { useCallback, useEffect, useState } from 'react';
import {
  crearWhatsappDestino,
  eliminarWhatsappDestino,
  fetchWhatsappDestinos,
  fetchWhatsappEstado,
} from '../../shared/api/whatsappApi';
import type { WhatsappDestino, WhatsappEstado } from '../../shared/api/authTypes';
import { mensajeErrorUsuario } from '../../shared/errors/mensajeErrorUsuario';

const POLL_MS = 4000;

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ok';
      estado: WhatsappEstado;
      destinos: WhatsappDestino[];
    };

export function useWhatsapp() {
  const [state, setState] = useState<PageState>({ status: 'loading' });
  const [nuevoNumero, setNuevoNumero] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const cargar = useCallback(async (silent = false) => {
    if (!silent) {
      setState((prev) => (prev.status === 'ok' ? prev : { status: 'loading' }));
    }
    try {
      const [estado, destinos] = await Promise.all([
        fetchWhatsappEstado(),
        fetchWhatsappDestinos(),
      ]);
      setState({ status: 'ok', estado, destinos });
    } catch (err: unknown) {
      if (!silent) {
        setState({
          status: 'error',
          message: mensajeErrorUsuario(err, 'No se pudo cargar WhatsApp').message,
        });
      }
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (state.status !== 'ok' || state.estado.activa) {
      return;
    }
    const id = window.setInterval(() => {
      void cargar(true);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [state, cargar]);

  async function agregarDestino() {
    const numero = nuevoNumero.trim();
    if (!numero || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await crearWhatsappDestino(numero);
      setNuevoNumero('');
      await cargar(true);
    } catch (err: unknown) {
      setActionError(mensajeErrorUsuario(err, 'No se pudo agregar').message);
    } finally {
      setBusy(false);
    }
  }

  async function quitarDestino(id: number) {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await eliminarWhatsappDestino(id);
      await cargar(true);
    } catch (err: unknown) {
      setActionError(mensajeErrorUsuario(err, 'No se pudo quitar').message);
    } finally {
      setBusy(false);
    }
  }

  return {
    state,
    nuevoNumero,
    setNuevoNumero,
    busy,
    actionError,
    clearActionError: () => setActionError(null),
    agregarDestino,
    quitarDestino,
    reintentar: () => void cargar(),
  };
}
