import type { D1Migration } from 'cloudflare:test';

// `env` from 'cloudflare:workers' is typed as Cloudflare.Env; the app's own globals (secrets declared in
// src/index.ts) live on the global Env, so the test-only binding is added to both.
declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
  interface Env {
    TEST_MIGRATIONS: D1Migration[];
  }
}
