import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearPedido } from '../../shared/api/pedidosApi';
import {
  mensajeErrorUsuario,
  type ErrorAlertContent,
} from '../../shared/errors/mensajeErrorUsuario';
import { calcularLineTotal, usePedidoStore } from './pedidoStore';

export function usePedidoActual() {
  const navigate = useNavigate();
  const items = usePedidoStore((s) => s.items);
  const nombreCliente = usePedidoStore((s) => s.nombreCliente);
  const indicacionesActivas = usePedidoStore((s) => s.indicacionesActivas);
  const indicaciones = usePedidoStore((s) => s.indicaciones);
  const setCantidad = usePedidoStore((s) => s.setCantidad);
  const setNombreCliente = usePedidoStore((s) => s.setNombreCliente);
  const setIndicacionesActivas = usePedidoStore((s) => s.setIndicacionesActivas);
  const setIndicaciones = usePedidoStore((s) => s.setIndicaciones);
  const clear = usePedidoStore((s) => s.clear);
  const total = usePedidoStore((s) => s.total());

  const [guardando, setGuardando] = useState(false);
  const [errorAlert, setErrorAlert] = useState<ErrorAlertContent | null>(null);

  async function guardarSinPagar() {
    if (items.length === 0 || guardando) {
      return;
    }

    setGuardando(true);
    setErrorAlert(null);
    try {
      const texto =
        indicacionesActivas && indicaciones.trim() !== '' ? indicaciones.trim() : null;
      await crearPedido({
        nombre_cliente: nombreCliente.trim() === '' ? null : nombreCliente.trim(),
        indicaciones: texto,
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
      setErrorAlert(mensajeErrorUsuario(error, 'No se pudo guardar el pedido'));
    } finally {
      setGuardando(false);
    }
  }

  return {
    items,
    nombreCliente,
    indicacionesActivas,
    indicaciones,
    total,
    setCantidad,
    setNombreCliente,
    setIndicacionesActivas,
    setIndicaciones,
    lineTotal: calcularLineTotal,
    vacio: items.length === 0,
    guardarSinPagar,
    guardando,
    errorAlert,
    clearErrorAlert: () => setErrorAlert(null),
  };
}
