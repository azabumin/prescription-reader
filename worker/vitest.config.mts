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
          // No real network from tests: Anthropic/Resend calls made in waitUntil get a canned failure.
          outboundService: () => new Response('{"error":"network disabled in tests"}', { status: 503 }),
          // test-only values; real secrets are set with `wrangler secret put`
          bindings: {
            TEST_MIGRATIONS: migrations,
            PASSWORD_PEPPER: 'test-pepper',
            ANTHROPIC_API_KEY: 'test',
            ALLOWED_ORIGINS: 'https://rxhelper.jp',
            RESEND_API_KEY: 'test-resend',
            ADMIN_TOKEN: 'test-admin-token-0123456789',
            OPERATOR_EMAIL: 'operator@example.jp',
          },
        },
      }),
    ],
    test: { setupFiles: ['./test/apply-migrations.ts'] },
  };
});
