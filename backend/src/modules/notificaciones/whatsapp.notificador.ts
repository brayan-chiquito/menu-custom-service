import path from 'node:path';
import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
import type {
  Notificador,
  PedidoDTO,
  ResultadoNotificacion,
  WhatsappEstadoNotificador,
} from './notificador.interface.js';
import { formatearMensajePedido } from './notificador.interface.js';

const { Client, LocalAuth } = pkg;

/**
 * WhatsAppNotificador con sesión persistida en disco.
 * Envía a todos los destinos provistos por getDestinos().
 * Nunca lanza: si falla el envío, loggea y retorna { enviada: false }.
 */
export class WhatsappNotificador implements Notificador {
  private readonly client: InstanceType<typeof Client>;
  private ready = false;
  private lastQr: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly getDestinos: () => string[],
    authPath: string = process.env.WWEBJS_AUTH_PATH ??
      path.join(process.cwd(), '.wwebjs_auth'),
  ) {
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: authPath }),
      puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      },
    });

    this.client.on('qr', (qr: string) => {
      this.lastQr = qr;
      console.log('[WhatsApp] Escanea el QR para vincular la sesión (teléfono que ENVÍA):');
      console.log(
        `[WhatsApp] Abre esta URL en el PC y escanea la imagen:\nhttps://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`,
      );
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.ready = true;
      this.lastQr = null;
      console.log('[WhatsApp] Cliente listo (sesión persistida; no hace falta QR otra vez)');
    });

    this.client.on('authenticated', () => {
      console.log('[WhatsApp] Autenticado; restaurando sesión…');
    });

    this.client.on('auth_failure', (message: string) => {
      console.error('[WhatsApp] Fallo de autenticación:', message);
      this.ready = false;
    });

    this.client.on('disconnected', (reason: string) => {
      console.error('[WhatsApp] Desconectado:', reason);
      this.ready = false;
      // No borrar LocalAuth: la sesión en disco se reutiliza al reconectar.
    });
  }

  getEstado(): WhatsappEstadoNotificador {
    return {
      activa: this.ready,
      qr: this.ready ? null : this.lastQr,
    };
  }

  async iniciar(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.client.initialize().catch((error: unknown) => {
        console.error('[WhatsApp] No se pudo inicializar el cliente:', error);
        this.initPromise = null;
      });
    }
    await this.initPromise;
  }

  async enviar(pedido: PedidoDTO): Promise<ResultadoNotificacion> {
    try {
      await this.iniciar();

      if (!this.ready) {
        console.error(
          `[WhatsApp] Cliente no listo; no se envió el pedido #${pedido.id}`,
        );
        return { enviada: false };
      }

      const destinos = this.getDestinos().map((n) => n.trim()).filter(Boolean);
      if (destinos.length === 0) {
        console.error(
          `[WhatsApp] Sin destinos configurados; no se envió el pedido #${pedido.id}`,
        );
        return { enviada: false };
      }

      const mensaje = formatearMensajePedido(pedido);
      const resultados = await Promise.all(
        destinos.map(async (numero) => {
          try {
            await this.client.sendMessage(normalizarChatId(numero), mensaje);
            return true;
          } catch (error) {
            console.error(
              `[WhatsApp] Error al enviar pedido #${pedido.id} a ${numero}:`,
              error,
            );
            return false;
          }
        }),
      );

      const enviada = resultados.every(Boolean);
      return { enviada };
    } catch (error) {
      console.error(
        `[WhatsApp] Error al enviar pedido #${pedido.id}; el pedido permanece pagado:`,
        error,
      );
      return { enviada: false };
    }
  }
}

function normalizarChatId(numero: string): string {
  const digits = numero.replace(/\D/g, '');
  return `${digits}@c.us`;
}
