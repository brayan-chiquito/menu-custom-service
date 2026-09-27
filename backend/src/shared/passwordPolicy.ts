/** Política de contraseñas al crear / resetear usuario. */
export const PASSWORD_POLICY_HINT =
  'Mínimo 8 caracteres, con letra, número y un carácter especial.';

export function validarPasswordPolitica(password: string): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return `La contraseña es demasiado corta. ${PASSWORD_POLICY_HINT}`;
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password)) {
    return `La contraseña debe incluir al menos una letra. ${PASSWORD_POLICY_HINT}`;
  }
  if (!/[0-9]/.test(password)) {
    return `La contraseña debe incluir al menos un número. ${PASSWORD_POLICY_HINT}`;
  }
  if (!/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(password)) {
    return `La contraseña debe incluir al menos un carácter especial. ${PASSWORD_POLICY_HINT}`;
  }
  return null;
}

export function passwordCumplePolitica(password: string): boolean {
  return validarPasswordPolitica(password) === null;
}
