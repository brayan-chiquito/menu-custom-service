import type { Request, Response } from 'express';

export const SESSION_COOKIE = 'platanopolis_session';

function cookieSecure(): boolean {
  return process.env.COOKIE_SECURE === '1';
}

function maxAgeSeconds(): number {
  const hours = Number(process.env.SESSION_TTL_HOURS) || 24;
  const safe = Number.isFinite(hours) && hours > 0 ? hours : 24;
  return Math.floor(safe * 3600);
}

export function readSessionCookie(req: Request): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq);
    if (name !== SESSION_COOKIE) continue;
    const value = trimmed.slice(eq + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

export function setSessionCookie(res: Response, token: string): void {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds()}`,
  ];
  if (cookieSecure()) {
    parts.push('Secure');
  }
  res.append('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response): void {
  const parts = [
    `${SESSION_COOKIE}=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (cookieSecure()) {
    parts.push('Secure');
  }
  res.append('Set-Cookie', parts.join('; '));
}
