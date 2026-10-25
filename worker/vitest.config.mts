import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.join(__dirname, 'migrations'));
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          // test-only values; real secrets are set with `wrangler secret put`
          bindings: {
            TEST_MIGRATIONS: migrations,
            PASSWORD_PEPPER: 'test-pepper',
            ANTHROPIC_API_KEY: 'test',
            ALLOWED_ORIGINS: 'https://rxhelper.jp',
          },
        },
      }),
    ],
    test: { setupFiles: ['./test/apply-migrations.ts'] },
  };
});
