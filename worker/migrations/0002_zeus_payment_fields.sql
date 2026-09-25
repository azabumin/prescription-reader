-- Migration number: 0002 	 2026-09-14T00:00:00.000Z

-- ZEUS LinkPoint requires the customer's phone number (telno) on the payment form;
-- we don't collect it at signup, only at first checkout.
ALTER TABLE users ADD COLUMN phone TEXT;

-- 'registered' means a card was authorized via a money=0 LinkPoint order (see
-- worker/src/payments.ts) but no real charge has happened yet -- the actual first
-- charge is scheduled later via ZEUS's dashboard-side "継続予約登録" (continuous
-- reservation) feature, per ZEUS's own recommendation (no batch API to build).
-- subscription_status stays 'trial' | 'active' | 'expired' | 'canceled' | 'registered'.
