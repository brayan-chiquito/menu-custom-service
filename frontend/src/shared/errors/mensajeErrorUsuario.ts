import { ApiError } from '../api/client';

export type ErrorAlertContent = {
  title: string;
  message: string;
};

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 0) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const msg = error.message.toLowerCase();
  return (
    error.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed')
  );
}

/**
 * Traduce errores técnicos a copia usable por el operador (RF-21).
 */
export function mensajeErrorUsuario(
  error: unknown,
  fallbackTitle: string,
): ErrorAlertContent {
  if (isNetworkFailure(error)) {
    return {
      title: fallbackTitle,
      message: 'Sin conexión. Revisa la red e intenta de nuevo.',
    };
  }

  if (error instanceof ApiError) {
    const apiMsg = error.message.trim();
    if (apiMsg && !/^HTTP \d+/i.test(apiMsg) && !apiMsg.toLowerCase().includes('failed to fetch')) {
      return { title: fallbackTitle, message: apiMsg };
    }
    if (error.status >= 500) {
      return {
        title: fallbackTitle,
        message: 'El servidor no respondió. Intenta de nuevo en un momento.',
      };
    }
  }

  if (error instanceof Error && error.message.trim() !== '') {
    const msg = error.message.trim();
    if (!/^HTTP \d+/i.test(msg) && !msg.toLowerCase().includes('failed to fetch')) {
      return { title: fallbackTitle, message: msg };
    }
  }

  return {
    title: fallbackTitle,
    message: 'Intenta de nuevo en un momento.',
  };
}
