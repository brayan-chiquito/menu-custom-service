import { AppError } from './errors.js';

/**
 * Rate-limit de login fallido por IP (en memoria).
 * Un login exitoso limpia el contador de esa IP.
 */
const WINDOW_MS = Number(process.env.LOGIN_RATE_WINDOW_MS) || 60_000;
const MAX_FAILURES = Number(process.env.LOGIN_RATE_MAX) || 5;

type Bucket = { failures: number[] };

const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, now: number): void {
  bucket.failures = bucket.failures.filter((t) => now - t < WINDOW_MS);
}

export function assertLoginNotLocked(ip: string): void {
  const key = ip || 'unknown';
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket) return;
  prune(bucket, now);
  if (bucket.failures.length >= MAX_FAILURES) {
    throw new AppError(
      'Demasiados intentos de inicio de sesión. Espera un minuto e intenta de nuevo.',
      429,
    );
  }
}

export function recordLoginFailure(ip: string): void {
  const key = ip || 'unknown';
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { failures: [] };
    buckets.set(key, bucket);
  }
  prune(bucket, now);
  bucket.failures.push(now);
}

export function clearLoginFailures(ip: string): void {
  buckets.delete(ip || 'unknown');
}

/** Solo para tests. */
export function _resetLoginRateLimitForTests(): void {
  buckets.clear();
}
