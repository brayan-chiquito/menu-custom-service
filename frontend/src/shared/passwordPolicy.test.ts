import { describe, expect, it } from 'vitest';
import { passwordCumplePolitica, validarPasswordPolitica } from './passwordPolicy';

describe('passwordPolicy', () => {
  it('accepts strong passwords', () => {
    expect(passwordCumplePolitica('Admin123!')).toBe(true);
  });

  it('rejects weak passwords', () => {
    expect(validarPasswordPolitica('admin123')).not.toBeNull();
    expect(validarPasswordPolitica('Abcdefg1')).toContain('especial');
  });
});
