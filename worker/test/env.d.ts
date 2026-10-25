import type { D1Migration } from 'cloudflare:test';

// `env` from 'cloudflare:workers' is typed as Cloudflare.Env; the app's secrets are declared on the global Env
// (src/index.ts), so Cloudflare.Env is widened to it and both get the test-only migrations binding.
declare global {
  type AppEnv = Env;
  namespace Cloudflare {
    interface Env extends AppEnv {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
  interface Env {
    TEST_MIGRATIONS: D1Migration[];
  }
}
