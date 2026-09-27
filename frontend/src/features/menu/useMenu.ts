import { useEffect, useState } from 'react';
import { fetchMenu } from '../../shared/api/menuApi';
import type { MenuResponse, Producto } from '../../shared/api/types';
import { mensajeErrorUsuario } from '../../shared/errors/mensajeErrorUsuario';
import { usePedidoStore } from '../pedido-actual/pedidoStore';

type MenuState =
  | { status: 'loading' }
  | { status: 'error'; title: string; message: string }
  | { status: 'ok'; menu: MenuResponse };

export function useMenu() {
  const [state, setState] = useState<MenuState>({ status: 'loading' });
  const [selected, setSelected] = useState<Producto | null>(null);
  const addItem = usePedidoStore((s) => s.addItem);
  const cantidadItems = usePedidoStore((s) => s.cantidadItems());
  const total = usePedidoStore((s) => s.total());

  function cargar() {
    setState({ status: 'loading' });
    return fetchMenu()
      .then((menu) => {
        setState({ status: 'ok', menu });
      })
      .catch((error: unknown) => {
        const alert = mensajeErrorUsuario(error, 'No se pudo cargar el menú');
        setState({ status: 'error', title: alert.title, message: alert.message });
      });
  }

  useEffect(() => {
    let cancelled = false;
    fetchMenu()
      .then((menu) => {
        if (!cancelled) {
          setState({ status: 'ok', menu });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const alert = mensajeErrorUsuario(error, 'No se pudo cargar el menú');
          setState({ status: 'error', title: alert.title, message: alert.message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    state,
    selected,
    openProducto: setSelected,
    closeProducto: () => setSelected(null),
    addItem,
    cantidadItems,
    total,
    reintentar: () => void cargar(),
  };
}
