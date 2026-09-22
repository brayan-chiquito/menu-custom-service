/** Colombia no usa DST: UTC−5 todo el año. */
export const TZ_BOGOTA = 'America/Bogota';
export const SQLITE_BOGOTA_OFFSET = '-5 hours';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  /** 0 = domingo … 6 = sábado (como Date#getDay). */
  weekday: number;
};

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getBogotaParts(date: Date = new Date()): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ_BOGOTA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      map[p.type] = p.value;
    }
  }

  const weekday = WEEKDAY_MAP[map.weekday ?? ''];
  if (weekday === undefined) {
    throw new Error(`No se pudo resolver weekday Bogotá: ${map.weekday}`);
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    weekday,
  };
}

/** Fecha YYYY-MM-DD en America/Bogota. */
export function formatFechaBogota(date: Date = new Date()): string {
  const p = getBogotaParts(date);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/**
 * Expresión SQLite: calendario del instante `column` en Bogotá.
 * `created_at` se guarda con datetime('now') (UTC).
 */
export function sqlDateBogota(column: string): string {
  return `date(${column}, '${SQLITE_BOGOTA_OFFSET}')`;
}
