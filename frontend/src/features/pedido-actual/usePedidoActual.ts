import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearPedido } from '../../shared/api/pedidosApi';
import { calcularLineTotal, usePedidoStore } from './pedidoStore';

export function usePedidoActual() {
  const navigate = useNavigate();
  const items = usePedidoStore((s) => s.items);
  const nombreCliente = usePedidoStore((s) => s.nombreCliente);
  const setCantidad = usePedidoStore((s) => s.setCantidad);
  const setNombreCliente = usePedidoStore((s) => s.setNombreCliente);
  const clear = usePedidoStore((s) => s.clear);
  const total = usePedidoStore((s) => s.total());

  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  async function guardarSinPagar() {
    if (items.length === 0 || guardando) {
      return;
    }

    setGuardando(true);
    setErrorGuardar(null);
    try {
      await crearPedido({
        nombre_cliente: nombreCliente.trim() === '' ? null : nombreCliente.trim(),
        items: items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          base_id: item.base_id,
          salsa_ids: item.salsa_ids,
          proteina_id: item.proteina_id,
          adiciones: item.adiciones.map((a) => a.id),
        })),
      });
      clear();
      navigate('/historial?filtro=pendiente');
    } catch (error: unknown) {
      setErrorGuardar(
        error instanceof Error ? error.message : 'No se pudo guardar el pedido',
      );
    } finally {
      setGuardando(false);
    }
  }

  return {
    items,
    nombreCliente,
    total,
    setCantidad,
    setNombreCliente,
    lineTotal: calcularLineTotal,
    vacio: items.length === 0,
    guardarSinPagar,
    guardando,
    errorGuardar,
  };
}
