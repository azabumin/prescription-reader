-- Migration number: 0007 	 2026-11-01T00:00:00.000Z

-- Pharmacy plans (docs/superpowers/specs/2026-11-01-pharmacy-ab-plans-design.md):
--   'A'  = stock / shortage check of walk-in prescriptions only (no patient sending)
--   'B'  = patient sending + questionnaire inbox only (no medicine reading, no stock check)
--   'AB' = both -- every pharmacy registered before this migration
ALTER TABLE pharmacies ADD COLUMN plan TEXT NOT NULL DEFAULT 'AB' CHECK (plan IN ('A', 'B', 'AB'));

-- No schema change, noted here: intakes.drugs_status may now also be 'skipped' (plan B, medicines not read), and
-- intake_events.event may be 'walkin_check' (one plan-A check; nothing else about it is stored).
