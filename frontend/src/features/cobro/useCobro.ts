import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  confirmarPedido,
  crearPedido,
  fetchPedidoById,
  registrarPago,
} from '../../shared/api/pedidosApi';
import {
  mensajeErrorUsuario,
  type ErrorAlertContent,
} from '../../shared/errors/mensajeErrorUsuario';
import { usePedidoStore } from '../pedido-actual/pedidoStore';

type CobroPhase =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'submitting' }
  | {
      status: 'done';
      notificacion: { enviada: boolean; mensaje: string };
    }
  | { status: 'error'; alert: ErrorAlertContent };

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
  const indicacionesActivas = usePedidoStore((s) => s.indicacionesActivas);
  const indicaciones = usePedidoStore((s) => s.indicaciones);
  const cartTotal = usePedidoStore((s) => s.total());
  const clear = usePedidoStore((s) => s.clear);

  const [pendiente, setPendiente] = useState<PedidoPendienteInfo | null>(null);
  const [montoRecibido, setMontoRecibido] = useState('');
  const [esTransferencia, setEsTransferencia] = useState(false);
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
            alert: {
              title: 'No se pudo cargar el pedido',
              message: 'Este pedido ya no está pendiente de cobro',
            },
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
            alert: mensajeErrorUsuario(error, 'No se pudo cargar el pedido'),
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

  const monto = esTransferencia ? total : Number(montoRecibido.replace(/\D/g, '')) || 0;
  const vuelto = monto - total;
  const puedeConfirmar =
    monto >= total &&
    total > 0 &&
    phase.status !== 'submitting' &&
    phase.status !== 'loading' &&
    (!modoPendiente || pendiente !== null);

  const resumenVuelto = useMemo(() => {
    if (esTransferencia) {
      return '$0';
    }
    if (!montoRecibido) {
      return 'Ingresa el monto recibido';
    }
    if (monto < total) {
      return `Faltan $${(total - monto).toLocaleString('es-CO')}`;
    }
    return `$${vuelto.toLocaleString('es-CO')}`;
  }, [esTransferencia, monto, montoRecibido, total, vuelto]);

  function setTransferencia(checked: boolean) {
    setEsTransferencia(checked);
    if (checked && total > 0) {
      setMontoRecibido(String(total));
    } else {
      setMontoRecibido('');
    }
  }

  // Si carga el pendiente o cambia el total con transferencia ya marcada, sincroniza monto.
  useEffect(() => {
    if (esTransferencia && total > 0) {
      setMontoRecibido(String(total));
    }
  }, [esTransferencia, total]);

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
          indicaciones:
            indicacionesActivas && indicaciones.trim() !== '' ? indicaciones.trim() : null,
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

      await registrarPago(id, monto, esTransferencia);
      const confirmado = await confirmarPedido(id);

      setPhase({
        status: 'done',
        notificacion: confirmado.notificacion,
      });
      clear();
    } catch (error: unknown) {
      setPhase({
        status: 'error',
        alert: mensajeErrorUsuario(error, 'No se pudo confirmar el pago'),
      });
    }
  }

  function clearErrorAlert() {
    if (phase.status === 'error') {
      setPhase({ status: 'idle' });
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
    esTransferencia,
    setTransferencia,
    resumenVuelto,
    puedeConfirmar,
    phase,
    copiado,
    confirmarPago,
    copiarPedido,
    nuevoPedido,
    clearErrorAlert,
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
