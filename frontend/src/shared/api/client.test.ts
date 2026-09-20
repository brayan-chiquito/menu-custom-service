import { describe, expect, it } from 'vitest';
import { getApiBaseUrl } from './client';

describe('api client', () => {
  it('should read API base from Vite env without hardcoding business URLs in callers', () => {
    expect(getApiBaseUrl()).toMatch(/^https?:\/\//);
  });
});
