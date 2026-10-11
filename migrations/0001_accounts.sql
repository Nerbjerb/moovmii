-- Phase 1: accounts & devices schema (additive; existing kiosk tables untouched).
-- Mirrors shared/authSchema.ts. Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS accounts (
  id         varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text,
  name       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS identities (
  id         varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id varchar NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider   text NOT NULL,
  subject    text NOT NULL,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS identities_provider_subject_unique ON identities (provider, subject);

CREATE TABLE IF NOT EXISTS devices (
  id             varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id      text NOT NULL UNIQUE,
  account_id     varchar REFERENCES accounts(id) ON DELETE SET NULL,
  name           text,
  device_token   text NOT NULL UNIQUE,
  config_version integer NOT NULL DEFAULT 0,
  paired_at      timestamptz,
  last_seen_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pairing_codes (
  code        varchar PRIMARY KEY,
  device_id   varchar NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_settings (
  device_id        varchar PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  temperature_unit text NOT NULL DEFAULT 'fahrenheit',
  clock_format     text NOT NULL DEFAULT '12hr',
  transport_rows   integer NOT NULL DEFAULT 2,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_onboarding (
  device_id     varchar PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  location_type text,
  other_label   text,
  address       text,
  lat           real,
  lon           real,
  modes         jsonb,
  completed_at  timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_favorites (
  id        varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id varchar NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  line      text NOT NULL,
  stop      text NOT NULL,
  direction text NOT NULL,
  position  integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS device_favorites_unique ON device_favorites (device_id, line, stop, direction);

CREATE TABLE IF NOT EXISTS device_preferences (
  id        varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id varchar NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  row       integer NOT NULL,
  line      text NOT NULL,
  stop      text NOT NULL,
  direction text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS device_preferences_row_unique ON device_preferences (device_id, row);
