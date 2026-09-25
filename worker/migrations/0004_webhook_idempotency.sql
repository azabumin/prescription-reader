-- Migration number: 0004 	 2026-09-17T00:00:00.000Z
-- Note: this column was applied directly via `wrangler d1 execute` moments before this file
-- was added (see chat history) -- kept here so a fresh DB setup still gets it via migrations.

-- Tracks ZEUS's unique transaction id (ordd) last processed for this user, so a retried CGI
-- callback for the *same* transaction (ZEUS auto-retries up to 5x on timeout/disconnect) isn't
-- double-counted as a second month of billing. See worker/src/payments.ts.
ALTER TABLE users ADD COLUMN last_processed_ordd TEXT;
