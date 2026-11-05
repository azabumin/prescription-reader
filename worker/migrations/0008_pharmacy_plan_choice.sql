-- Migration number: 0008 	 2026-11-05T00:00:00.000Z

-- The pharmacy chooses its own plan in the console (app/pharmacy/plan.tsx, POST /pharmacy/plan) and can change it later.
-- NULL = not chosen yet: the console opens the plan screen first, and patients cannot send to the pharmacy.
-- new-pharmacy.mjs leaves it NULL unless the operator passes --plan.
ALTER TABLE pharmacies ADD COLUMN plan_chosen_at TEXT;

-- Pharmacies registered before this migration had their plan set by the operator: keep it, don't ask again.
UPDATE pharmacies SET plan_chosen_at = created_at;
