import type {
  Notificador,
  PedidoDTO,
  ResultadoNotificacion,
  WhatsappEstadoNotificador,
} from './notificador.interface.js';
import { formatearMensajePedido } from './notificador.interface.js';

/** Notificador de desarrollo: loggea y reporta éxito. */
export class FakeNotificador implements Notificador {
  constructor(private readonly getDestinos?: () => string[]) {}

  async enviar(pedido: PedidoDTO): Promise<ResultadoNotificacion> {
    const destinos = this.getDestinos?.() ?? [];
    console.log(
      `[FakeNotificador] destinos=${destinos.length ? destinos.join(',') : '(ninguno)'}\n${formatearMensajePedido(pedido)}`,
    );
    return { enviada: true };
  }

  getEstado(): WhatsappEstadoNotificador {
    return { activa: true, qr: null };
  }
}
