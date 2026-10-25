// Cloudflare Worker backend URL. See worker/README.md for how this was deployed.
// EXPO_PUBLIC_WORKER_URL (e.g. http://localhost:8787 with `wrangler dev`) points a local dev build at a local Worker.
export const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://prescription-reader-api.food-calorie-scanner-worker.workers.dev';
