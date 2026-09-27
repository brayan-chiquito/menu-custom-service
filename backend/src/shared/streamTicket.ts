import { randomBytes } from 'node:crypto';
import { AppError } from './errors.js';
import type { UsuarioPublico } from '../modules/auth/auth.types.js';

const TTL_MS = Number(process.env.SSE_TICKET_TTL_MS) || 120_000;

type TicketEntry = {
  usuario: UsuarioPublico;
  expiresAt: number;
};

const tickets = new Map<string, TicketEntry>();

function prune(): void {
  const now = Date.now();
  for (const [k, v] of tickets) {
    if (v.expiresAt <= now) {
      tickets.delete(k);
    }
  }
}

/** Ticket corto para EventSource (no es el token de sesión). */
export function issueStreamTicket(usuario: UsuarioPublico): { ticket: string; expiresIn: number } {
  prune();
  const ticket = randomBytes(16).toString('hex');
  tickets.set(ticket, { usuario, expiresAt: Date.now() + TTL_MS });
  return { ticket, expiresIn: Math.floor(TTL_MS / 1000) };
}

export function resolveStreamTicket(ticket: string): UsuarioPublico {
  prune();
  const entry = tickets.get(ticket);
  if (!entry || entry.expiresAt <= Date.now()) {
    tickets.delete(ticket);
    throw new AppError('Ticket de stream inválido o expirado', 401);
  }
  return entry.usuario;
}

export function _resetStreamTicketsForTests(): void {
  tickets.clear();
}
