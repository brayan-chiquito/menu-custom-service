import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  confirmarPedido,
  crearPedido,
  fetchPedidoById,
  registrarPago,
} from '../../shared/api/pedidosApi';
import { usePedidoStore } from '../pedido-actual/pedidoStore';

type CobroPhase =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'submitting' }
  | {
      status: 'done';
      notificacion: { enviada: boolean; mensaje: string };
    }
  | { status: 'error'; message: string };

type PedidoPendienteInfo = {
  id: number;
  nombre_cliente: string;
  total: number;
  estado: 'pendiente' | 'pagado';
};

export function useCobro() {
  const navigate = useNavigate();
  const { pedidoId: pedidoIdParam } = useParams<{ pedidoId?: string }>();
  const pedidoIdFromRoute =
    pedidoIdParam && Number.isInteger(Number(pedidoIdParam)) ? Number(pedidoIdParam) : null;

  const items = usePedidoStore((s) => s.items);
  const nombreCliente = usePedidoStore((s) => s.nombreCliente);
  const cartTotal = usePedidoStore((s) => s.total());
  const clear = usePedidoStore((s) => s.clear);

  const [pendiente, setPendiente] = useState<PedidoPendienteInfo | null>(null);
  const [montoRecibido, setMontoRecibido] = useState('');
  const [phase, setPhase] = useState<CobroPhase>(
    pedidoIdFromRoute ? { status: 'loading' } : { status: 'idle' },
  );
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (pedidoIdFromRoute === null) {
      setPendiente(null);
      return;
    }

    let cancelled = false;
    setPhase({ status: 'loading' });
    fetchPedidoById(pedidoIdFromRoute)
      .then((pedido) => {
        if (cancelled) {
          return;
        }
        if (pedido.estado !== 'pendiente') {
          setPhase({
            status: 'error',
            message: 'Este pedido ya no está pendiente de cobro',
          });
          return;
        }
        setPendiente({
          id: pedido.id,
          nombre_cliente: pedido.nombre_cliente,
          total: pedido.total,
          estado: pedido.estado,
        });
        setPhase({ status: 'idle' });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPhase({
            status: 'error',
            message: error instanceof Error ? error.message : 'No se pudo cargar el pedido',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pedidoIdFromRoute]);

  const modoPendiente = pedidoIdFromRoute !== null;
  const total = modoPendiente ? (pendiente?.total ?? 0) : cartTotal;
  const contextoNombre = modoPendiente ? (pendiente?.nombre_cliente ?? '') : nombreCliente;

  const monto = Number(montoRecibido.replace(/\D/g, '')) || 0;
  const vuelto = monto - total;
  const puedeConfirmar =
    monto >= total &&
    total > 0 &&
    phase.status !== 'submitting' &&
    phase.status !== 'loading' &&
    (!modoPendiente || pendiente !== null);

  const resumenVuelto = useMemo(() => {
    if (!montoRecibido) {
      return 'Ingresa el monto recibido';
    }
    if (monto < total) {
      return `Faltan $${(total - monto).toLocaleString('es-CO')}`;
    }
    return `$${vuelto.toLocaleString('es-CO')}`;
  }, [monto, montoRecibido, total, vuelto]);

  async function confirmarPago() {
    if (!puedeConfirmar) {
      return;
    }

    setPhase({ status: 'submitting' });
    try {
      let id: number;
      if (modoPendiente && pendiente) {
        id = pendiente.id;
      } else {
        const creado = await crearPedido({
          nombre_cliente: nombreCliente.trim() === '' ? null : nombreCliente.trim(),
          items: items.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            base_id: item.base_id,
            salsa_ids: item.salsa_ids,
            proteina_id: item.proteina_id,
            adiciones: item.adiciones.map((a: { id: number }) => a.id),
          })),
        });
        id = creado.id;
      }

      await registrarPago(id, monto);
      const confirmado = await confirmarPedido(id);

      setPhase({
        status: 'done',
        notificacion: confirmado.notificacion,
      });
      clear();
    } catch (error: unknown) {
      setPhase({
        status: 'error',
        message: error instanceof Error ? error.message : 'No se pudo confirmar el pago',
      });
    }
  }

  async function copiarPedido() {
    if (phase.status !== 'done') {
      return;
    }
    await navigator.clipboard.writeText(phase.notificacion.mensaje);
    setCopiado(true);
  }

  function nuevoPedido() {
    clear();
    navigate('/');
  }

  const vacio =
    !modoPendiente && items.length === 0 && phase.status === 'idle';

  return {
    total,
    montoRecibido,
    setMontoRecibido,
    resumenVuelto,
    puedeConfirmar,
    phase,
    copiado,
    confirmarPago,
    copiarPedido,
    nuevoPedido,
    vacio,
    modoPendiente,
    contexto:
      modoPendiente && pendiente
        ? `Pedido #${pendiente.id} · ${contextoNombre} · Pendiente`
        : null,
    backTo: modoPendiente ? '/historial' : '/resumen',
    backLabel: modoPendiente ? '← Historial' : '← Resumen',
  };
}
