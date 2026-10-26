import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The web build is a static export on GitHub Pages, which cannot map /pharmacy/<id> to pharmacy/[id].html:
// a reload or a direct link would 404. Pass ids as query parameters on fixed routes instead.
function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? routeFiles(join(dir, e.name)) : [join(dir, e.name)],
  );
}

describe('static hosting', () => {
  it('has no dynamic route segments under app/', () => {
    const dynamic = routeFiles(join(__dirname, '..', 'app')).filter((f) => /\[[^\]]+\]/.test(f));
    expect(dynamic).toEqual([]);
  });
});
