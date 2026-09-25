-- Migration number: 0003 	 2026-09-17T00:00:00.000Z

-- Tracks the manual continuous-reservation renewal cycle (see worker/src/payments.ts).
-- next_charge_due_at: when the next ZEUS 継続予約登録 charge (or free-month skip) is due.
-- billing_cycle_number: total months elapsed since the first real charge, including free
-- ones -- every 13th cycle (cycle_number % 13 == 0) is the loyalty free month.
ALTER TABLE users ADD COLUMN next_charge_due_at TEXT;
ALTER TABLE users ADD COLUMN billing_cycle_number INTEGER NOT NULL DEFAULT 0;
