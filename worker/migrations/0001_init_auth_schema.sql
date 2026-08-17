-- Migration number: 0001 	 2026-08-16T22:56:24.070Z

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  trial_ends_at TEXT NOT NULL,
  -- 'trial' | 'active' | 'expired' | 'canceled'. Flipped to 'active' once ZEUS payment
  -- integration exists; for now every new signup just gets a 7-day trial.
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  subscription_expires_at TEXT
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
