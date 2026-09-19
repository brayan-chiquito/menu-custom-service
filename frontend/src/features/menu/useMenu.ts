import { useEffect, useState } from 'react';
import { fetchMenu } from '../../shared/api/menuApi';
import type { MenuResponse, Producto } from '../../shared/api/types';
import { usePedidoStore } from '../pedido-actual/pedidoStore';

type MenuState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; menu: MenuResponse };

export function useMenu() {
  const [state, setState] = useState<MenuState>({ status: 'loading' });
  const [selected, setSelected] = useState<Producto | null>(null);
  const addItem = usePedidoStore((s) => s.addItem);
  const cantidadItems = usePedidoStore((s) => s.cantidadItems());
  const total = usePedidoStore((s) => s.total());

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
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'No se pudo cargar el menú',
          });
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
  };
}
