import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    env: {
      REQUIRE_AUTH: '0',
      ADMIN_INITIAL_PASSWORD: 'Admin123!',
    },
  },
});
