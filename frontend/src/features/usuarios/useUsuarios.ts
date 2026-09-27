import { useCallback, useEffect, useState } from 'react';
import { fetchUsuarios } from '../../shared/api/usuariosApi';
import type { UsuarioAdmin } from '../../shared/api/authTypes';
import { mensajeErrorUsuario } from '../../shared/errors/mensajeErrorUsuario';

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; usuarios: UsuarioAdmin[] };

export function useUsuarios() {
  const [state, setState] = useState<ListState>({ status: 'loading' });

  const cargar = useCallback(async () => {
    try {
      const usuarios = await fetchUsuarios();
      setState({ status: 'ok', usuarios });
    } catch (err: unknown) {
      setState({
        status: 'error',
        message: mensajeErrorUsuario(err, 'No se pudo cargar usuarios').message,
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
