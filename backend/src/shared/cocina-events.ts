import type { Response } from 'express';

const clients = new Set<Response>();

export function subscribeCocina(res: Response): void {
  clients.add(res);
  res.on('close', () => {
    clients.delete(res);
  });
}

/** Emite `data: {"type":"refresh"}\n\n` a todos los clientes SSE de cocina. */
export function emitCocinaRefresh(): void {
  const payload = `data: ${JSON.stringify({ type: 'refresh' })}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}

/** Solo para tests. */
export function cocinaClientCount(): number {
  return clients.size;
}
