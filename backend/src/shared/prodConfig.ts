/**
 * Solo corre si ENFORCE_PROD_CONFIG=1 (deploy nube/VPN).
 * El arranque local y QA no lo activan.
 */
export function assertProdConfig(): void {
  if (process.env.ENFORCE_PROD_CONFIG !== '1') {
    return;
  }

  const problems: string[] = [];
  if (process.env.REQUIRE_AUTH === '0') {
    problems.push('REQUIRE_AUTH no puede ser 0');
  }
  if (process.env.COOKIE_SECURE !== '1') {
    problems.push('COOKIE_SECURE=1 (la UI debe ir por HTTPS)');
  }
  if (!process.env.CORS_ORIGINS?.trim()) {
    problems.push('CORS_ORIGINS es obligatorio (origen público de la UI)');
  }

  if (problems.length > 0) {
    throw new Error(`Configuración de producción inválida:\n- ${problems.join('\n- ')}`);
  }
}
