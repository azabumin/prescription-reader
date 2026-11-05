-- Migration number: 0010 	 2026-11-06T00:00:00.000Z

-- Tokens used by each Anthropic API call, added up per day, pharmacy (0 = not a pharmacy: the reader on rxhelper.jp,
-- the pharmacy memo), feature and model -- for the admin screen's cost estimate (src/aiUsage.ts). No content.
CREATE TABLE ai_usage_daily (
  day TEXT NOT NULL,                      -- YYYY-MM-DD (UTC)
  pharmacy_id INTEGER NOT NULL DEFAULT 0,
  feature TEXT NOT NULL,                  -- reader | memo | intake_read | intake_translate | walkin | message
  model TEXT NOT NULL,
  calls INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,  -- includes thinking tokens
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, pharmacy_id, feature, model)
);
