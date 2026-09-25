-- Migration number: 0005 	 2026-09-25T00:00:00.000Z

-- Set when the customer stops the next renewal from My Page. Access continues until the paid
-- period ends; the monthly "who's due" list must skip anyone with this set. Cleared again if
-- they undo the cancellation in time or pay a fresh subscription after the period lapsed.
ALTER TABLE users ADD COLUMN canceled_at TEXT;
