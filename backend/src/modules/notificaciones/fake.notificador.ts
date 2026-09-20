import type {
  Notificador,
  PedidoDTO,
  ResultadoNotificacion,
} from './notificador.interface.js';
import { formatearMensajePedido } from './notificador.interface.js';

/** Notificador de desarrollo: loggea y reporta éxito. */
export class FakeNotificador implements Notificador {
  async enviar(pedido: PedidoDTO): Promise<ResultadoNotificacion> {
    console.log(`[FakeNotificador]\n${formatearMensajePedido(pedido)}`);
    return { enviada: true };
  }
}
