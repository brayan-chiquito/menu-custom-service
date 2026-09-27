import { useCallback, useEffect, useState } from 'react';
import { fetchAuditoria } from '../../shared/api/auditoriaApi';
import type { AuditoriaEntry } from '../../shared/api/authTypes';
import { mensajeErrorUsuario } from '../../shared/errors/mensajeErrorUsuario';

type SegState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; items: AuditoriaEntry[]; total: number };

export function useSeguimiento() {
  const [state, setState] = useState<SegState>({ status: 'loading' });

  const cargar = useCallback(async () => {
    try {
      const res = await fetchAuditoria({ limit: 50, offset: 0 });
      setState({ status: 'ok', items: res.items, total: res.total });
    } catch (err: unknown) {
      setState({
        status: 'error',
        message: mensajeErrorUsuario(err, 'No se pudo cargar el seguimiento').message,
      });
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return {
    state,
    reintentar: () => {
      setState({ status: 'loading' });
      void cargar();
    },
  };
}
