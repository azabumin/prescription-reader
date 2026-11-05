-- Migration number: 0009 	 2026-11-05T12:00:00.000Z

-- Pharmacy console additions (docs/superpowers/specs/2026-11-05-pharmacy-console-features-design.md):
-- feedback the pharmacy sends from its console (read by the operator on /admin), and the last login per pharmacy.
CREATE TABLE pharmacy_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id),
  created_at TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX idx_pharmacy_feedback_created ON pharmacy_feedback(created_at);

ALTER TABLE pharmacies ADD COLUMN last_login_at TEXT;
