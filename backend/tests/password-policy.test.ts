import { describe, expect, it } from 'vitest';
import {
  PASSWORD_POLICY_HINT,
  passwordCumplePolitica,
  validarPasswordPolitica,
} from '../src/shared/passwordPolicy.js';

describe('passwordPolicy', () => {
  it('accepts strong passwords', () => {
    expect(passwordCumplePolitica('Admin123!')).toBe(true);
    expect(validarPasswordPolitica('Clave#99x')).toBeNull();
  });

  it('rejects short, missing letter, number or special', () => {
    expect(validarPasswordPolitica('Ab1!')).toContain('corta');
    expect(validarPasswordPolitica('abcdefgh!')).toContain('número');
    expect(validarPasswordPolitica('12345678!')).toContain('letra');
    expect(validarPasswordPolitica('Abcdefg1')).toContain('especial');
    expect(validarPasswordPolitica('Abcdefg1')).toContain(PASSWORD_POLICY_HINT.split('.')[0]);
  });
});
