import { defineConfig } from 'vitest/config';

// Pure TypeScript logic only (lib/**). Screens are checked in the browser preview.
export default defineConfig({
  test: {
    include: ['lib/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
