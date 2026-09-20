import { create } from 'zustand';
import type { CartAdicion, CartItem } from '../../shared/api/types';

type AddItemInput = {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  base_id: number | null;
  base_nombre: string | null;
  salsa_ids: number[];
  salsa_nombres: string[];
  proteina_id: number | null;
  proteina_nombre: string | null;
  adiciones: CartAdicion[];
};

type PedidoState = {
  items: CartItem[];
  nombreCliente: string;
  addItem: (input: AddItemInput) => void;
  setCantidad: (key: string, cantidad: number) => void;
  setNombreCliente: (nombre: string) => void;
  clear: () => void;
  total: () => number;
  cantidadItems: () => number;
};

function lineTotal(item: CartItem): number {
  const extras = item.adiciones.reduce((sum: number, a: CartAdicion) => sum + a.precio, 0);
  return item.cantidad * (item.precio_unitario + extras);
}

export const usePedidoStore = create<PedidoState>((set, get) => ({
  items: [],
  nombreCliente: '',

  addItem(input) {
    const salsaKey = [...input.salsa_ids].sort((a, b) => a - b).join('-');
    const key = [
      input.producto_id,
      input.base_id,
      salsaKey,
      input.proteina_id ?? 'none',
      input.adiciones
        .map((a) => a.id)
        .sort((a, b) => a - b)
        .join('-'),
    ].join(':');

    set((state) => {
      const existing = state.items.find((item) => item.key === key);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.key === key ? { ...item, cantidad: item.cantidad + 1 } : item,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            key,
            ...input,
            cantidad: 1,
          },
        ],
      };
    });
  },

  setCantidad(key, cantidad) {
    set((state) => ({
      items:
        cantidad <= 0
          ? state.items.filter((item) => item.key !== key)
          : state.items.map((item) => (item.key === key ? { ...item, cantidad } : item)),
    }));
  },

  setNombreCliente(nombre) {
    set({ nombreCliente: nombre });
  },

  clear() {
    set({ items: [], nombreCliente: '' });
  },

  total() {
    return get().items.reduce((sum, item) => sum + lineTotal(item), 0);
  },

  cantidadItems() {
    return get().items.reduce((sum, item) => sum + item.cantidad, 0);
  },
}));

export function calcularLineTotal(item: CartItem): number {
  return lineTotal(item);
}
